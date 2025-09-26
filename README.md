# CampusFinder - Lost & Found Platform

A comprehensive campus lost and found management system built with React.js, Node.js, Express, and MongoDB. Features intelligent auto-matching, real-time chat, and a modern responsive UI.

## 🚀 Features

### Core Functionality
- **Smart Auto-Matching**: AI-powered matching system that connects lost and found items based on location, date, category, and keywords
- **Real-time Chat**: Secure messaging system between users with anonymous display names
- **User Management**: Role-based access (Student, Staff, Admin) with authentication
- **Item Management**: Post, edit, and manage lost/found items with image uploads
- **Notifications**: Instant alerts for matches, messages, and updates

### Advanced Features
- **Intelligent Search**: Advanced filtering by category, location, date, and keywords
- **Admin Dashboard**: Comprehensive admin panel for platform management
- **Responsive Design**: Mobile-first design with TailwindCSS
- **Privacy Protection**: Anonymous chat system with generated display names
- **Cron Jobs**: Automated matching, cleanup, and statistics updates

## 🛠️ Tech Stack

### Frontend
- **React.js** - Frontend framework
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **Yup** - Schema validation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File upload handling
- **Express Validator** - Input validation

### Services
- **Auto-Matching Service** - Intelligent item matching algorithm
- **Cron Service** - Automated background tasks
- **Notification Service** - Real-time notifications
- **Chat Service** - Messaging system

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/campusfinder.git
   cd campusfinder
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Create .env file in root directory
   touch .env
   ```
   
   Add the following to your `.env` file:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/campusfinder
   JWT_SECRET=your_jwt_secret_key_here
   REACT_APP_API_URL=http://localhost:5000
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB service
   # On Windows: net start MongoDB
   # On macOS: brew services start mongodb-community
   # On Linux: sudo systemctl start mongod
   ```

5. **Run the application**
   ```bash
   # Start backend server
   npm run dev
   
   # In a new terminal, start frontend
   cd client
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🎯 Usage

### For Students/Staff
1. **Browse Items**: View all lost and found items
2. **Post Items**: Report lost or found items with photos
3. **Get Matched**: Receive automatic notifications for potential matches
4. **Chat Securely**: Communicate with other users anonymously
5. **Manage Profile**: Update personal information and preferences

### For Administrators
1. **Dashboard**: Monitor platform statistics and activity
2. **User Management**: Manage user accounts and roles
3. **Item Moderation**: Approve, reject, or manage reported items
4. **Manual Matching**: Create matches between items manually
5. **Analytics**: View detailed platform analytics

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Items
- `GET /api/items` - Get all items
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get specific item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/items/:id/matches` - Get item matches

### Matching
- `GET /api/items/suggestions` - Get match suggestions
- `POST /api/items/match` - Create manual match

### Chat
- `GET /api/chats` - Get user chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/chats/:id/messages` - Send message

### Admin
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/items` - Get all items
- `POST /api/admin/items/:id/match/:matchId` - Manual match

## 🤖 Auto-Matching Algorithm

The system uses a sophisticated matching algorithm that considers:

- **Location Similarity (30%)**: Campus location matching
- **Date Proximity (20%)**: Time-based relevance
- **Category Match (30%)**: Item category alignment
- **Keyword Analysis (20%)**: Text similarity using Jaccard similarity

**Matching Process:**
1. New item posted → Immediate matching scan
2. Hourly cron job → Global matching for all items
3. Score calculation → Weighted algorithm
4. Threshold check → Only matches above 70%
5. Notification → Instant alerts to users
6. Chat creation → Automatic secure messaging

## 📱 Screenshots

### Home Page
- Modern gradient design with glassmorphism effects
- Quick action buttons for posting items
- Platform statistics display
- Feature showcase

### Dashboard
- User statistics and activity overview
- Recent matches and notifications
- Quick access to all features
- Chat management interface

### Item Management
- Advanced filtering and search
- Image upload with preview
- Category-based organization
- Status tracking

## 🚀 Deployment

### Frontend (Netlify/Vercel)
1. Build the React app: `cd client && npm run build`
2. Deploy the `build` folder to your hosting service
3. Set environment variables for API URL

### Backend (Heroku/Railway)
1. Set up MongoDB Atlas for production database
2. Configure environment variables
3. Deploy to your preferred hosting service
4. Ensure cron jobs are running

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Amit** - *Initial work* - [MyGitHub](https://github.com/Amit-Amitt)

## 🙏 Acknowledgments

- React.js community for excellent documentation
- TailwindCSS for the utility-first CSS framework
- MongoDB for the flexible database solution
- Express.js for the robust web framework

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact: share.amitt@gmail.com
- Check the documentation in the `/docs` folder

---

**Made with ❤️ for campus communities**
