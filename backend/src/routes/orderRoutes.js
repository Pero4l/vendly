const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken);

router.post('/', orderController.createOrder);
router.post('/confirm-payment', orderController.confirmPayment);
router.put('/:id/status', orderController.updateStatus);
router.get('/', orderController.getOrders);

module.exports = router;
