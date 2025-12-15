# Backend Testing Guide

This document describes the testing utilities available for the ShareChat backend.

## Test Scripts

### 1. RSA Authentication Test (`test-rsa-auth.js`)

Comprehensive test suite for validating the RSA-encrypted authentication flow.

**What it tests:**
- Public key retrieval from `/api/auth/public-key`
- Client-side password encryption with RSA public key
- Authentication with encrypted password
- JWT token verification

**Usage:**

```bash
# Ensure the server is running first
npm start

# In a separate terminal, run the test
node test-rsa-auth.js
```

**Expected Output:**

```
═══════════════════════════════════════════════════════
  RSA Encrypted Authentication Test Suite
═══════════════════════════════════════════════════════

Test 1: Fetching public key...
✓ Public key fetched successfully
  Fingerprint: a1b2c3d4e5f6g7h8
  Key length: 451 characters

Test 2: Encrypting password...
✓ Password encrypted successfully
  Original length: 15 characters
  Encrypted length: 344 characters

Test 3: Authenticating with encrypted password...
✓ Authentication successful
  Token: eyJhbGciOiJIUzI1NiIsInR5cCI6...
  Expires in: 24h

Test 4: Verifying JWT token...
✓ Token verified successfully

═══════════════════════════════════════════════════════
  Test Results
═══════════════════════════════════════════════════════
  Tests passed: 4
  Tests failed: 0

✅ All tests passed! RSA encryption is working correctly.
```

**Troubleshooting:**

If tests fail, check:
1. Server is running on `localhost:3000`
2. MongoDB connection is working (check `.env` file)
3. `CHAT_PASSWORD` environment variable is set correctly
4. All dependencies are installed (`npm install`)

### 2. API Test Script (`test-api.js`)

General API testing script for various endpoints.

**Usage:**

```bash
node test-api.js
```

## Manual Testing

### Testing RSA Encryption Flow

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Check public key endpoint:**
   ```bash
   curl http://localhost:3000/api/auth/public-key | jq
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
     "keyFingerprint": "a1b2c3d4e5f6g7h8"
   }
   ```

3. **Test authentication with encrypted password:**
   Use the test script or manually test from the frontend at `http://localhost:5173`

### Testing Password Encryption

To verify the crypto utilities work correctly:

```bash
node -e "
const crypto = require('./crypto-utils');
const keyPair = crypto.getOrGenerateKeyPair();
const password = 'test123';
const encrypted = crypto.encryptWithPublicKey(password, keyPair.publicKey);
const decrypted = crypto.decryptWithPrivateKey(encrypted, keyPair.privateKey);
console.log('Original:', password);
console.log('Encrypted:', encrypted.substring(0, 50) + '...');
console.log('Decrypted:', decrypted);
console.log('Match:', password === decrypted ? '✓' : '✗');
"
```

## Security Testing

### Password Hash Generation

To generate a bcrypt hash for your password:

```bash
node generate-hash.js your_password
```

Copy the generated hash to your `.env` file as `CHAT_PASSWORD`.

### Rate Limiting Tests

Test rate limiting on authentication endpoint:

```bash
# Send multiple requests quickly
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth \
    -H "Content-Type: application/json" \
    -d '{"password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
done
```

Expected: First 5 requests get 401 (invalid password), 6th request gets 429 (rate limited).

## Integration Testing

For full integration testing with a real MongoDB instance:

1. Set up a test MongoDB database
2. Configure `.env` with test database credentials
3. Run the server with `NODE_ENV=test`
4. Execute test scripts
5. Clean up test data

## Continuous Integration

To run tests in CI/CD pipeline:

```bash
# Start server in background
npm start &
SERVER_PID=$!

# Wait for server to be ready
sleep 5

# Run tests
node test-rsa-auth.js

# Stop server
kill $SERVER_PID
```

## Contributing

When adding new features, please:
1. Add corresponding test cases
2. Update this documentation
3. Ensure all tests pass before submitting PR
4. Run security scans (`npm audit`)

## Related Documentation

- [Security Summary](../SECURITY.md)
- [Technical Documentation](../TECHNICAL.md)
- [Deployment Guide](../DEPLOYMENT.md)
