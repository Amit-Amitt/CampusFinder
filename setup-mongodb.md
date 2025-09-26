# MongoDB Setup Guide

## Option 1: Local MongoDB Installation

### Windows:
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Install MongoDB with default settings
3. Start MongoDB service:
   ```bash
   net start MongoDB
   ```

### macOS:
```bash
# Install using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Linux (Ubuntu/Debian):
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Option 2: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update your `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lostfound?retryWrites=true&w=majority
   ```

## Option 3: Docker

```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or with persistent data
docker run -d -p 27017:27017 --name mongodb -v mongodb_data:/data/db mongo:latest
```

## Verify MongoDB is Running

```bash
# Check if MongoDB is running
mongosh

# Or using mongo client
mongo
```

## Troubleshooting

### Common Issues:

1. **Port 27017 already in use:**
   ```bash
   # Find process using port 27017
   netstat -ano | findstr :27017
   # Kill the process
   taskkill /PID <PID> /F
   ```

2. **Permission denied:**
   - Make sure MongoDB service is running with proper permissions
   - Check if MongoDB data directory exists and is writable

3. **Connection refused:**
   - Verify MongoDB service is running
   - Check firewall settings
   - Ensure MongoDB is listening on the correct port

### Test Connection:

```bash
# Test connection from command line
mongosh "mongodb://localhost:27017/lostfound"
```

## Environment Variables

Make sure your `.env` file contains:

```env
MONGODB_URI=mongodb://localhost:27017/lostfound
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lostfound?retryWrites=true&w=majority
```



