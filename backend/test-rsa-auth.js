#!/usr/bin/env node

/**
 * Comprehensive test script for RSA-encrypted authentication
 * 
 * This script validates the complete RSA encryption flow:
 * 1. Public key retrieval
 * 2. Password encryption (client-side simulation)
 * 3. Authentication with encrypted password
 * 4. Token verification
 * 
 * Usage:
 *   node test-rsa-auth.js
 * 
 * Requirements:
 *   - Server must be running on localhost:3000
 *   - CHAT_PASSWORD environment variable must be set
 */

const http = require('http');
const cryptoUtils = require('./crypto-utils');

const API_URL = 'localhost';
const API_PORT = 3000;
const TEST_PASSWORD = process.env.CHAT_PASSWORD || 'testpassword123';

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (err) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testRSAAuth() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  RSA Encrypted Authentication Test Suite');
  console.log('═══════════════════════════════════════════════════════\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Test 1: Fetch public key
    console.log('Test 1: Fetching public key...');
    const keyOptions = {
      hostname: API_URL,
      port: API_PORT,
      path: '/api/auth/public-key',
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };
    
    const keyResponse = await makeRequest(keyOptions);
    
    if (keyResponse.statusCode !== 200) {
      console.error('❌ Failed to fetch public key (HTTP', keyResponse.statusCode, ')');
      testsFailed++;
      return;
    }
    
    if (!keyResponse.data.success || !keyResponse.data.publicKey) {
      console.error('❌ Invalid public key response');
      testsFailed++;
      return;
    }
    
    const publicKey = keyResponse.data.publicKey;
    const keyFingerprint = keyResponse.data.keyFingerprint;
    
    console.log('✓ Public key fetched successfully');
    console.log('  Fingerprint:', keyFingerprint);
    console.log('  Key length:', publicKey.length, 'characters');
    testsPassed++;
    console.log();
    
    // Test 2: Encrypt password
    console.log('Test 2: Encrypting password...');
    try {
      const encryptedPassword = cryptoUtils.encryptWithPublicKey(TEST_PASSWORD, publicKey);
      console.log('✓ Password encrypted successfully');
      console.log('  Original length:', TEST_PASSWORD.length, 'characters');
      console.log('  Encrypted length:', encryptedPassword.length, 'characters');
      testsPassed++;
      console.log();
      
      // Test 3: Authenticate with encrypted password
      console.log('Test 3: Authenticating with encrypted password...');
      const authData = JSON.stringify({ encryptedPassword });
      const authOptions = {
        hostname: API_URL,
        port: API_PORT,
        path: '/api/auth',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(authData)
        }
      };
      
      const authResponse = await makeRequest(authOptions, authData);
      
      if (authResponse.statusCode !== 200) {
        console.error('❌ Authentication failed (HTTP', authResponse.statusCode, ')');
        console.error('  Message:', authResponse.data.message);
        testsFailed++;
      } else if (!authResponse.data.success) {
        console.error('❌ Authentication failed:', authResponse.data.message);
        testsFailed++;
      } else {
        const token = authResponse.data.token;
        console.log('✓ Authentication successful');
        console.log('  Token:', token.substring(0, 30) + '...');
        console.log('  Expires in:', authResponse.data.expiresIn);
        testsPassed++;
        console.log();
        
        // Test 4: Verify token
        console.log('Test 4: Verifying JWT token...');
        const verifyOptions = {
          hostname: API_URL,
          port: API_PORT,
          path: '/api/auth/verify',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        };
        
        const verifyResponse = await makeRequest(verifyOptions);
        
        if (verifyResponse.statusCode !== 200 || !verifyResponse.data.valid) {
          console.error('❌ Token verification failed');
          testsFailed++;
        } else {
          console.log('✓ Token verified successfully');
          testsPassed++;
          console.log();
        }
      }
      
    } catch (encryptErr) {
      console.error('❌ Encryption failed:', encryptErr.message);
      testsFailed++;
    }
    
  } catch (err) {
    console.error('❌ Test suite failed:', err.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Is the server running? (npm start in backend/)');
    console.error('  2. Is MONGO_URI configured in .env?');
    console.error('  3. Is CHAT_PASSWORD set correctly?');
    testsFailed++;
  }
  
  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Test Results');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Tests passed:', testsPassed);
  console.log('  Tests failed:', testsFailed);
  
  if (testsFailed === 0) {
    console.log('\n✅ All tests passed! RSA encryption is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the output above.\n');
    process.exit(1);
  }
}

// Run test suite
testRSAAuth();
