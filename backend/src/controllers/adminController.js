const { User, Store, StoreProfile, Order, Escrow, AdminAction, Setting, Wallet, sequelize } = require('../models');
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
      escrowRecord.releasedAmount = parseFloat(escrowRecord.releasedAmount) + (parseFloat(escrowRecord.totalAmount) * 0.3);
    } else if (stage === 2) {
      if (escrowRecord.stage !== 1) throw new Error('Order must be in Stage 1 to release Stage 2');
      escrowRecord.releasedAmount = parseFloat(escrowRecord.releasedAmount) + (parseFloat(escrowRecord.totalAmount) * 0.2);
    } else if (stage === 3) {
      if (escrowRecord.stage !== 2) throw new Error('Order must be in Stage 2 to release Stage 3');
      escrowRecord.releasedAmount = parseFloat(escrowRecord.releasedAmount) + (parseFloat(escrowRecord.totalAmount) * 0.5);
      order.status = 'completed';
      await order.save();
    } else {
      return res.status(400).json({ success: false, message: 'Invalid stage' });
    }

    const txHash = await celoService.triggerEscrowRelease(order.id, stage);
    escrowRecord.stage = stage;
    if (stage === 3) escrowRecord.status = 'released';
    await escrowRecord.save();

    let withdrawTxHash = null;
    try {
      const sellerWallet = await Wallet.findOne({ where: { userId: escrowRecord.sellerId } });
      if (sellerWallet) {
        const sellerPrivateKey = decrypt(sellerWallet.encryptedPrivateKey);
        withdrawTxHash = await celoService.triggerSellerWithdraw(order.id, sellerPrivateKey);
      }
    } catch (withdrawErr) {
      console.error(`[Escrow] Auto-withdraw failed for order ${orderId}:`, withdrawErr.message);
    }

    await logAction(req.user.id, 'ESCROW_RELEASE', 'order', orderId,
      `Stage ${stage} released. approveTx: ${txHash}, withdrawTx: ${withdrawTxHash || 'pending'}`);

    res.status(200).json({ success: true, message: `Escrow Stage ${stage} released`, txHash, withdrawTxHash });
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
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) return res.status(404).json({ success: false, message: 'User has no wallet yet' });

    const adminKey = process.env.ADMIN_PRIVATE_KEY;
    const results = {};

    for (const token of ['CELO', 'cUSD', 'USDC', 'USDT']) {
      try {
        const txHash = await celoService.transferTokens(adminKey, wallet.address, token, '100');
        results[token] = { success: true, txHash };
      } catch (err) {
        results[token] = { success: false, error: err.message };
      }
    }

    await logAction(req.user.id, 'AIRDROP', 'user', userId,
      `Airdropped 100 of each token to ${wallet.address}`);

    res.status(200).json({ success: true, message: 'Airdrop sent', data: { address: wallet.address, results } });
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
        { model: User, as: 'user', attributes: ['id', 'email', 'fullName', 'username'] },
        { model: Store, as: 'store', attributes: ['id', 'name'] },
        { model: Escrow, as: 'escrow', attributes: ['id', 'status', 'stage', 'totalAmount', 'releasedAmount'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
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
  listOrders
};
