#!/usr/bin/env node

/**
 * Script to check items in the database
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Item = require('./models/Item');
const User = require('./models/User');

async function checkItems() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all items
    const items = await Item.find({}).populate('postedBy', 'name email');
    
    console.log(`\n📦 Found ${items.length} items in database:\n`);
    
    items.forEach((item, index) => {
      console.log(`${index + 1}. Item Details:`);
      console.log(`   ID: ${item._id}`);
      console.log(`   Title: "${item.title}"`);
      console.log(`   Description: "${item.description}"`);
      console.log(`   Type: ${item.type}`);
      console.log(`   Category: ${item.category}`);
      console.log(`   Status: ${item.status}`);
      console.log(`   Posted By: ${item.postedBy?.name || 'Unknown'} (${item.postedBy?.email || 'Unknown'})`);
      console.log(`   Created: ${item.createdAt}`);
      console.log(`   Updated: ${item.updatedAt}`);
      console.log('');
    });

    // Check items by status
    const activeItems = await Item.find({ status: 'active' });
    const pendingItems = await Item.find({ status: 'pending_approval' });
    const resolvedItems = await Item.find({ status: 'resolved' });
    
    console.log('📊 Items by Status:');
    console.log(`   Active: ${activeItems.length}`);
    console.log(`   Pending Approval: ${pendingItems.length}`);
    console.log(`   Resolved: ${resolvedItems.length}`);
    console.log('');

    // Check items by type
    const lostItems = await Item.find({ type: 'lost' });
    const foundItems = await Item.find({ type: 'found' });
    
    console.log('📊 Items by Type:');
    console.log(`   Lost: ${lostItems.length}`);
    console.log(`   Found: ${foundItems.length}`);
    console.log('');

    // Test the public API endpoint query
    console.log('🔍 Testing public API query (same as browse page)...');
    const publicQuery = { status: 'active' };
    const publicItems = await Item.find(publicQuery)
      .populate('postedBy', 'name')
      .populate('claimedBy', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`   Public API returns: ${publicItems.length} items`);
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

checkItems();
