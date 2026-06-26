const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');

router.use(authenticateToken, authorizeRoles('admin'));

router.post('/approve-store', adminController.approveStore);
router.post('/suspend-user', adminController.suspendUser);
router.post('/release-escrow', adminController.releaseEscrowStage);
router.post('/set-fee', adminController.setPlatformFee);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
