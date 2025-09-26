#!/usr/bin/env node

/**
 * Script to fix the problematic item with missing required fields
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Item = require('./models/Item');
const User = require('./models/User');

async function fixProblematicItem() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find the problematic item
    const problematicItem = await Item.findById('68cfdefeceae0accc80862bc');
    
    if (!problematicItem) {
      console.log('❌ Item not found');
      return;
    }
    
    console.log('🔧 Fixing problematic item...');
    console.log('Current item data:', {
      title: problematicItem.title,
      type: problematicItem.type,
      category: problematicItem.category,
      status: problematicItem.status,
      postedBy: problematicItem.postedBy,
      location: problematicItem.location
    });
    
    // Get a user to assign as postedBy (use the first available user)
    const firstUser = await User.findOne({});
    if (!firstUser) {
      console.log('❌ No users found in database');
      return;
    }
    
    // Fix all the issues
    problematicItem.title = 'DBMS Textbook';
    problematicItem.type = 'lost';
    problematicItem.category = 'books';
    problematicItem.status = 'active';
    problematicItem.postedBy = firstUser._id;
    problematicItem.location = {
      foundLocation: 'Library',
      coordinates: {
        lat: 0,
        lng: 0
      }
    };
    problematicItem.date = new Date();
    
    await problematicItem.save();
    console.log('✅ Item fixed successfully!');
    
    // Verify the fix
    const fixedItem = await Item.findById('68cfdefeceae0accc80862bc').populate('postedBy', 'name email');
    console.log('\n📦 Fixed item data:');
    console.log(`   Title: ${fixedItem.title}`);
    console.log(`   Type: ${fixedItem.type}`);
    console.log(`   Category: ${fixedItem.category}`);
    console.log(`   Status: ${fixedItem.status}`);
    console.log(`   Posted By: ${fixedItem.postedBy.name} (${fixedItem.postedBy.email})`);
    console.log(`   Location: ${fixedItem.location.foundLocation}`);

    // Test the public API query
    console.log('\n🔍 Testing public API query...');
    const publicQuery = { status: 'active' };
    const publicItems = await Item.find(publicQuery)
      .populate('postedBy', 'name')
      .populate('claimedBy', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`   Public API now returns: ${publicItems.length} items`);
    publicItems.forEach((item, index) => {
      console.log(`     ${index + 1}. ${item.title} (${item.type}) - Status: ${item.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixProblematicItem();


