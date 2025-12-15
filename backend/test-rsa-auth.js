/**
 * Test script for RSA-encrypted authentication
 */

const axios = require('axios');
const cryptoUtils = require('./crypto-utils');

const API_URL = 'http://localhost:3000';
const TEST_PASSWORD = 'testpassword123';

async function testRSAAuth() {
  try {
    console.log('Testing RSA-encrypted authentication...\n');
    
    // Step 1: Fetch public key
    console.log('1. Fetching public key...');
    const keyResponse = await axios.get(`${API_URL}/api/auth/public-key`);
    
    if (!keyResponse.data.success) {
      console.error('❌ Failed to fetch public key');
      return;
    }
    
    const publicKey = keyResponse.data.publicKey;
    const keyFingerprint = keyResponse.data.keyFingerprint;
    console.log('✓ Public key fetched successfully');
    console.log('  Key fingerprint:', keyFingerprint);
    console.log('  Key length:', publicKey.length, 'characters\n');
    
    // Step 2: Encrypt password
    console.log('2. Encrypting password...');
    const encryptedPassword = cryptoUtils.encryptWithPublicKey(TEST_PASSWORD, publicKey);
    console.log('✓ Password encrypted successfully');
    console.log('  Encrypted length:', encryptedPassword.length, 'characters\n');
    
    // Step 3: Send encrypted password to auth endpoint
    console.log('3. Authenticating with encrypted password...');
    const authResponse = await axios.post(
      `${API_URL}/api/auth`,
      { encryptedPassword },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    if (authResponse.data.success) {
      console.log('✓ Authentication successful!');
      console.log('  Token received:', authResponse.data.token.substring(0, 20) + '...');
      console.log('  Token expires in:', authResponse.data.expiresIn);
      console.log('\n✅ All tests passed! RSA encryption is working correctly.\n');
    } else {
      console.error('❌ Authentication failed:', authResponse.data.message);
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
  }
}

// Run test
testRSAAuth();
