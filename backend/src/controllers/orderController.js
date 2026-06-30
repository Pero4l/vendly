const { Order, OrderItem, Product, Store, StoreProfile, Escrow, Wallet, Transaction, User, sequelize } = require('../models');
const notificationService = require('../services/notificationService');
const celoService = require('../blockchain/celoService');
const { decrypt } = require('../utils/encryption');

function generateOrderNumber() {
  return 'VND-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

async function createOrder(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const { items, shippingAddress } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must include at least one item' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    let subtotal = 0;
    const resolvedItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.status === 'suspended' || product.status === 'deleted') {
        throw new Error(`Product "${product.title}" is not available`);
      }
      if (product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for "${product.title}"`);
      }

      // Get the seller user id through the store
      const store = await Store.findByPk(product.storeId, {
        include: [{ model: StoreProfile, as: 'storeProfile', attributes: ['userId'] }],
        transaction
      });
      if (!store) throw new Error('Store not found for product');

      const unitPrice = parseFloat(product.price);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      resolvedItems.push({ product, store, unitPrice, totalPrice, quantity: item.quantity, sellerId: store.storeProfile.userId });
    }

    const totalAmount = subtotal; // no tax/shipping for escrow model

    const order = await Order.create({
      buyerId: req.user.id,
      orderNumber: generateOrderNumber(),
      shippingAddress: typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress,
      subtotal,
      shippingFee: 0,
      tax: 0,
      totalAmount,
      paymentMethod: 'escrow',
      status: 'pending'
    }, { transaction });

    for (const ri of resolvedItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: ri.product.id,
        sellerId: ri.sellerId,
        quantity: ri.quantity,
        unitPrice: ri.unitPrice,
        totalPrice: ri.totalPrice
      }, { transaction });

      // Deduct stock
      await ri.product.update({
        quantity: ri.product.quantity - ri.quantity,
        status: (ri.product.quantity - ri.quantity) <= 0 ? 'out_of_stock' : ri.product.status
      }, { transaction });
    }

    await Escrow.create({
      orderId: order.id,
      buyerId: req.user.id,
      sellerId: resolvedItems[0].sellerId,
      amount: totalAmount,
      releasedAmount: 0,
      remainingAmount: totalAmount,
      stage: 0,
      status: 'active'
    }, { transaction });

    await transaction.commit();

    // Notify sellers
    const notifiedSellers = new Set();
    for (const ri of resolvedItems) {
      if (!notifiedSellers.has(ri.sellerId)) {
        try {
          await notificationService.notifyUser(ri.sellerId, 'New Order', `Order ${order.orderNumber} placed for your store.`, 'order');
        } catch {}
        notifiedSellers.add(ri.sellerId);
      }
    }

    try {
      await notificationService.notifyUser(req.user.id, 'Order Placed', `Your order ${order.orderNumber} is confirmed and secured in escrow.`, 'order');
    } catch {}

    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ success: false, message: error.message });
  }
}

async function confirmPayment(req, res, next) {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });

    const order = await Order.findByPk(orderId, { include: [{ model: Escrow, as: 'escrow' }] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.buyerId !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });
    if (order.status === 'paid') return res.status(400).json({ success: false, message: 'Order already paid' });

    const buyerWallet = await Wallet.findOne({ where: { userId: order.buyerId } });
    if (!buyerWallet) return res.status(400).json({ success: false, message: 'Buyer wallet not found' });

    const orderAmount = parseFloat(order.totalAmount);
    let finalTxHash = null;
    let paidViaChain = false;

    // Check and deduct DB balance first (always — DB is the source of truth)
    const dbBalance = parseFloat(buyerWallet.celoBalance || 0);
    if (dbBalance < orderAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You have ${dbBalance.toFixed(4)} CELO but need ${orderAmount.toFixed(4)} CELO.`
      });
    }
    await buyerWallet.update({ celoBalance: dbBalance - orderAmount });

    // Also try to lock funds on-chain (escrow contract, testnet/mainnet)
    if (order.escrow) {
      try {
        const sellerWallet = await Wallet.findOne({ where: { userId: order.escrow.sellerId } });
        if (sellerWallet) {
          const buyerPrivateKey = decrypt(buyerWallet.encryptedPrivateKey);
          finalTxHash = await celoService.lockEscrowFunds(
            order.id,
            buyerWallet.address,
            sellerWallet.address,
            'CELO',
            orderAmount,
            buyerPrivateKey
          );
          paidViaChain = true;
        }
      } catch (onChainErr) {
        console.warn('[Payment] On-chain lockEscrowFunds failed (DB balance was deducted):', onChainErr.message);
      }
    }

    // Payment succeeded — commit the order and record the transaction
    const dbTx = await sequelize.transaction();
    try {
      await order.update({ status: 'paid' }, { transaction: dbTx });

      if (order.escrow && finalTxHash) {
        await order.escrow.update({ contractTxHash: finalTxHash }, { transaction: dbTx });
      }

      await Transaction.create({
        walletId: buyerWallet.id,
        orderId: order.id,
        type: 'purchase',
        token: 'CELO',
        amount: orderAmount,
        txHash: finalTxHash,
        status: 'success'
      }, { transaction: dbTx });

      await dbTx.commit();
    } catch (dbErr) {
      await dbTx.rollback();
      throw dbErr;
    }

    try {
      await notificationService.notifyUser(order.buyerId, 'Payment Confirmed', `Payment for order ${order.orderNumber} is locked in escrow.`, 'escrow');
    } catch {}

    res.status(200).json({ success: true, message: 'Payment confirmed', data: { ...order.toJSON(), txHash: finalTxHash } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status, trackingNumber, carrier } = req.body;
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }]
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Check if the requester is seller of items in this order or admin
    if (req.user.role !== 'admin') {
      const storeProfile = await StoreProfile.findOne({ where: { userId: req.user.id } });
      const store = storeProfile ? await Store.findOne({ where: { storeProfileId: storeProfile.id } }) : null;
      const productIds = order.items.map(i => i.productId);
      const sellerProducts = await Product.findAll({ where: { id: productIds, storeId: store?.id || 'none' } });
      if (sellerProducts.length === 0) {
        return res.status(403).json({ success: false, message: 'Unauthorized: you do not own items in this order' });
      }
    }

    await order.update({ status });

    try {
      await notificationService.notifyUser(order.buyerId, 'Order Updated', `Your order ${order.orderNumber} status: ${status}.`, 'order');
    } catch {}

    res.status(200).json({ success: true, message: 'Order status updated', data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getOrders(req, res, next) {
  try {
    let whereClause = {};

    if (req.user.role === 'seller') {
      // Find seller's store products, then orders containing those products
      const storeProfile = await StoreProfile.findOne({ where: { userId: req.user.id } });
      if (!storeProfile) return res.status(200).json({ success: true, data: [] });
      const store = await Store.findOne({ where: { storeProfileId: storeProfile.id } });
      if (!store) return res.status(200).json({ success: true, data: [] });

      const storeProducts = await Product.findAll({ where: { storeId: store.id }, attributes: ['id'] });
      if (storeProducts.length === 0) return res.status(200).json({ success: true, data: [] });

      const productIds = storeProducts.map(p => p.id);
      const sellerItems = await OrderItem.findAll({ where: { productId: productIds }, attributes: ['orderId'] });
      const orderIds = [...new Set(sellerItems.map(i => i.orderId))];
      if (orderIds.length === 0) return res.status(200).json({ success: true, data: [] });

      whereClause = { id: orderIds };
    } else if (req.user.role === 'admin') {
      // Admin sees all orders
    } else {
      // Buyer sees their own orders
      whereClause = { buyerId: req.user.id };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: OrderItem, as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'title', 'images', 'price'] }]
        },
        { model: Escrow, as: 'escrow' },
        { model: User, as: 'buyer', attributes: ['id', 'fullName', 'username', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Escrow, as: 'escrow' },
        { model: User, as: 'buyer', attributes: ['id', 'fullName', 'username', 'email'] }
      ]
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.buyerId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

module.exports = { createOrder, confirmPayment, updateStatus, getOrders, getOrderById };
