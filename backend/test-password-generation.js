#!/usr/bin/env node

/**
 * Test script to demonstrate bcrypt password generation and verification
 * This helps users understand that bcrypt hashes are non-deterministic
 */

const bcrypt = require('bcryptjs');

async function demonstrateBcryptBehavior() {
  console.log('=======================================================');
  console.log('  Bcrypt Password Hashing Demonstration');
  console.log('=======================================================\n');
  
  const password = 'myTestPassword123';
  
  console.log('Original password:', password);
  console.log('\nGenerating 3 different hashes for the same password...\n');
  
  // Generate 3 hashes
  const hash1 = await bcrypt.hash(password, 10);
  const hash2 = await bcrypt.hash(password, 10);
  const hash3 = await bcrypt.hash(password, 10);
  
  console.log('Hash 1:', hash1);
  console.log('Hash 2:', hash2);
  console.log('Hash 3:', hash3);
  
  console.log('\nNotice: All three hashes are DIFFERENT!');
  console.log('This is expected behavior - bcrypt uses random salts.\n');
  
  console.log('=======================================================');
  console.log('  Testing Password Verification');
  console.log('=======================================================\n');
  
  // Test all hashes
  const match1 = await bcrypt.compare(password, hash1);
  const match2 = await bcrypt.compare(password, hash2);
  const match3 = await bcrypt.compare(password, hash3);
  
  console.log('Does password match hash1?', match1);
  console.log('Does password match hash2?', match2);
  console.log('Does password match hash3?', match3);
  
  console.log('\nAll hashes match! Even though they are different,');
  console.log('bcrypt.compare() correctly verifies the password.\n');
  
  // Test with wrong password
  const wrongPassword = 'wrongPassword';
  const wrongMatch = await bcrypt.compare(wrongPassword, hash1);
  
  console.log('Does wrong password match hash1?', wrongMatch);
  console.log('Correctly rejected!\n');
  
  console.log('=======================================================');
  console.log('  Key Takeaway');
  console.log('=======================================================\n');
  console.log('When you use generate-hash.js:');
  console.log('1. Each run produces a DIFFERENT hash (normal behavior)');
  console.log('2. Pick ANY one hash and use it as CHAT_PASSWORD');
  console.log('3. The login will work because bcrypt.compare() handles it');
  console.log('4. You do NOT need to regenerate the hash every time\n');
}

demonstrateBcryptBehavior().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
