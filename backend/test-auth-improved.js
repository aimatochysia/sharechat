#!/usr/bin/env node

/**
 * Comprehensive test script for authentication flow with improved error handling
 * 
 * This script validates:
 * 1. Bcrypt hash generation and comparison
 * 2. RSA encryption and decryption
 * 3. Complete authentication flow
 * 4. Error scenarios and messages
 */

const bcrypt = require('bcryptjs');
const cryptoUtils = require('./crypto-utils');

async function testBcryptHashing() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Test 1: Bcrypt Hash Generation and Comparison');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const password = 'testPassword123';
  
  // Generate two different hashes
  const hash1 = await bcrypt.hash(password, 10);
  const hash2 = await bcrypt.hash(password, 10);
  
  console.log('Password:', password);
  console.log('Hash 1:', hash1);
  console.log('Hash 2:', hash2);
  console.log('Hashes are different:', hash1 !== hash2);
  
  // Test comparison
  const match1 = await bcrypt.compare(password, hash1);
  const match2 = await bcrypt.compare(password, hash2);
  const wrongMatch = await bcrypt.compare('wrongPassword', hash1);
  
  console.log('\nComparison results:');
  console.log('  Password matches hash1:', match1);
  console.log('  Password matches hash2:', match2);
  console.log('  Wrong password matches hash1:', wrongMatch);
  
  if (match1 && match2 && !wrongMatch) {
    console.log('\n[PASS] Bcrypt hashing working correctly\n');
    return true;
  } else {
    console.log('\n[FAIL] Bcrypt hashing failed\n');
    return false;
  }
}

async function testRSAEncryption() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Test 2: RSA Encryption and Decryption');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Generate key pair
  const keyPair = cryptoUtils.generateRSAKeyPair();
  console.log('Key pair generated');
  console.log('Public key fingerprint:', cryptoUtils.getPublicKeyFingerprint(keyPair.publicKey));
  
  // Test various passwords
  const passwords = [
    'simplePassword',
    'Password with spaces',
    'P@ssw0rd!#$%',
    'HelloWorld', // Test various character types
    'a'.repeat(100) // Long password
  ];
  
  let allPassed = true;
  
  for (const password of passwords) {
    const encrypted = cryptoUtils.encryptWithPublicKey(password, keyPair.publicKey);
    const decrypted = cryptoUtils.decryptWithPrivateKey(encrypted, keyPair.privateKey);
    const match = password === decrypted;
    const displayPassword = password.length > 20 ? password.substring(0, 20) + '...' : password;
    
    console.log(`\nPassword: "${displayPassword}"`);
    console.log(`  Encrypted length: ${encrypted.length}`);
    console.log(`  Match: ${match ? 'PASS' : 'FAIL'}`);
    
    if (!match) {
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log('\n[PASS] RSA encryption working correctly\n');
    return true;
  } else {
    console.log('\n[FAIL] RSA encryption failed\n');
    return false;
  }
}

async function testCompleteAuthFlow() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Test 3: Complete Authentication Flow');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Step 1: Admin generates hash for CHAT_PASSWORD
  const plainPassword = 'mySecurePassword123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  console.log('Step 1: Admin generates hash');
  console.log('  Plain password:', plainPassword);
  console.log('  Hashed password:', hashedPassword);
  
  // Step 2: Server generates RSA keys
  const keyPair = cryptoUtils.generateRSAKeyPair();
  console.log('\nStep 2: Server generates RSA keys');
  console.log('  Key fingerprint:', cryptoUtils.getPublicKeyFingerprint(keyPair.publicKey));
  
  // Step 3: User enters password and frontend encrypts it
  const userPassword = plainPassword;
  const encryptedPassword = cryptoUtils.encryptWithPublicKey(userPassword, keyPair.publicKey);
  console.log('\nStep 3: User enters password, frontend encrypts');
  console.log('  User password:', userPassword);
  console.log('  Encrypted length:', encryptedPassword.length);
  
  // Step 4: Backend decrypts and compares
  const decryptedPassword = cryptoUtils.decryptWithPrivateKey(encryptedPassword, keyPair.privateKey);
  console.log('\nStep 4: Backend decrypts password');
  console.log('  Decrypted password:', decryptedPassword);
  console.log('  Match with original:', decryptedPassword === userPassword);
  
  // Step 5: Compare with stored hash
  const isValid = await bcrypt.compare(decryptedPassword, hashedPassword);
  console.log('\nStep 5: Compare with stored hash');
  console.log('  Comparison result:', isValid);
  
  if (isValid) {
    console.log('\n[PASS] Complete authentication flow successful\n');
    return true;
  } else {
    console.log('\n[FAIL] Authentication flow failed\n');
    return false;
  }
}

async function testErrorScenarios() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Test 4: Error Scenarios');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Scenario 1: Wrong password
  console.log('Scenario 1: Wrong password');
  const correctPassword = 'correctPassword';
  const wrongPassword = 'wrongPassword';
  const hash = await bcrypt.hash(correctPassword, 10);
  const wrongResult = await bcrypt.compare(wrongPassword, hash);
  console.log('  Result:', wrongResult ? '[FAIL] Should be false' : '[PASS] Correctly rejected');
  
  // Scenario 2: Key mismatch (simulating server restart)
  console.log('\nScenario 2: Key mismatch (server restart)');
  const keyPair1 = cryptoUtils.generateRSAKeyPair();
  const keyPair2 = cryptoUtils.generateRSAKeyPair();
  const password = 'testPassword';
  const encrypted = cryptoUtils.encryptWithPublicKey(password, keyPair1.publicKey);
  
  try {
    cryptoUtils.decryptWithPrivateKey(encrypted, keyPair2.privateKey);
    console.log('  [FAIL] Should have thrown error');
  } catch (err) {
    console.log('  [PASS] Correctly threw error:', err.message.substring(0, 50) + '...');
  }
  
  console.log();
}

async function runAllTests() {
  console.log('\n+========================================================+');
  console.log('|     Authentication Flow Test Suite                    |');
  console.log('+========================================================+\n');
  
  const results = [];
  
  results.push(await testBcryptHashing());
  results.push(await testRSAEncryption());
  results.push(await testCompleteAuthFlow());
  await testErrorScenarios();
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Tests passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n[PASS] All tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n[FAIL] Some tests failed\n');
    process.exit(1);
  }
}

// Run all tests
runAllTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
