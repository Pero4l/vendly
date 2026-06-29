const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middlewares/auth');

router.use(authenticateToken);

router.get('/', notificationController.getNotifications);
router.post('/read-all', notificationController.markAllRead);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
