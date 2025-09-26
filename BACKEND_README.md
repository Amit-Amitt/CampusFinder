# CampusFinder Backend API

A comprehensive backend API for the CampusFinder lost and found platform built with Node.js, Express, and MongoDB.

## 🚀 Features

### Core Functionality
- **User Management**: Registration, authentication, profile management
- **Item Management**: Post, search, filter, and manage lost/found items
- **Smart Matching**: AI-powered automatic matching of lost and found items
- **Messaging System**: Secure communication between users
- **Notifications**: Real-time notifications for matches, messages, and updates
- **Admin Dashboard**: Complete admin panel for platform management
- **Announcements**: Campus-wide announcements system

### Advanced Features
- **Image Upload**: Support for Cloudinary and local storage
- **Search & Filtering**: Advanced search with multiple criteria
- **Verification System**: Item ownership verification
- **Statistics**: Comprehensive analytics and reporting
- **Role-based Access**: Student, staff, faculty, and admin roles

## 📁 Project Structure

```
backend/
├── models/
│   ├── User.js              # User schema with college-specific fields
│   ├── Item.js              # Item schema with matching capabilities
│   ├── Message.js           # Messaging system schema
│   ├── Notification.js      # Notification system schema
│   └── Announcement.js      # Campus announcements schema
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── items.js             # Item management routes
│   ├── users.js             # User management routes
│   ├── messages.js          # Messaging system routes
│   ├── notifications.js     # Notification routes
│   ├── announcements.js     # Announcement routes
│   └── admin.js             # Admin dashboard routes
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── upload.js            # Image upload middleware
│   └── localUpload.js       # Local file upload fallback
├── services/
│   └── matchingService.js  # AI-powered matching algorithm
├── uploads/                 # Local file storage
└── server.js               # Main server file
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lostfoundweb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   
   # Cloudinary Configuration (optional)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /me` - Get current user profile

### Items (`/api/items`)
- `GET /` - Get all items with filtering
- `GET /:id` - Get single item
- `POST /` - Create new item
- `PUT /:id` - Update item
- `DELETE /:id` - Delete item
- `POST /upload` - Upload images
- `GET /stats` - Get item statistics
- `GET /:id/matches` - Get matches for item
- `POST /:id/claim` - Claim an item
- `POST /:id/resolve` - Mark item as resolved
- `GET /user/suggestions` - Get match suggestions

### Messages (`/api/messages`)
- `GET /item/:itemId` - Get messages for item
- `POST /` - Send message
- `PUT /:messageId/read` - Mark message as read
- `GET /conversations` - Get user's conversations

### Notifications (`/api/notifications`)
- `GET /` - Get user notifications
- `PUT /:notificationId/read` - Mark notification as read
- `PUT /mark-all-read` - Mark all notifications as read
- `GET /unread-count` - Get unread count
- `DELETE /:notificationId` - Delete notification

### Announcements (`/api/announcements`)
- `GET /active` - Get active announcements (public)
- `GET /` - Get all announcements (admin)
- `POST /` - Create announcement (admin)
- `PUT /:id` - Update announcement (admin)
- `DELETE /:id` - Delete announcement (admin)

### Admin (`/api/admin`)
- `GET /dashboard` - Get dashboard statistics
- `GET /users` - Get all users with pagination
- `PUT /users/:userId` - Update user status
- `GET /items` - Get all items with admin controls
- `PUT /items/:itemId` - Update item (admin)
- `DELETE /items/:itemId` - Delete item (admin)

## 🔧 Key Features Explained

### Smart Matching System
The matching service automatically finds potential matches between lost and found items based on:
- **Category similarity** (40% weight)
- **Title similarity** (30% weight)
- **Description similarity** (20% weight)
- **Location proximity** (10% weight)

### User Roles
- **Student**: Default role, can post and claim items
- **Staff**: Campus staff members
- **Faculty**: Teaching faculty
- **Admin**: Full platform access and management

### Item Categories
- Electronics, Clothing, Accessories, Documents, Books, Keys
- Wallet, ID Card, Phone, Laptop, Bag, Jewelry, Other

### Item Status Flow
1. **Active**: Newly posted item
2. **Claimed**: Someone has claimed the item
3. **Resolved**: Item has been successfully returned

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: express-validator for data validation
- **CORS Protection**: Cross-origin resource sharing configuration
- **Role-based Access**: Different access levels for different user types

## 📊 Database Schema

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  collegeId: String (unique),
  role: ['student', 'staff', 'faculty', 'admin'],
  department: String,
  year: String,
  isVerified: Boolean,
  isActive: Boolean,
  preferences: {
    emailNotifications: Boolean,
    pushNotifications: Boolean,
    preferredContact: ['email', 'phone']
  },
  stats: {
    itemsPosted: Number,
    itemsFound: Number,
    itemsClaimed: Number
  }
}
```

### Item Schema
```javascript
{
  title: String,
  description: String,
  category: String,
  type: ['lost', 'found'],
  location: {
    foundLocation: String,
    coordinates: { lat: Number, lng: Number }
  },
  date: Date,
  images: [{ url: String, publicId: String }],
  status: ['active', 'claimed', 'resolved'],
  contactInfo: {
    email: String,
    phone: String,
    preferredContact: ['email', 'phone']
  },
  postedBy: ObjectId (ref: User),
  claimedBy: ObjectId (ref: User),
  tags: [String],
  verificationDetails: {
    uniqueIdentifiers: [String],
    verificationQuestions: [String],
    verificationAnswers: [String]
  },
  matchScore: Number,
  matchedItems: [{ item: ObjectId, score: Number, matchedAt: Date }],
  isPublic: Boolean,
  adminNotes: String,
  resolutionDate: Date,
  resolutionNotes: String
}
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_strong_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Heroku Deployment
1. Create a Heroku app
2. Set environment variables
3. Deploy using Git:
   ```bash
   git push heroku main
   ```

## 📝 API Usage Examples

### Register a new user
```javascript
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@college.edu",
  "password": "password123",
  "phone": "+1234567890",
  "collegeId": "STU001",
  "role": "student",
  "department": "Computer Science",
  "year": "2024"
}
```

### Post a lost item
```javascript
POST /api/items
{
  "title": "Black Wallet",
  "description": "Lost my black leather wallet in the library",
  "category": "wallet",
  "type": "lost",
  "foundLocation": "Main Library",
  "date": "2024-01-15T10:30:00Z",
  "tags": ["black", "leather", "wallet"]
}
```

### Send a message
```javascript
POST /api/messages
{
  "itemId": "item_id_here",
  "receiverId": "user_id_here",
  "message": "I think I found your wallet!",
  "messageType": "claim_request"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@campusfinder.com or create an issue in the repository.
