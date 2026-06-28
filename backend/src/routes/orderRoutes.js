const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken);

router.post('/', orderController.createOrder);
router.post('/confirm-payment', orderController.confirmPayment);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateStatus);

module.exports = router;
