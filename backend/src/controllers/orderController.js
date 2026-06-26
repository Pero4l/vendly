const { Order, OrderItem, Product, Store, Escrow, sequelize } = require('../models');
const { addTxMonitorJob } = require('../jobs/queue');
const notificationService = require('../services/notificationService');

async function createOrder(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const { items, shippingAddress } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Invalid order request' });
    }

    let totalAmount = BigInt(0);
    let storeId = null;

    // Verify products and calculate total cost
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product || product.status !== 'ACTIVE' || product.quantity < item.quantity) {
        throw new Error(`Product ${item.productId} is unavailable or insufficient stock`);
      }

      if (storeId === null) {
        storeId = product.storeId;
      } else if (storeId !== product.storeId) {
        throw new Error('Order items must be from the same store');
      }

      const cost = BigInt(Math.round(parseFloat(product.price) * 1e18)) * BigInt(item.quantity);
      totalAmount += cost;
    }

    const orderAmountDecimal = parseFloat(totalAmount) / 1e18;

    // Create order
    const order = await Order.create({
      buyerId: req.user.id,
      storeId,
      status: 'PENDING',
      totalAmount: orderAmountDecimal,
      shippingAddress
    }, { transaction });

    // Create order items
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      }, { transaction });

      // Deduct stock temporarily
      product.quantity -= item.quantity;
      if (product.quantity === 0) product.status = 'OUT_OF_STOCK';
      await product.save({ transaction });
    }

    // Initialize Database Escrow Record
    await Escrow.create({
      orderId: order.id,
      totalAmount: orderAmountDecimal,
      releasedAmount: 0.0,
      stage: 0,
      status: 'LOCKED'
    }, { transaction });

    await transaction.commit();

    // Notify seller of pending order
    const store = await Store.findByPk(storeId);
    if (store) {
      await notificationService.notifyUser(
        store.ownerId,
        'New Order Received',
        `You have a new order: ${order.id} for amount ${orderAmountDecimal} CELO/Tokens.`,
        'order_status'
      );
    }

    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ success: false, message: error.message });
  }
}

async function confirmPayment(req, res, next) {
  try {
    const { orderId, txHash } = req.body;
    if (!orderId || !txHash) {
      return res.status(400).json({ success: false, message: 'Missing payment confirmation parameters' });
    }

    const order = await Order.findByPk(orderId, { include: [{ model: Escrow, as: 'escrow' }] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.txHash = txHash;
    order.status = 'PAID';
    await order.save();

    if (order.escrow) {
      order.escrow.status = 'LOCKED';
      await order.escrow.save();
    }

    // Add background job to verify payment on Celo
    // await addTxMonitorJob(txHash, order.id);

    // Notify buyer
    await notificationService.notifyUser(
      order.buyerId,
      'Payment Confirmed',
      `Payment of ${order.totalAmount} for order ${order.id} is confirmed and locked in Escrow.`,
      'order_status'
    );

    res.status(200).json({ success: true, message: 'Payment registered, pending blockchain confirmation', data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Store, as: 'store' }]
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Seller updates: PAID -> PROCESSING -> SHIPPED
    if (order.store.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized status update' });
    }

    order.status = status;
    await order.save();

    // Notify buyer
    await notificationService.notifyUser(
      order.buyerId,
      'Order Status Updated',
      `Your order ${order.id} has been marked as ${status}.`,
      'order_status'
    );

    res.status(200).json({ success: true, message: 'Status updated successfully', data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getOrders(req, res, next) {
  try {
    const filters = {};
    if (req.user.role === 'BUYER') {
      filters.buyerId = req.user.id;
    } else if (req.user.role === 'SELLER') {
      const store = await Store.findOne({ where: { ownerId: req.user.id } });
      if (!store) return res.status(200).json({ success: true, data: [] });
      filters.storeId = store.id;
    }

    const orders = await Order.findAll({
      where: filters,
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Escrow, as: 'escrow' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  confirmPayment,
  updateStatus,
  getOrders
};
