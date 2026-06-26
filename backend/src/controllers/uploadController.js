const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');

/**
 * Uploads a memory buffer to Cloudinary using upload_stream.
 */
const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'vendly_marketplace' },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    stream.end(fileBuffer);
  });
};

async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const isPlaceholder = !cloudName || cloudName.includes('placeholder') || !apiKey || apiKey.includes('placeholder');

    if (isPlaceholder) {
      const mockUrl = `https://res.cloudinary.com/simulated-cloud/image/upload/v12345678/mock_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      logger.info(`[Simulation Upload] Received file: ${req.file.originalname} (${req.file.size} bytes). Generated mock URL: ${mockUrl}`);
      return res.status(200).json({
        success: true,
        message: 'Image upload simulated successfully (Development Mode)',
        url: mockUrl
      });
    }

    const result = await streamUpload(req.file.buffer);
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      url: result.secure_url
    });
  } catch (error) {
    logger.error('Cloudinary upload failure:', error.message);
    res.status(500).json({ success: false, message: `Cloudinary upload failed: ${error.message}` });
  }
}

module.exports = {
  uploadImage
};
