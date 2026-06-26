const express = require('express');
const router = express.Router();
const disputeController = require('../controllers/disputeController');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken);

router.post('/', disputeController.openDispute);
router.post('/resolve', disputeController.resolveDispute);
router.get('/', disputeController.getDisputes);

module.exports = router;
