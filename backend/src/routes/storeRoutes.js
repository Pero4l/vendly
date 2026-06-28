const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticateToken } = require('../middlewares/auth');

// Public store listing + search
router.get('/', storeController.listStores);

// Apply to become vendor / create store (any authenticated user)
router.post('/apply', authenticateToken, storeController.applyVendor);
router.post('/', authenticateToken, storeController.applyVendor);

// Get & update current user's store
router.get('/my-store', authenticateToken, storeController.getStore);
router.put('/my-store', authenticateToken, storeController.updateStore);

module.exports = router;
