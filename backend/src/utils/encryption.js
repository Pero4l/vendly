const crypto = require('crypto');
require('dotenv').config();

// The encryption key should be 32 bytes (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'; // Fallback for dev only
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard IV size
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Encrypts a text string using AES-256-GCM.
 * @param {string} text The text to encrypt.
 * @returns {string} The formatted ciphertext (salt:iv:authTag:encryptedContent).
 */
function encrypt(text) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Derives key from ENCRYPTION_KEY and salt for extra security
  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, KEY_LENGTH, 'sha256');
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a formatted ciphertext using AES-256-GCM.
 * @param {string} encryptedText The formatted ciphertext (salt:iv:authTag:encryptedContent).
 * @returns {string} The decrypted plaintext.
 */
function decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted text format');
  }
  
  const salt = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const authTag = Buffer.from(parts[2], 'hex');
  const encrypted = parts[3];
  
  // Derives key
  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, KEY_LENGTH, 'sha256');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt
};
