# Troubleshooting Guide

## Common Issues and Solutions

### 1. Cloudinary Undefined Error

**Problem:** `Cloudinary is undefined` or `Cloudinary configuration error`

**Solutions:**
- The app now automatically falls back to local storage if Cloudinary is not configured
- To use Cloudinary, update your `.env` file with real credentials:
  ```
  CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
  CLOUDINARY_API_KEY=your_actual_api_key
  CLOUDINARY_API_SECRET=your_actual_api_secret
  ```
- Get Cloudinary credentials from: https://cloudinary.com/console

### 2. MongoDB Connection Error

**Problem:** `MongoDB connection error` or `Failed to connect to MongoDB`

**Solutions:**

#### Option A: Install MongoDB Locally
1. **Windows:**
   - Download from: https://www.mongodb.com/try/download/community
   - Install with default settings
   - Start service: `net start MongoDB`

2. **macOS:**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb/brew/mongodb-community
   ```

3. **Linux:**
   ```bash
   sudo apt-get install mongodb
   sudo systemctl start mongod
   ```

#### Option B: Use MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/atlas
2. Create free account and cluster
3. Get connection string
4. Update `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lostfound
   ```

#### Option C: Use Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. Port Already in Use

**Problem:** `Port 5000 is already in use`

**Solutions:**
- Kill process using port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # macOS/Linux
  lsof -ti:5000 | xargs kill -9
  ```
- Or change port in `.env`:
  ```
  PORT=5001
  ```

### 4. Module Not Found Errors

**Problem:** `Cannot find module` errors

**Solutions:**
- Install dependencies:
  ```bash
  npm install
  cd client && npm install
  ```
- Clear cache:
  ```bash
  npm cache clean --force
  rm -rf node_modules package-lock.json
  npm install
  ```

### 5. Client Build Errors

**Problem:** React build fails or client won't start

**Solutions:**
- Check Node.js version (should be 14+):
  ```bash
  node --version
  ```
- Clear client cache:
  ```bash
  cd client
  rm -rf node_modules package-lock.json
  npm install
  ```
- Check for syntax errors in React components

### 6. Environment Variables Not Loading

**Problem:** Environment variables not being read

**Solutions:**
- Make sure `.env` file is in root directory
- Check `.env` file format (no spaces around `=`)
- Restart server after changing `.env`
- Use `dotenv` package if needed

### 7. File Upload Issues

**Problem:** Images not uploading or showing

**Solutions:**
- Check if `uploads` directory exists
- Verify file permissions
- Check file size limits
- Ensure proper MIME types

### 8. Authentication Issues

**Problem:** Login/register not working

**Solutions:**
- Check JWT_SECRET in `.env`
- Verify user model and routes
- Check password hashing
- Clear browser cookies/localStorage

## Quick Setup Commands

```bash
# 1. Install dependencies
npm install
cd client && npm install

# 2. Start MongoDB (choose one)
# Local MongoDB
brew services start mongodb/brew/mongodb-community  # macOS
sudo systemctl start mongod                        # Linux
net start MongoDB                                  # Windows

# Or Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 3. Start the application
npm run dev        # Backend only
npm run client     # Frontend only
npm run dev & npm run client  # Both (separate terminals)
```

## Environment Variables Reference

```env
# Required
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lostfound
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production

# Optional
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

## Getting Help

1. Check the console logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check if required services (MongoDB) are running
5. Review the setup guides in the project documentation

## Logs to Check

- Server logs: Console output when running `npm run dev`
- Client logs: Browser console (F12)
- MongoDB logs: Check MongoDB service status
- Network logs: Check if ports are accessible



