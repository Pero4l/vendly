const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');

router.get('/', productController.listProducts);
router.get('/:id', productController.getProductDetails);
router.get('/:productId/reviews', reviewController.getProductReviews);

router.post('/', authenticateToken, authorizeRoles('seller'), productController.createProduct);
router.put('/:id', authenticateToken, productController.updateProduct);
router.delete('/:id', authenticateToken, productController.deleteProduct);

router.post('/reviews', authenticateToken, authorizeRoles('buyer'), reviewController.createReview);

module.exports = router;
