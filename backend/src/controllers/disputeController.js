const { Dispute, Order, Escrow, User } = require('../models');
const celoService = require('../blockchain/celoService');
const notificationService = require('../services/notificationService');

async function openDispute(req, res, next) {
  try {
    const { orderId, reason } = req.body;
    if (!orderId || !reason) {
      return res.status(400).json({ success: false, message: 'Order ID and reason required' });
    }

    const order = await Order.findByPk(orderId, { include: [{ model: Escrow, as: 'escrow' }] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.buyerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only buyers can open disputes' });
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot open dispute on finalized orders' });
    }

    const dispute = await Dispute.create({
      orderId,
      initiatorId: req.user.id,
      reason,
      status: 'OPEN'
    });

    order.status = 'DISPUTED';
    await order.save();

    if (order.escrow) {
      order.escrow.status = 'DISPUTED';
      await order.escrow.save();
    }

    // Notify Admin of dispute
    // In production, we'd email or notify the admins group.
    await notificationService.notifyUser(
      order.buyerId,
      'Dispute Opened',
      `You successfully opened a dispute for order ${order.id}.`,
      'dispute'
    );

    res.status(201).json({ success: true, message: 'Dispute opened successfully', data: dispute });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function resolveDispute(req, res, next) {
  try {
    const { disputeId, resolutionDetails, refundAmount } = req.body;
    if (!disputeId || !resolutionDetails) {
      return res.status(400).json({ success: false, message: 'Dispute ID and resolution details required' });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only admins can resolve disputes' });
    }

    const dispute = await Dispute.findByPk(disputeId, {
      include: [{ model: Order, as: 'order', include: [{ model: Escrow, as: 'escrow' }] }]
    });

    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    if (dispute.status === 'RESOLVED') return res.status(400).json({ success: false, message: 'Dispute already resolved' });

    const order = dispute.order;
    const escrowRecord = order.escrow;

    // Call blockchain Celo service to resolve dispute
    const txHash = await celoService.triggerDisputeResolve(order.id, refundAmount);

    dispute.status = 'RESOLVED';
    dispute.resolutionDetails = resolutionDetails;
    dispute.refundAmount = refundAmount;
    await dispute.save();

    order.status = parseFloat(refundAmount) >= parseFloat(order.totalAmount) ? 'REFUNDED' : 'COMPLETED';
    await order.save();

    if (escrowRecord) {
      escrowRecord.releasedAmount = parseFloat(escrowRecord.releasedAmount) + (parseFloat(escrowRecord.totalAmount) - parseFloat(escrowRecord.releasedAmount));
      escrowRecord.stage = 3;
      escrowRecord.status = parseFloat(refundAmount) >= parseFloat(order.totalAmount) ? 'REFUNDED' : 'RELEASED';
      await escrowRecord.save();
    }

    // Notify Buyer and Seller
    await notificationService.notifyUser(order.buyerId, 'Dispute Resolved', `Dispute resolved: ${resolutionDetails}`, 'dispute');

    res.status(200).json({ success: true, message: 'Dispute resolved and settled on blockchain', txHash });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getDisputes(req, res, next) {
  try {
    let list;
    if (req.user.role === 'ADMIN') {
      list = await Dispute.findAll({ include: [{ model: Order, as: 'order' }] });
    } else {
      list = await Dispute.findAll({
        where: { initiatorId: req.user.id },
        include: [{ model: Order, as: 'order' }]
      });
    }
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  openDispute,
  resolveDispute,
  getDisputes
};
