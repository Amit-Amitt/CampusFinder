const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Item = require('../models/Item');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Announcement = require('../models/Announcement');

// Middleware to check admin role
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Get dashboard statistics
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    const stats = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ status: 'resolved' }),
      Item.countDocuments({ status: 'active' }),
      Message.countDocuments(),
      Notification.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'staff' }),
      User.countDocuments({ role: 'faculty' })
    ]);

    const [
      totalUsers,
      totalItems,
      lostItems,
      foundItems,
      resolvedItems,
      activeItems,
      totalMessages,
      totalNotifications,
      students,
      staff,
      faculty
    ] = stats;

    // Get recent activity
    const recentItems = await Item.find()
      .populate('postedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10);

    // Get category breakdown
    const categoryStats = await Item.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get monthly stats for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Item.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          lost: { $sum: { $cond: [{ $eq: ['$type', 'lost'] }, 1, 0] } },
          found: { $sum: { $cond: [{ $eq: ['$type', 'found'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalItems,
        lostItems,
        foundItems,
        resolvedItems,
        activeItems,
        totalMessages,
        totalNotifications
      },
      userBreakdown: {
        students,
        staff,
        faculty
      },
      recentActivity: {
        recentItems,
        recentUsers
      },
      categoryStats,
      monthlyStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

// Get all users with pagination
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { collegeId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Update user status
router.put('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { isActive, role, isVerified } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Toggle user status (for admin panel)
router.put('/users/:userId/toggle-status', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle the isActive status
    user.isActive = !user.isActive;
    await user.save();

    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling user status', error: error.message });
  }
});

// Get all items with admin controls
router.get('/items', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, category, search } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.foundLocation': { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Item.find(query)
      .populate('postedBy', 'name email role')
      .populate('claimedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Item.countDocuments(query);

    res.json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
});

// Update item status (admin)
router.put('/items/:itemId', auth, adminAuth, async (req, res) => {
  try {
    const { status, adminNotes, isPublic } = req.body;

    const item = await Item.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (status) item.status = status;
    if (adminNotes !== undefined) item.adminNotes = adminNotes;
    if (isPublic !== undefined) item.isPublic = isPublic;

    if (status === 'resolved') {
      item.resolutionDate = new Date();
    }

    await item.save();

    await item.populate('postedBy', 'name email role');
    await item.populate('claimedBy', 'name email');

    res.json({ message: 'Item updated successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Error updating item', error: error.message });
  }
});

// Delete item (admin)
router.delete('/items/:itemId', auth, adminAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Delete related data in the correct order
    // 1. Delete chat messages first
    const ChatMessage = require('../models/ChatMessage');
    await ChatMessage.deleteMany({ conversationId: { $regex: req.params.itemId } });
    
    // 2. Delete chats/conversations
    const Chat = require('../models/Chat');
    await Chat.deleteMany({ item: req.params.itemId });
    
    // 3. Delete regular messages
    await Message.deleteMany({ item: req.params.itemId });
    
    // 4. Delete notifications
    await Notification.deleteMany({ item: req.params.itemId });

    // 5. Finally delete the item itself
    await Item.findByIdAndDelete(req.params.itemId);

    res.json({ message: 'Item and all related data deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
});


// Manual item matching (admin)
router.post('/items/:itemId/match/:matchItemId', auth, adminAuth, async (req, res) => {
  try {
    const { itemId, matchItemId } = req.params;
    
    const item = await Item.findById(itemId);
    const matchItem = await Item.findById(matchItemId);
    
    if (!item || !matchItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if items are compatible for matching
    if (item.type === matchItem.type) {
      return res.status(400).json({ message: 'Cannot match items of the same type' });
    }

    // Create match notification for both users
    const notifications = [
      {
        user: item.postedBy,
        type: 'match_found',
        title: 'Potential Match Found!',
        message: `A potential match has been found for your ${item.type} item: ${item.title}`,
        item: itemId,
        metadata: { matchItemId: matchItemId }
      },
      {
        user: matchItem.postedBy,
        type: 'match_found',
        title: 'Potential Match Found!',
        message: `A potential match has been found for your ${matchItem.type} item: ${matchItem.title}`,
        item: matchItemId,
        metadata: { matchItemId: itemId }
      }
    ];

    await Notification.insertMany(notifications);

    res.json({ message: 'Match created successfully', notifications });
  } catch (error) {
    console.error('Error creating manual match:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
