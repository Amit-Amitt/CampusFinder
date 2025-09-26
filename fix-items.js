#!/usr/bin/env node

/**
 * Script to fix items with undefined data
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Item = require('./models/Item');
const User = require('./models/User');

async function fixItems() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find items with undefined data
    const problematicItems = await Item.find({
      $or: [
        { title: 'undefined' },
        { type: undefined },
        { type: 'undefined' }
      ]
    });
    
    console.log(`\n🔧 Found ${problematicItems.length} items with undefined data:\n`);
    
    for (const item of problematicItems) {
      console.log(`Fixing item: ${item._id}`);
      
      let needsUpdate = false;
      
      // Fix title if it's "undefined"
      if (!item.title || item.title === 'undefined') {
        item.title = 'Untitled Item';
        needsUpdate = true;
        console.log(`   ✅ Fixed title: "Untitled Item"`);
      }
      
      // Fix type if it's undefined
      if (!item.type || item.type === 'undefined') {
        item.type = 'lost'; // Default to lost
        needsUpdate = true;
        console.log(`   ✅ Fixed type: "lost"`);
      }
      
      // Fix status if it's pending_approval
      if (item.status === 'pending_approval') {
        item.status = 'active';
        needsUpdate = true;
        console.log(`   ✅ Fixed status: "pending_approval" -> "active"`);
      }
      
      if (needsUpdate) {
        await item.save();
        console.log(`   💾 Saved changes`);
      }
      console.log('');
    }

    // Verify the updates
    console.log('🔍 Verifying updates...');
    const allItems = await Item.find({}).populate('postedBy', 'name email');
    console.log(`\n📦 Updated items list:\n`);
    
    allItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title} (${item.type}) - Status: ${item.status} - Posted by: ${item.postedBy?.name || 'Unknown'}`);
    });

    // Test the public API query again
    console.log('\n🔍 Testing public API query after fixes...');
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

fixItems();


