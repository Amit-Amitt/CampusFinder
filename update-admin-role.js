#!/usr/bin/env node

/**
 * Script to update admin user role
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function updateAdminRole() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@campusfinder.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log(`👤 Found admin user: ${adminUser.name}`);
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔑 Current role: ${adminUser.role}`);

    // Update role to admin
    adminUser.role = 'admin';
    await adminUser.save();

    console.log('✅ Admin role updated successfully!');
    console.log(`🔑 New role: ${adminUser.role}`);

    // Also update the test user to admin for testing
    const testUser = await User.findOne({ email: 'test@campusfinder.com' });
    if (testUser) {
      testUser.role = 'admin';
      await testUser.save();
      console.log('✅ Test user role also updated to admin');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateAdminRole();

