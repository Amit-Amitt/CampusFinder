#!/usr/bin/env node

/**
 * Enhanced Server Startup Script
 * This script provides better error handling and setup guidance
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Lost & Found Web Application...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found. Creating default configuration...');
  
  const defaultEnv = `# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/lostfound

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production

# Cloudinary Configuration (Optional - will fallback to local storage if not provided)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password`;

  fs.writeFileSync(envPath, defaultEnv);
  console.log('✅ Created .env file with default configuration');
  console.log('📝 Please update the .env file with your actual configuration values\n');
}

// Check if uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  console.log('Please run: npm install\n');
}

// Check if client node_modules exists
const clientNodeModulesPath = path.join(__dirname, 'client', 'node_modules');
if (!fs.existsSync(clientNodeModulesPath)) {
  console.log('📦 Installing client dependencies...');
  console.log('Please run: cd client && npm install\n');
}

console.log('🔧 System Check Complete');
console.log('📋 Next Steps:');
console.log('1. Make sure MongoDB is running (see setup-mongodb.md for help)');
console.log('2. Update .env file with your configuration');
console.log('3. Run: npm install (if not done already)');
console.log('4. Run: cd client && npm install (if not done already)');
console.log('5. Start the server: npm run dev');
console.log('6. Start the client: npm run client\n');

// Start the actual server
console.log('🎯 Starting server...\n');
require('./server.js');



