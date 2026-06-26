const { User, Store, Order, Escrow, AdminAction, Setting, sequelize } = require('../models');
const celoService = require('../blockchain/celoService');
const notificationService = require('../services/notificationService');

async function approveStore(req, res, next) {
  try {
    const { storeId, approve } = req.body;
    if (!storeId) return res.status(400).json({ success: false, message: 'Store ID required' });

    const store = await Store.findByPk(storeId);
    if (!store) return res.status(404).json({ success: false, message: 'Store profile not found' });

    store.status = approve ? 'APPROVED' : 'SUSPENDED';
    await store.save();

    // Log admin action
    await AdminAction.create({
      adminId: req.user.id,
      actionType: 'SELLER_APPROVE',
      details: `Store ${store.name} (${storeId}) status set to ${store.status}`
    });

    // Notify store owner
    await notificationService.notifyUser(
      store.ownerId,
      'Store Status Updated',
      `Your store "${store.name}" status has been set to ${store.status}.`,
      'info'
    );

    res.status(200).json({ success: true, message: `Store status updated to ${store.status}`, data: store });
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

    user.status = suspend ? 'SUSPENDED' : 'ACTIVE';
    await user.save();

    await AdminAction.create({
      adminId: req.user.id,
      actionType: 'USER_SUSPEND',
      details: `User ${user.email} (${userId}) status set to ${user.status}`
    });

    res.status(200).json({ success: true, message: `User status set to ${user.status}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function releaseEscrowStage(req, res, next) {
  try {
    const { orderId, stage } = req.body;
    if (!orderId || !stage) return res.status(400).json({ success: false, message: 'Order ID and stage required' });

    const order = await Order.findByPk(orderId, { include: [{ model: Escrow, as: 'escrow' }, { model: Store, as: 'store' }] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const escrowRecord = order.escrow;
    if (!escrowRecord) return res.status(400).json({ success: false, message: 'No active escrow record found' });

    // Enforce stages release sequence
    if (stage === 1) {
      if (escrowRecord.stage !== 0) throw new Error('Stage 1 already executed');
      escrowRecord.releasedAmount = parseFloat(escrowRecord.releasedAmount) + (parseFloat(escrowRecord.totalAmount) * 0.3);
    } else if (stage === 2) {
      if (escrowRecord.stage !== 1) throw new Error('Order must be in Stage 1 to release Stage 2');
      escrowRecord.releasedAmount = parseFloat(escrowRecord.releasedAmount) + (parseFloat(escrowRecord.totalAmount) * 0.2);
    } else if (stage === 3) {
      if (escrowRecord.stage !== 2) throw new Error('Order must be in Stage 2 to release Stage 3');
      escrowRecord.releasedAmount = parseFloat(escrowRecord.releasedAmount) + (parseFloat(escrowRecord.totalAmount) * 0.5);
      order.status = 'COMPLETED';
      await order.save();
    } else {
      return res.status(400).json({ success: false, message: 'Invalid stage' });
    }

    // Trigger blockchain milestone release
    const txHash = await celoService.triggerEscrowRelease(order.id, stage);

    escrowRecord.stage = stage;
    if (stage === 3) {
      escrowRecord.status = 'RELEASED';
    }
    await escrowRecord.save();

    await AdminAction.create({
      adminId: req.user.id,
      actionType: 'ESCROW_RELEASE',
      details: `Released escrow stage ${stage} for order ${orderId}, tx: ${txHash}`
    });

    // Notify seller
    await notificationService.notifyUser(
      order.store.ownerId,
      'Escrow Funds Released',
      `Stage ${stage} funds released to your wallet for order ${order.id}.`,
      'wallet_transfer'
    );

    res.status(200).json({ success: true, message: `Escrow Stage ${stage} released`, txHash });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function setPlatformFee(req, res, next) {
  try {
    const { feeBps } = req.body; // e.g. 250 for 2.5%
    if (feeBps === undefined) return res.status(400).json({ success: false, message: 'feeBps required' });

    const [setting, created] = await Setting.findOrCreate({
      where: { key: 'platform_fee_basis_points' },
      defaults: { value: feeBps.toString() }
    });

    if (!created) {
      setting.value = feeBps.toString();
      await setting.save();
    }

    await AdminAction.create({
      adminId: req.user.id,
      actionType: 'SETTINGS_UPDATE',
      details: `Platform fee set to ${feeBps} bps`
    });

    res.status(200).json({ success: true, message: 'Platform fee updated successfully', data: feeBps });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getAnalytics(req, res, next) {
  try {
    const totalUsers = await User.count();
    const totalStores = await Store.count();
    const totalOrders = await Order.count();

    const revenueRaw = await Order.sum('totalAmount', { where: { status: 'COMPLETED' } });
    const revenue = revenueRaw || 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalStores,
        totalOrders,
        revenue
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  approveStore,
  suspendUser,
  releaseEscrowStage,
  setPlatformFee,
  getAnalytics
};
