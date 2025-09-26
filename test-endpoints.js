#!/usr/bin/env node

/**
 * Test script to verify API endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');

  try {
    // Test 1: Items endpoint
    console.log('1. Testing GET /api/items...');
    const itemsResponse = await axios.get(`${BASE_URL}/api/items`);
    console.log(`✅ Items endpoint working - Found ${itemsResponse.data.items.length} items`);
    console.log(`   Total items: ${itemsResponse.data.total}`);
    console.log(`   Total pages: ${itemsResponse.data.totalPages}\n`);

    // Test 2: Register a test user
    console.log('2. Testing POST /api/auth/register...');
    const testUser = {
      name: 'Test User',
      email: 'test@campusfinder.com',
      password: 'test123',
      phone: '9876543210'
    };
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
      console.log('✅ Registration working');
      console.log(`   User ID: ${registerResponse.data.user.id}`);
      console.log(`   Token: ${registerResponse.data.token.substring(0, 20)}...\n`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('✅ Registration working (user already exists)\n');
      } else {
        throw error;
      }
    }

    // Test 3: Login
    console.log('3. Testing POST /api/auth/login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login working');
    console.log(`   User: ${loginResponse.data.user.name}`);
    console.log(`   Role: ${loginResponse.data.user.role}`);
    console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...\n`);

    // Test 4: Protected route with token
    console.log('4. Testing GET /api/auth/me (protected route)...');
    const token = loginResponse.data.token;
    const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Protected route working');
    console.log(`   Authenticated user: ${meResponse.data.user.name}\n`);

    // Test 5: Items stats
    console.log('5. Testing GET /api/items/stats...');
    const statsResponse = await axios.get(`${BASE_URL}/api/items/stats`);
    console.log('✅ Stats endpoint working');
    console.log(`   Lost items: ${statsResponse.data.totalLost}`);
    console.log(`   Found items: ${statsResponse.data.totalFound}`);
    console.log(`   Active cases: ${statsResponse.data.activeCases}`);
    console.log(`   Resolved cases: ${statsResponse.data.successfulReturns}\n`);

    console.log('🎉 All tests passed! The API is working correctly.\n');
    
    console.log('📋 Summary:');
    console.log('- ✅ Server is running on port 5000');
    console.log('- ✅ MongoDB connection is working');
    console.log('- ✅ Authentication system is working');
    console.log('- ✅ Items API is working');
    console.log('- ✅ Protected routes are working');
    
    console.log('\n🔧 Next steps:');
    console.log('1. Start the client: cd client && npm start');
    console.log('2. Open http://localhost:3000 in your browser');
    console.log('3. Try logging in with: test@campusfinder.com / test123');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
testEndpoints();

