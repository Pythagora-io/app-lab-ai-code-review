const crypto = require('crypto');

// For AES-256-CBC, key must be exactly 32 bytes (256 bits)
// Best practice is to use a base64-encoded key in environment variable
// If not provided, generate a secure random key (in production, always use env variable)
const getEncryptionKey = () => {
  if (process.env.ENCRYPTION_KEY) {
    // If key is provided in base64 format
    try {
      const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
      if (keyBuffer.length !== 32) {
        console.warn('ENCRYPTION_KEY is not 32 bytes after base64 decoding. Using a generated key instead.');
        return crypto.randomBytes(32);
      }
      return keyBuffer;
    } catch (error) {
      console.warn('Error processing ENCRYPTION_KEY:', error.message);
      return crypto.randomBytes(32);
    }
  } else {
    console.warn('ENCRYPTION_KEY not found in environment variables. Using a generated key (not recommended for production).');
    return crypto.randomBytes(32);
  }
};

const ENCRYPTION_KEY = getEncryptionKey();
const IV_LENGTH = 16; // For AES, this is always 16

// Encrypt data
const encrypt = (text) => {
  if (!text) return null;

  // Generate a random initialization vector
  const iv = crypto.randomBytes(IV_LENGTH);
  // Create cipher with key and iv
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  // Encrypt the text
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  // Return iv and encrypted data as hex string
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Decrypt data
const decrypt = (text) => {
  if (!text) return null;

  try {
    // Split iv and encrypted text
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    // Create decipher with key and iv
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    // Decrypt the text
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    // Return decrypted data
    return decrypted.toString();
  } catch (error) {
    console.error('Error decrypting data:', error);
    return null;
  }
};

module.exports = {
  encrypt,
  decrypt
};