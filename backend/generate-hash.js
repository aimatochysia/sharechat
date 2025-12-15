#!/usr/bin/env node

/**
 * Password Hash Generator
 * 
 * This script generates a bcrypt hash for a given password.
 * Use this to create a secure hash for your CHAT_PASSWORD environment variable.
 * 
 * Usage:
 *   node generate-hash.js
 *   node generate-hash.js your_password
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

// Salt rounds: 10 is adequate for current security standards (2025)
// Can be overridden with BCRYPT_SALT_ROUNDS environment variable for future-proofing
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

async function generateHash(password) {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('\n✅ Password hash generated successfully!\n');
    console.log('Hash:', hash);
    console.log('\nAdd this to your .env file:');
    console.log(`CHAT_PASSWORD=${hash}`);
    console.log('\n⚠️  Keep this hash secure and do not share it publicly.\n');
  } catch (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
}

// Get password from command line argument or prompt
const password = process.argv[2];

if (password) {
  generateHash(password);
} else {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter password to hash: ', (answer) => {
    rl.close();
    if (!answer || answer.trim() === '') {
      console.error('Error: Password cannot be empty');
      process.exit(1);
    }
    generateHash(answer);
  });
}
