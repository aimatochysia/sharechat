#!/usr/bin/env node

/**
 * Simple test script to validate the API endpoints
 * Run with: node test-api.js
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_PASSWORD = process.env.CHAT_PASSWORD || 'test123';

async function testAPI() {
  console.log('🧪 Testing ShareChat API...\n');

  try {
    // Test 1: Authentication
    console.log('1️⃣  Testing authentication...');
    const authResponse = await axios.post(`${API_URL}/api/auth`, {
      password: TEST_PASSWORD
    });
    console.log('✅ Authentication successful:', authResponse.data);
    console.log();

    // Test 2: Wrong password
    console.log('2️⃣  Testing wrong password...');
    try {
      await axios.post(`${API_URL}/api/auth`, {
        password: 'wrongpassword'
      });
      console.log('❌ Should have failed with wrong password');
    } catch (err) {
      console.log('✅ Correctly rejected wrong password:', err.response?.data?.message);
    }
    console.log();

    // Test 3: Send text message
    console.log('3️⃣  Testing send text message...');
    const messageResponse = await axios.post(`${API_URL}/api/messages`, {
      text: 'Hello from test script!'
    });
    console.log('✅ Message sent:', messageResponse.data);
    const messageId = messageResponse.data._id;
    console.log();

    // Test 4: Get messages
    console.log('4️⃣  Testing get messages...');
    const messagesResponse = await axios.get(`${API_URL}/api/messages`);
    console.log(`✅ Retrieved ${messagesResponse.data.length} messages`);
    console.log();

    // Test 5: Search messages
    console.log('5️⃣  Testing search...');
    const searchResponse = await axios.get(`${API_URL}/api/messages?search=Hello`);
    console.log(`✅ Found ${searchResponse.data.length} messages matching "Hello"`);
    console.log();

    // Test 6: Delete message
    console.log('6️⃣  Testing delete message...');
    const deleteResponse = await axios.delete(`${API_URL}/api/messages/${messageId}`);
    console.log('✅ Message deleted:', deleteResponse.data);
    console.log();

    console.log('🎉 All tests passed!\n');
    console.log('Note: Image upload test requires a test image file.');
    console.log('You can test image uploads through the UI.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Check if server is running
axios.get(`${API_URL}/api/messages`)
  .then(() => {
    console.log('✅ Server is running at', API_URL);
    console.log();
    testAPI();
  })
  .catch((error) => {
    console.error('❌ Cannot connect to server at', API_URL);
    console.error('Please make sure the server is running with: npm run dev');
    console.error('Error:', error.message);
    process.exit(1);
  });
