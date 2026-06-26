const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');

// Buyers apply for vendor role (seller) by creating a store
router.post('/apply', authenticateToken, authorizeRoles('buyer'), storeController.applyVendor);
router.post('/', authenticateToken, authorizeRoles('buyer'), storeController.applyVendor);

// Get current user's store
router.get('/my-store', authenticateToken, storeController.getStore);

module.exports = router;
