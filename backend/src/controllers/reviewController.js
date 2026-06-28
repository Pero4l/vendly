'use strict';

const { Review, Product, Order, OrderItem, Store, StoreProfile, User, sequelize } = require('../models');

async function createReview(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { productId, orderId, rating, comment } = req.body;
    const reviewerId = req.user.id;

    if (!productId || !orderId || !rating) {
      return res.status(400).json({ success: false, message: 'productId, orderId and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be 1–5' });
    }

    // Verify the order belongs to this buyer and contains the product
    const order = await Order.findOne({
      where: { id: orderId, buyerId: reviewerId },
      include: [{ model: OrderItem, as: 'items', where: { productId }, required: true }]
    });
    if (!order) {
      return res.status(403).json({ success: false, message: 'Order not found or does not contain this product' });
    }
    if (!['delivered', 'completed'].includes(order.status)) {
      return res.status(403).json({ success: false, message: 'You can only review products from delivered orders' });
    }

    // One review per order per product
    const existing = await Review.findOne({ where: { orderId, productId, reviewerId } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product for this order' });
    }

    const product = await Product.findByPk(productId, {
      include: [{ model: Store, as: 'store', include: [{ model: StoreProfile, as: 'storeProfile' }] }]
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const sellerId = product.store?.storeProfile?.userId;
    if (!sellerId) return res.status(400).json({ success: false, message: 'Could not determine seller for this product' });

    const review = await Review.create({
      orderId,
      productId,
      reviewerId,
      sellerId,
      rating,
      comment: comment?.trim() || null
    }, { transaction: t });

    // Recalculate averageRating and totalReviews atomically
    const newTotal = product.totalReviews + 1;
    const newAvg = ((product.averageRating * product.totalReviews) + rating) / newTotal;
    await product.update(
      { totalReviews: newTotal, averageRating: parseFloat(newAvg.toFixed(2)) },
      { transaction: t }
    );

    await t.commit();

    const full = await Review.findByPk(review.id, {
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'fullName', 'username'] }]
    });
    res.status(201).json({ success: true, data: full });
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

async function getProductReviews(req, res, next) {
  try {
    const { productId } = req.params;
    const reviews = await Review.findAll({
      where: { productId },
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'fullName', 'username'] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
}

module.exports = { createReview, getProductReviews };
