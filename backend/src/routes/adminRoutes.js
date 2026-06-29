const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');

router.use(authenticateToken, authorizeRoles('admin'));

router.get('/pending-stores', adminController.listPendingStores);
router.get('/all-stores', adminController.listPendingStores); // same handler, passes ?status=
router.post('/approve-store', adminController.approveStore);
router.post('/suspend-user', adminController.suspendUser);
router.post('/release-escrow', adminController.releaseEscrowStage);
router.post('/set-fee', adminController.setPlatformFee);
router.get('/analytics', adminController.getAnalytics);
router.get('/users', adminController.listUsers);
router.post('/airdrop', adminController.airdropTestTokens);
router.get('/orders', adminController.listOrders);

module.exports = router;
