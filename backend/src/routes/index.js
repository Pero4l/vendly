const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const walletRoutes = require('./walletRoutes');
const storeRoutes = require('./storeRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const disputeRoutes = require('./disputeRoutes');
const adminRoutes = require('./adminRoutes');
const notificationRoutes = require('./notificationRoutes');
const uploadRoutes = require('./uploadRoutes');

router.use('/auth', authRoutes);
router.use('/wallets', walletRoutes);
router.use('/stores', storeRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/disputes', disputeRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/uploads', uploadRoutes);

module.exports = router;
