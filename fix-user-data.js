#!/usr/bin/env node

/**
 * Script to fix user data issues
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function fixUserData() {
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
    
    for (const user of users) {
      console.log(`Processing: ${user.email}`);
      
      let needsUpdate = false;
      
      // Fix name if it's "undefined" or empty
      if (!user.name || user.name === 'undefined' || user.name.trim() === '') {
        // Extract name from email (before @)
        const emailName = user.email.split('@')[0];
        const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        user.name = displayName;
        needsUpdate = true;
        console.log(`   ✅ Fixed name: "${displayName}"`);
      }
      
      // Fix role if it's "user" (convert to "student")
      if (user.role === 'user') {
        user.role = 'student';
        needsUpdate = true;
        console.log(`   ✅ Fixed role: "user" -> "student"`);
      }
      
      if (needsUpdate) {
        await user.save();
        console.log(`   💾 Saved changes`);
      } else {
        console.log(`   ✅ No changes needed`);
      }
      console.log('');
    }

    // Verify the updates
    console.log('🔍 Verifying updates...');
    const updatedUsers = await User.find({}).select('-password');
    console.log(`\n👥 Updated user list:\n`);
    
    updatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixUserData();


