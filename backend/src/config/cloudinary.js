const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isPlaceholder = !cloudName || cloudName.includes('placeholder') || !apiKey || apiKey.includes('placeholder');

if (isPlaceholder) {
  logger.warn('[Cloudinary config] Cloudinary credentials are not configured or are placeholder keys. Operating in SIMULATION mode.');
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });
}

module.exports = cloudinary;
