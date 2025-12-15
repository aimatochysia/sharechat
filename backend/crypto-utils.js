/**
 * Cryptographic utilities for secure password transmission
 * 
 * This module provides RSA key pair generation and encryption/decryption
 * for securing password transmission between client and server.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// RSA key configuration
const RSA_KEY_SIZE = 2048; // 2048-bit keys (secure for current standards)
const RSA_PADDING = crypto.constants.RSA_PKCS1_OAEP_PADDING;
const RSA_HASH = 'sha256';

/**
 * Generate RSA key pair
 * @returns {Object} { publicKey, privateKey }
 */
function generateRSAKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: RSA_KEY_SIZE,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { publicKey, privateKey };
}

/**
 * Encrypt data using RSA public key
 * @param {string} data - Data to encrypt
 * @param {string} publicKey - RSA public key in PEM format
 * @returns {string} Base64-encoded encrypted data
 */
function encryptWithPublicKey(data, publicKey) {
  const buffer = Buffer.from(data, 'utf8');
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: RSA_PADDING,
      oaepHash: RSA_HASH,
    },
    buffer
  );
  return encrypted.toString('base64');
}

/**
 * Decrypt data using RSA private key
 * @param {string} encryptedData - Base64-encoded encrypted data
 * @param {string} privateKey - RSA private key in PEM format
 * @returns {string} Decrypted data
 */
function decryptWithPrivateKey(encryptedData, privateKey) {
  const buffer = Buffer.from(encryptedData, 'base64');
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: RSA_PADDING,
      oaepHash: RSA_HASH,
    },
    buffer
  );
  return decrypted.toString('utf8');
}

/**
 * Load or generate RSA key pair
 * Keys are stored in memory for the session, not persisted to disk for security
 * 
 * Design Decision: Keys regenerate on each restart for forward secrecy.
 * Trade-off: In-flight login attempts during restart will fail, but this is
 * acceptable for personal use case. For high-availability production systems,
 * consider implementing graceful key rotation with overlapping validity periods.
 * 
 * @returns {Object} { publicKey, privateKey }
 */
function getOrGenerateKeyPair() {
  // For security, we generate a new key pair on each server restart
  // This ensures that even if keys are compromised, they're only valid for the session
  const keyPair = generateRSAKeyPair();
  
  console.log('RSA key pair generated for password encryption');
  console.log('Public key fingerprint:', getPublicKeyFingerprint(keyPair.publicKey));
  
  return keyPair;
}

/**
 * Get public key fingerprint (for logging/verification)
 * @param {string} publicKey - RSA public key in PEM format
 * @returns {string} SHA256 fingerprint of the public key
 */
function getPublicKeyFingerprint(publicKey) {
  const hash = crypto.createHash('sha256');
  hash.update(publicKey);
  return hash.digest('hex').substring(0, 16);
}

/**
 * Generate a random encryption key for session-based encryption
 * This can be used for additional encryption layers
 * @returns {string} Base64-encoded random key
 */
function generateRandomKey(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Hash data using SHA256
 * @param {string} data - Data to hash
 * @returns {string} Hex-encoded hash
 */
function sha256Hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a secure nonce (number used once) for cryptographic operations
 * @param {number} length - Length in bytes (default: 16)
 * @returns {string} Hex-encoded nonce
 */
function generateSecureNonce(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Verify data integrity using HMAC-SHA256
 * @param {string} data - Data to verify
 * @param {string} signature - HMAC signature to verify against
 * @param {string} secret - Secret key for HMAC
 * @returns {boolean} True if signature is valid
 */
function verifyHMAC(data, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const expectedSignature = hmac.digest('hex');
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Generate HMAC signature for data
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key for HMAC
 * @returns {string} Hex-encoded HMAC signature
 */
function generateHMAC(data, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('hex');
}

module.exports = {
  generateRSAKeyPair,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  getOrGenerateKeyPair,
  getPublicKeyFingerprint,
  generateRandomKey,
  sha256Hash,
  generateSecureNonce,
  verifyHMAC,
  generateHMAC,
};
