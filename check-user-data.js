#!/usr/bin/env node

/**
 * Script to check user data in the database
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function checkUserData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({}).select('-password');
    
    console.log(`\n👥 Found ${users.length} users in database:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. User Details:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: "${user.name}" (type: ${typeof user.name})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Verified: ${user.isVerified}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Updated: ${user.updatedAt}`);
      console.log('');
    });

    // Check for users with missing names
    const usersWithoutNames = users.filter(user => !user.name || user.name.trim() === '');
    if (usersWithoutNames.length > 0) {
      console.log(`⚠️  Found ${usersWithoutNames.length} users without names:`);
      usersWithoutNames.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user._id})`);
      });
      console.log('');
    }

    // Update users without names
    if (usersWithoutNames.length > 0) {
      console.log('🔧 Updating users without names...');
      for (const user of usersWithoutNames) {
        // Extract name from email (before @)
        const emailName = user.email.split('@')[0];
        const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        
        user.name = displayName;
        await user.save();
        console.log(`   ✅ Updated ${user.email} -> name: "${displayName}"`);
      }
      console.log('');
    }

    // Verify the updates
    console.log('🔍 Verifying updates...');
    const updatedUsers = await User.find({}).select('-password');
    console.log(`\n👥 Updated user list:\n`);
    
    updatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkUserData();


