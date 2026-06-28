const crypto = require('crypto');
require('dotenv').config();

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be set in production. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    }
    // Dev-only warning — never silently use a hardcoded fallback that could ship to prod
    console.warn('[SECURITY] ENCRYPTION_KEY not set. Wallet keys are NOT securely encrypted. Set ENCRYPTION_KEY before storing real funds.');
    return 'dev-only-insecure-key-do-not-use-in-production-ever';
  }
  return key;
}
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

  const key = crypto.pbkdf2Sync(getEncryptionKey(), salt, 100000, KEY_LENGTH, 'sha256');
  
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
  const key = crypto.pbkdf2Sync(getEncryptionKey(), salt, 100000, KEY_LENGTH, 'sha256');

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
