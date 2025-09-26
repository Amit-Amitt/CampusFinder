# Cloudinary Setup Guide for Image Upload

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Cloudinary Account
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click **"Sign Up For Free"**
3. Create your account (free tier includes 25GB storage)

### Step 2: Get Your Credentials
1. After signing up, you'll see your **Dashboard**
2. Note down these values:
   - **Cloud Name**: `your_cloud_name`
   - **API Key**: `your_api_key`
   - **API Secret**: `your_api_secret`

### Step 3: Update Your Environment
Add these to your `.env` file (or update `server.js`):

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 4: Update server.js
Replace the placeholder values in `server.js`:

```javascript
// Set Cloudinary config if not provided
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  process.env.CLOUDINARY_CLOUD_NAME = 'your_actual_cloud_name';
  process.env.CLOUDINARY_API_KEY = 'your_actual_api_key';
  process.env.CLOUDINARY_API_SECRET = 'your_actual_api_secret';
}
```

## 🎯 Features Added

### ✅ Image Upload Functionality
- **Multiple Images**: Upload up to 5 images per item
- **File Validation**: Only image files allowed (JPG, PNG, GIF, WebP)
- **Size Limit**: Maximum 5MB per image
- **Auto Optimization**: Images are automatically resized and optimized
- **Cloud Storage**: Images stored securely on Cloudinary

### ✅ User Interface
- **Drag & Drop**: Easy image upload interface
- **Preview**: See uploaded images before posting
- **Remove Images**: Delete images before posting
- **Progress Indicator**: Shows upload progress
- **Error Handling**: Clear error messages for failed uploads

### ✅ Display Features
- **Item Cards**: Show first image in item listings
- **Item Details**: Display all images with click-to-expand
- **Responsive**: Works on all device sizes
- **Fallback**: Shows "No Image" placeholder when no images

## 🔧 How It Works

1. **User selects images** in the Post Item form
2. **Images are uploaded** to Cloudinary via `/api/items/upload`
3. **Image URLs are stored** in the database with the item
4. **Images are displayed** throughout the application

## 🚨 Troubleshooting

### Issue: "Upload failed"
- **Check Cloudinary credentials** in server.js
- **Verify internet connection**
- **Check file size** (must be under 5MB)

### Issue: "Only image files are allowed"
- **File type**: Only JPG, PNG, GIF, WebP allowed
- **File extension**: Make sure file has proper extension

### Issue: "Too many files"
- **Limit**: Maximum 5 images per item
- **Solution**: Remove some images before uploading more

## 🎉 Ready to Use!

Once you've set up Cloudinary:
1. **Restart your server**: `npm run dev`
2. **Go to**: http://localhost:3000
3. **Login/Register** your account
4. **Click "Post Item"**
5. **Upload images** and post your item!

---

**Need help?** Check the Cloudinary documentation or contact support.
