const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const fs = require('fs');

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('Environment variables check:');
console.log('CLOUDINARY_CLOUD_NAME:', cloudName ? 'SET' : 'MISSING');
console.log('CLOUDINARY_API_KEY:', apiKey ? 'SET' : 'MISSING');
console.log('CLOUDINARY_API_SECRET:', apiSecret ? 'SET' : 'MISSING');

// Check if Cloudinary credentials are properly configured (not default values)
const hasValidCloudinaryConfig = cloudName && 
  apiKey && 
  apiSecret && 
  cloudName !== 'your_cloudinary_cloud_name' &&
  apiKey !== 'your_cloudinary_api_key' &&
  apiSecret !== 'your_cloudinary_api_secret';

if (!hasValidCloudinaryConfig) {
  console.log('Cloudinary credentials not configured or using default values. Using local storage fallback.');
  console.log('To use Cloudinary, please set proper values in your .env file:');
  console.log('- CLOUDINARY_CLOUD_NAME=your_actual_cloud_name');
  console.log('- CLOUDINARY_API_KEY=your_actual_api_key');
  console.log('- CLOUDINARY_API_SECRET=your_actual_api_secret');
} else {
  console.log('All Cloudinary credentials found, configuring...');
  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });

    // Test Cloudinary connection (non-blocking)
    cloudinary.api.ping()
      .then(result => console.log('Cloudinary connected successfully:', result))
      .catch(error => {
        console.error('Cloudinary connection error:', error.message);
        console.log('Continuing with Cloudinary configuration despite connection test failure');
      });
  } catch (error) {
    console.error('Error configuring Cloudinary:', error.message);
    console.log('Falling back to local storage');
  }
}

// Configure multer storage for Cloudinary
let storage;
if (hasValidCloudinaryConfig) {
  try {
    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'lostfound-items',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' }
        ]
      }
    });
    console.log('Using Cloudinary storage');
  } catch (error) {
    console.error('Cloudinary storage error, falling back to local storage:', error.message);
    storage = createLocalStorage();
  }
} else {
  console.log('Cloudinary not configured, using local storage');
  storage = createLocalStorage();
}

// Function to create local storage
function createLocalStorage() {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory:', uploadDir);
  }
  
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
      console.log('Saving file:', filename);
      cb(null, filename);
    }
  });
}

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware for handling upload errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum 5 files allowed.' });
    }
  }
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ message: 'Only image files are allowed!' });
  }
  next(error);
};

module.exports = {
  upload,
  handleUploadError,
  cloudinary
};
