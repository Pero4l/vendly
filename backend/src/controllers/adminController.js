const { User, Store, StoreProfile, Order, OrderItem, Product, Escrow, AdminAction, Setting, Wallet, sequelize } = require('../models');
const celoService = require('../blockchain/celoService');
const { decrypt } = require('../utils/encryption');
const notificationService = require('../services/notificationService');

function logAction(adminId, action, targetType, targetId, notes) {
  return AdminAction.create({ adminId, action, targetType, targetId, notes }).catch(err => {
    console.error('[AdminAction] Failed to log action:', err.message);
  });
}

async function listPendingStores(req, res, next) {
  try {
    const { status = 'pending' } = req.query;
    const stores = await Store.findAll({
      where: { status },
      include: [{
        model: StoreProfile,
        as: 'storeProfile',
        include: [{ model: User, as: 'user', attributes: ['id', 'email', 'fullName', 'username', 'createdAt'] }]
      }],
      order: [['createdAt', 'DESC']]
    });

    const data = stores.map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      status: s.status,
      createdAt: s.createdAt,
      logo: s.storeProfile?.logo,
      ownerEmail: s.storeProfile?.user?.email,
      ownerName: s.storeProfile?.user?.fullName || s.storeProfile?.user?.username,
      ownerId: s.storeProfile?.user?.id,
      memberSince: s.storeProfile?.user?.createdAt,
      storeProfileId: s.storeProfileId
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function approveStore(req, res, next) {
  try {
    const { storeId, approve } = req.body;
    if (!storeId) return res.status(400).json({ success: false, message: 'Store ID required' });

    const store = await Store.findByPk(storeId, {
      include: [{ model: StoreProfile, as: 'storeProfile', include: [{ model: User, as: 'user' }] }]
    });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const newStatus = approve ? 'active' : 'rejected';
    await store.update({ status: newStatus });

    const owner = store.storeProfile?.user;
    if (approve && owner) await owner.update({ role: 'seller' });

    await logAction(req.user.id, approve ? 'STORE_APPROVE' : 'STORE_REJECT', 'store', storeId,
      `Store "${store.name}" ${approve ? 'approved' : 'rejected'}`);

    if (owner) {
      try {
        await notificationService.notifyUser(
          owner.id,
          approve ? 'Store Approved!' : 'Store Application Rejected',
          approve
            ? `Your store "${store.name}" has been approved. You can now list products!`
            : `Your store application for "${store.name}" was not approved at this time.`,
          'info'
        );
      } catch {}
    }

    res.status(200).json({
      success: true,
      message: `Store ${approve ? 'approved' : 'rejected'} successfully`,
      data: { storeId, status: newStatus, ownerId: owner?.id }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function suspendUser(req, res, next) {
  try {
    const { userId, suspend } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.status = suspend ? 'suspended' : 'active';
    await user.save();

    await logAction(req.user.id, suspend ? 'USER_SUSPEND' : 'USER_UNSUSPEND', 'user', userId,
      `User ${user.email} status set to ${user.status}`);

    res.status(200).json({ success: true, message: `User status set to ${user.status}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function releaseEscrowStage(req, res, next) {
  try {
    const { orderId, stage } = req.body;
    if (!orderId || !stage) return res.status(400).json({ success: false, message: 'Order ID and stage required' });

    const order = await Order.findByPk(orderId, { include: [{ model: Escrow, as: 'escrow' }] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const escrowRecord = order.escrow;
    if (!escrowRecord) return res.status(400).json({ success: false, message: 'No active escrow record found' });

    if (stage === 1) {
      if (escrowRecord.stage !== 0) throw new Error('Stage 1 already executed');
      escrowRecord.releasedAmount = parseFloat(escrowRecord.releasedAmount) + (parseFloat(escrowRecord.amount) * 0.3);
    } else if (stage === 2) {
      if (escrowRecord.stage !== 1) throw new Error('Order must be in Stage 1 to release Stage 2');
      escrowRecord.releasedAmount = parseFloat(escrowRecord.releasedAmount) + (parseFloat(escrowRecord.amount) * 0.2);
    } else if (stage === 3) {
      if (escrowRecord.stage !== 2) throw new Error('Order must be in Stage 2 to release Stage 3');
      escrowRecord.releasedAmount = parseFloat(escrowRecord.releasedAmount) + (parseFloat(escrowRecord.amount) * 0.5);
      order.status = 'completed';
      await order.save();
    } else {
      return res.status(400).json({ success: false, message: 'Invalid stage' });
    }

    const stagePercents = { 1: 0.3, 2: 0.2, 3: 0.5 };
    const releaseAmount = parseFloat(escrowRecord.amount) * stagePercents[stage];

    // Try on-chain release (only works if the order was locked on-chain)
    let txHash = null;
    let withdrawTxHash = null;
    const lockedOnChain = !!escrowRecord.contractTxHash;

    if (lockedOnChain) {
      try {
        txHash = await celoService.triggerEscrowRelease(order.id, stage);
        const sellerWallet = await Wallet.findOne({ where: { userId: escrowRecord.sellerId } });
        if (sellerWallet) {
          const sellerPrivateKey = decrypt(sellerWallet.encryptedPrivateKey);
          withdrawTxHash = await celoService.triggerSellerWithdraw(order.id, sellerPrivateKey);
        }
      } catch (onChainErr) {
        console.warn(`[Escrow] On-chain release failed, using DB-only mode:`, onChainErr.message);
      }
    }

    // Always credit seller's DB balance for the released amount
    const sellerWallet = await Wallet.findOne({ where: { userId: escrowRecord.sellerId } });
    if (sellerWallet) {
      const { Transaction } = require('../models');
      await sellerWallet.update({ celoBalance: parseFloat(sellerWallet.celoBalance || 0) + releaseAmount });
      await Transaction.create({
        walletId: sellerWallet.id,
        orderId: order.id,
        type: 'escrow_release',
        token: 'CELO',
        amount: releaseAmount,
        txHash: withdrawTxHash || null,
        status: 'success'
      });
    }

    escrowRecord.stage = stage;
    if (stage === 3) escrowRecord.status = 'released';
    await escrowRecord.save();

    await logAction(req.user.id, 'ESCROW_RELEASE', 'order', orderId,
      `Stage ${stage} released. onChain: ${lockedOnChain}, approveTx: ${txHash}, withdrawTx: ${withdrawTxHash || 'db-only'}`);

    res.status(200).json({ success: true, message: `Escrow Stage ${stage} released`, txHash, withdrawTxHash, dbCredited: releaseAmount });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'username', 'email', 'role', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    const wallets = await Wallet.findAll({ attributes: ['userId', 'address'] });
    const walletMap = Object.fromEntries(wallets.map(w => [w.userId, w.address]));

    const data = users.map(u => ({
      id: u.id,
      fullName: u.fullName,
      username: u.username,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      walletAddress: walletMap[u.id] || null
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function airdropTestTokens(req, res, next) {
  try {
    const { userId, amount = 100 } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) return res.status(404).json({ success: false, message: 'User has no wallet yet' });

    const airdropAmount = parseFloat(amount);
    const newBalance = parseFloat(wallet.celoBalance || 0) + airdropAmount;

    // Send real on-chain CELO to the user's custodial wallet so their address
    // actually holds the funds — required for the buyer→admin→escrow flow.
    let txHash = null;
    try {
      txHash = await celoService.transferTokens(
        process.env.ADMIN_PRIVATE_KEY,
        wallet.address,
        'CELO',
        airdropAmount
      );
    } catch (chainErr) {
      console.error('[Airdrop] On-chain transfer failed:', chainErr.message);
      return res.status(400).json({
        success: false,
        message: `On-chain transfer failed: ${chainErr.message}. Ensure the admin wallet has enough CELO.`
      });
    }

    await wallet.update({ celoBalance: newBalance });

    const { Transaction } = require('../models');
    await Transaction.create({
      walletId: wallet.id,
      type: 'deposit',
      token: 'CELO',
      amount: airdropAmount,
      txHash,
      status: 'success'
    });

    await logAction(req.user.id, 'AIRDROP', 'user', userId,
      `Credited ${airdropAmount} CELO to ${wallet.address} (new balance: ${newBalance}), txHash: ${txHash}`);

    res.status(200).json({
      success: true,
      message: `${airdropAmount} CELO sent to user's wallet on-chain`,
      data: { address: wallet.address, celoBalance: newBalance, txHash }
    });
  } catch (error) {
    next(error);
  }
}

async function setPlatformFee(req, res, next) {
  try {
    const { feeBps } = req.body;
    if (feeBps === undefined) return res.status(400).json({ success: false, message: 'feeBps required' });

    const [setting, created] = await Setting.findOrCreate({
      where: { key: 'platform_fee_basis_points' },
      defaults: { value: String(feeBps) }
    });

    if (!created) {
      setting.value = String(feeBps);
      await setting.save();
    }

    await logAction(req.user.id, 'SETTINGS_UPDATE', 'setting', req.user.id,
      `Platform fee set to ${feeBps} bps`);

    res.status(200).json({ success: true, message: 'Platform fee updated successfully', data: feeBps });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getAnalytics(req, res, next) {
  try {
    const [totalUsers, totalStores, totalOrders, pendingStores, revenueRaw, totalDisputes] = await Promise.all([
      User.count(),
      Store.count({ where: { status: 'active' } }),
      Order.count(),
      Store.count({ where: { status: 'pending' } }),
      Order.sum('totalAmount', { where: { status: 'completed' } }),
      Order.count({ where: { status: 'disputed' } }).catch(() => 0)
    ]);

    res.status(200).json({
      success: true,
      data: { totalUsers, totalStores, totalOrders, pendingStores, revenue: revenueRaw || 0, totalDisputes }
    });
  } catch (error) {
    next(error);
  }
}

async function listOrders(req, res, next) {
  try {
    const orders = await Order.findAll({
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'email', 'fullName', 'username'] },
        { model: Escrow, as: 'escrow', attributes: ['id', 'status', 'stage', 'amount', 'releasedAmount'] },
        {
          model: OrderItem, as: 'items',
          limit: 1,
          include: [{
            model: Product, as: 'product',
            attributes: ['id', 'title'],
            include: [{ model: Store, as: 'store', attributes: ['id', 'name'] }]
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    const data = orders.map(o => ({
      ...o.toJSON(),
      storeName: o.items?.[0]?.product?.store?.name || '—'
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function listDisputes(req, res, next) {
  try {
    const { Dispute } = require('../models');
    const list = await Dispute.findAll({
      include: [{ model: Order, as: 'order', include: [{ model: User, as: 'buyer', attributes: ['id', 'email', 'fullName'] }] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

async function resolveDisputeAdmin(req, res, next) {
  try {
    const { Dispute } = require('../models');
    const { id } = req.params;
    const { refundPercentage } = req.body;

    const dispute = await Dispute.findByPk(id, {
      include: [{ model: Order, as: 'order', include: [{ model: Escrow, as: 'escrow' }] }]
    });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    if (dispute.status === 'RESOLVED') return res.status(400).json({ success: false, message: 'Already resolved' });

    const order = dispute.order;
    const escrowRecord = order?.escrow;
    const totalAmt = parseFloat(order?.totalAmount || 0);
    const refundAmt = totalAmt * (parseFloat(refundPercentage || 0) / 100);

    let txHash = null;
    try {
      const celoSvc = require('../blockchain/celoService');
      txHash = await celoSvc.triggerDisputeResolve(order.id, refundAmt.toString());
    } catch (err) {
      console.error('[Dispute] On-chain resolve failed:', err.message);
    }

    dispute.status = 'RESOLVED';
    dispute.resolutionDetails = `Admin resolved: ${refundPercentage}% refund to buyer`;
    dispute.refundAmount = refundAmt;
    await dispute.save();

    if (order) {
      order.status = refundPercentage >= 100 ? 'refunded' : 'completed';
      await order.save();
    }
    if (escrowRecord) {
      escrowRecord.stage = 3;
      escrowRecord.status = refundPercentage >= 100 ? 'REFUNDED' : 'released';
      await escrowRecord.save();
    }

    await logAction(req.user.id, 'DISPUTE_RESOLVE', 'order', order?.id || id,
      `Dispute ${id} resolved — ${refundPercentage}% refund. txHash: ${txHash}`);

    res.status(200).json({ success: true, message: 'Dispute resolved', txHash });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  listPendingStores,
  approveStore,
  suspendUser,
  releaseEscrowStage,
  setPlatformFee,
  getAnalytics,
  listUsers,
  airdropTestTokens,
  listOrders,
  listDisputes,
  resolveDisputeAdmin
};
