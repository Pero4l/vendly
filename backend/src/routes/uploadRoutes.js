const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middlewares/upload');
const { authenticateToken } = require('../middlewares/auth');

// Allow authenticated users to upload a single image file via 'image' form-data field
router.post('/', authenticateToken, upload.single('image'), uploadController.uploadImage);

module.exports = router;
