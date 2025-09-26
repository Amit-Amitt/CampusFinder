# CampusFinder API Documentation

## Base URL
```
http://localhost:5001/api
```

## Authentication
Most endpoints require authentication via JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
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

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@college.edu",
    "role": "student"
  }
}
```

### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@college.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@college.edu",
    "role": "student"
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@college.edu",
  "role": "student",
  "department": "Computer Science",
  "year": "2024",
  "stats": {
    "itemsPosted": 5,
    "itemsFound": 2,
    "itemsClaimed": 1
  }
}
```

---

## 📦 Item Endpoints

### Get All Items
```http
GET /items?page=1&limit=10&category=electronics&type=lost&search=phone&location=library
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `category` (optional): Filter by category
- `type` (optional): Filter by type (lost/found)
- `status` (optional): Filter by status (default: active)
- `search` (optional): Search in title/description
- `location` (optional): Filter by location

**Response:**
```json
{
  "items": [
    {
      "id": "item_id",
      "title": "iPhone 13",
      "description": "Lost my iPhone in the library",
      "category": "electronics",
      "type": "lost",
      "status": "active",
      "location": {
        "foundLocation": "Main Library"
      },
      "date": "2024-01-15T10:30:00Z",
      "images": [
        {
          "url": "image_url",
          "publicId": "cloudinary_id"
        }
      ],
      "postedBy": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@college.edu"
      },
      "tags": ["phone", "iphone", "black"]
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "total": 50
}
```

### Get Single Item
```http
GET /items/:id
```

**Response:**
```json
{
  "id": "item_id",
  "title": "iPhone 13",
  "description": "Lost my iPhone in the library",
  "category": "electronics",
  "type": "lost",
  "status": "active",
  "location": {
    "foundLocation": "Main Library",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  },
  "date": "2024-01-15T10:30:00Z",
  "images": [
    {
      "url": "image_url",
      "publicId": "cloudinary_id"
    }
  ],
  "contactInfo": {
    "email": "john@college.edu",
    "phone": "+1234567890",
    "preferredContact": "email"
  },
  "postedBy": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@college.edu",
    "phone": "+1234567890"
  },
  "claimedBy": null,
  "tags": ["phone", "iphone", "black"],
  "verificationDetails": {
    "uniqueIdentifiers": ["Case with initials JD"],
    "verificationQuestions": ["What's the lock screen wallpaper?"],
    "verificationAnswers": ["Mountain landscape"]
  },
  "matchScore": 85,
  "matchedItems": [
    {
      "item": "matched_item_id",
      "score": 85,
      "matchedAt": "2024-01-15T12:00:00Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Create New Item
```http
POST /items
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Black Wallet",
  "description": "Lost my black leather wallet in the library",
  "category": "wallet",
  "type": "lost",
  "foundLocation": "Main Library",
  "date": "2024-01-15T10:30:00Z",
  "contactInfo": {
    "email": "john@college.edu",
    "phone": "+1234567890",
    "preferredContact": "email"
  },
  "tags": ["black", "leather", "wallet"],
  "images": [
    {
      "url": "image_url",
      "publicId": "cloudinary_id"
    }
  ],
  "verificationDetails": {
    "uniqueIdentifiers": ["Driver's license with photo"],
    "verificationQuestions": ["What's the last 4 digits of your student ID?"],
    "verificationAnswers": ["1234"]
  }
}
```

**Response:**
```json
{
  "id": "new_item_id",
  "title": "Black Wallet",
  "description": "Lost my black leather wallet in the library",
  "category": "wallet",
  "type": "lost",
  "status": "active",
  "postedBy": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@college.edu",
    "phone": "+1234567890"
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Update Item
```http
PUT /items/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "claimed"
}
```

### Delete Item
```http
DELETE /items/:id
Authorization: Bearer <token>
```

### Upload Images
```http
POST /items/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
- `images`: File array (max 5 files)

**Response:**
```json
[
  {
    "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/image.jpg",
    "publicId": "image_public_id"
  }
]
```

### Get Item Statistics
```http
GET /items/stats
```

**Response:**
```json
{
  "totalLost": 150,
  "totalFound": 120,
  "activeCases": 200,
  "successfulReturns": 70
}
```

### Get Matches for Item
```http
GET /items/:id/matches
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "item": {
      "id": "matched_item_id",
      "title": "Found Black Wallet",
      "description": "Found a black wallet in the library",
      "category": "wallet",
      "type": "found",
      "postedBy": {
        "id": "finder_id",
        "name": "Jane Smith",
        "email": "jane@college.edu"
      }
    },
    "score": 85,
    "matchedAt": "2024-01-15T12:00:00Z"
  }
]
```

### Claim Item
```http
POST /items/:id/claim
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Item claimed successfully",
  "item": {
    "id": "item_id",
    "status": "claimed",
    "claimedBy": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@college.edu"
    }
  }
}
```

### Resolve Item
```http
POST /items/:id/resolve
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notes": "Item successfully returned to owner"
}
```

**Response:**
```json
{
  "message": "Item resolved successfully",
  "item": {
    "id": "item_id",
    "status": "resolved",
    "resolutionDate": "2024-01-15T15:30:00Z",
    "resolutionNotes": "Item successfully returned to owner"
  }
}
```

### Get Match Suggestions
```http
GET /items/user/suggestions
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "item": {
      "id": "user_item_id",
      "title": "Lost iPhone",
      "type": "lost"
    },
    "matches": [
      {
        "item": "found_item_id",
        "score": 90,
        "matchedAt": "2024-01-15T12:00:00Z"
      }
    ]
  }
]
```

---

## 💬 Message Endpoints

### Get Messages for Item
```http
GET /messages/item/:itemId
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "message_id",
    "item": "item_id",
    "sender": {
      "id": "sender_id",
      "name": "John Doe",
      "email": "john@college.edu",
      "avatar": "avatar_url"
    },
    "receiver": {
      "id": "receiver_id",
      "name": "Jane Smith",
      "email": "jane@college.edu",
      "avatar": "avatar_url"
    },
    "message": "I think I found your wallet!",
    "messageType": "claim_request",
    "isRead": false,
    "createdAt": "2024-01-15T12:00:00Z"
  }
]
```

### Send Message
```http
POST /messages
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "itemId": "item_id",
  "receiverId": "receiver_user_id",
  "message": "I think I found your wallet!",
  "messageType": "claim_request"
}
```

**Response:**
```json
{
  "id": "message_id",
  "item": "item_id",
  "sender": {
    "id": "sender_id",
    "name": "John Doe",
    "email": "john@college.edu",
    "avatar": "avatar_url"
  },
  "receiver": {
    "id": "receiver_id",
    "name": "Jane Smith",
    "email": "jane@college.edu",
    "avatar": "avatar_url"
  },
  "message": "I think I found your wallet!",
  "messageType": "claim_request",
  "isRead": false,
  "createdAt": "2024-01-15T12:00:00Z"
}
```

### Mark Message as Read
```http
PUT /messages/:messageId/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Message marked as read"
}
```

### Get User Conversations
```http
GET /messages/conversations
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "item_id",
    "item": {
      "id": "item_id",
      "title": "Lost iPhone",
      "type": "lost",
      "category": "electronics"
    },
    "lastMessage": {
      "message": "I think I found your phone!",
      "createdAt": "2024-01-15T12:00:00Z",
      "sender": {
        "id": "sender_id",
        "name": "John Doe"
      },
      "receiver": {
        "id": "receiver_id",
        "name": "Jane Smith"
      }
    },
    "unreadCount": 2
  }
]
```

---

## 🔔 Notification Endpoints

### Get Notifications
```http
GET /notifications?page=1&limit=20&unreadOnly=false
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Notifications per page
- `unreadOnly` (optional): Filter unread only

**Response:**
```json
{
  "notifications": [
    {
      "id": "notification_id",
      "type": "match_found",
      "title": "Potential Match Found!",
      "message": "We found 2 potential matches for your lost item: iPhone 13",
      "item": {
        "id": "item_id",
        "title": "iPhone 13",
        "type": "lost",
        "category": "electronics"
      },
      "sender": {
        "id": "sender_id",
        "name": "System",
        "email": "system@campusfinder.com"
      },
      "isRead": false,
      "metadata": {
        "matches": 2,
        "topScore": 85
      },
      "createdAt": "2024-01-15T12:00:00Z"
    }
  ],
  "totalPages": 3,
  "currentPage": 1,
  "total": 50
}
```

### Mark Notification as Read
```http
PUT /notifications/:notificationId/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Notification marked as read"
}
```

### Mark All Notifications as Read
```http
PUT /notifications/mark-all-read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

### Get Unread Count
```http
GET /notifications/unread-count
Authorization: Bearer <token>
```

**Response:**
```json
{
  "count": 5
}
```

### Delete Notification
```http
DELETE /notifications/:notificationId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Notification deleted"
}
```

---

## 📢 Announcement Endpoints

### Get Active Announcements (Public)
```http
GET /announcements/active?type=general&priority=high
```

**Query Parameters:**
- `type` (optional): Filter by type
- `priority` (optional): Filter by priority

**Response:**
```json
[
  {
    "id": "announcement_id",
    "title": "Library Lost & Found Collection",
    "content": "All unclaimed items from the library will be moved to the admin office on Friday.",
    "type": "general",
    "priority": "medium",
    "targetAudience": "all",
    "createdBy": {
      "id": "admin_id",
      "name": "Admin User",
      "role": "admin"
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "expiresAt": "2024-01-20T23:59:59Z"
  }
]
```

### Get All Announcements (Admin Only)
```http
GET /announcements?page=1&limit=20&isActive=true
Authorization: Bearer <admin_token>
```

### Create Announcement (Admin Only)
```http
POST /announcements
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "title": "Important Update",
  "content": "New features have been added to CampusFinder!",
  "type": "general",
  "priority": "medium",
  "expiresAt": "2024-02-15T23:59:59Z",
  "targetAudience": "all"
}
```

### Update Announcement (Admin Only)
```http
PUT /announcements/:id
Authorization: Bearer <admin_token>
```

### Delete Announcement (Admin Only)
```http
DELETE /announcements/:id
Authorization: Bearer <admin_token>
```

---

## 👨‍💼 Admin Endpoints

### Get Dashboard Statistics
```http
GET /admin/dashboard
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "overview": {
    "totalUsers": 500,
    "totalItems": 300,
    "lostItems": 150,
    "foundItems": 120,
    "resolvedItems": 30,
    "activeItems": 270,
    "totalMessages": 1000,
    "totalNotifications": 2000
  },
  "userBreakdown": {
    "students": 450,
    "staff": 30,
    "faculty": 20
  },
  "recentActivity": {
    "recentItems": [...],
    "recentUsers": [...]
  },
  "categoryStats": [
    { "_id": "electronics", "count": 50 },
    { "_id": "wallet", "count": 30 },
    { "_id": "books", "count": 25 }
  ],
  "monthlyStats": [
    {
      "_id": { "year": 2024, "month": 1 },
      "count": 25,
      "lost": 15,
      "found": 10,
      "resolved": 5
    }
  ]
}
```

### Get All Users
```http
GET /admin/users?page=1&limit=20&role=student&search=john&isActive=true
Authorization: Bearer <admin_token>
```

### Update User Status
```http
PUT /admin/users/:userId
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "isActive": true,
  "role": "student",
  "isVerified": true
}
```

### Get All Items (Admin)
```http
GET /admin/items?page=1&limit=20&type=lost&status=active&category=electronics&search=phone
Authorization: Bearer <admin_token>
```

### Update Item (Admin)
```http
PUT /admin/items/:itemId
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "status": "resolved",
  "adminNotes": "Item successfully returned",
  "isPublic": true
}
```

### Delete Item (Admin)
```http
DELETE /admin/items/:itemId
Authorization: Bearer <admin_token>
```

---

## 📊 Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "Item not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error"
}
```

---

## 🔧 Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

---

## 📝 Notes

1. All timestamps are in ISO 8601 format
2. File uploads support both Cloudinary and local storage
3. The matching service runs automatically every hour
4. Admin endpoints require admin role
5. All endpoints support pagination where applicable
6. Search functionality uses MongoDB text indexing
7. Images are automatically optimized and resized
8. All user data is validated and sanitized
