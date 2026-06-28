const express = require('express');
const router = express.Router();
const { listCategories, seedCategories } = require('../controllers/categoryController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', listCategories);
router.post('/seed', authenticateToken, seedCategories);

module.exports = router;
