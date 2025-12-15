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
 * In production, you may want to persist keys and implement key rotation
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

module.exports = {
  generateRSAKeyPair,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  getOrGenerateKeyPair,
  getPublicKeyFingerprint,
  generateRandomKey,
  sha256Hash,
};
