const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken);

router.get('/balance', walletController.getBalance);
router.post('/transfer', walletController.transfer);
router.post('/withdraw', walletController.requestWithdrawal);
router.get('/history', walletController.getHistory);

module.exports = router;
