const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

// Generate unique conversation ID
const generateConversationId = () => {
  return `chat_${uuidv4()}`;
};

// Generate unique message ID
const generateMessageId = () => {
  return `msg_${uuidv4()}`;
};

// POST /chat/start - Start a new conversation
router.post('/start', auth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user._id;
    
    if (!itemId) {
      return res.status(400).json({ message: 'Item ID is required' });
    }

    // Get the item
    const item = await Item.findById(itemId).populate('postedBy', 'name email');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user is the owner of the item
    if (item.postedBy._id.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    // Check if conversation already exists
    const existingChat = await Chat.findOne({
      item: itemId,
      'participants.userId': userId,
      status: { $in: ['active', 'resolved'] }
    });

    if (existingChat) {
      return res.json({
        conversationId: existingChat.conversationId,
        message: 'Conversation already exists'
      });
    }

    // Create new conversation
    const conversationId = generateConversationId();
    const currentUser = await User.findById(userId);
    const itemOwner = await User.findById(item.postedBy._id);

    const chat = new Chat({
      conversationId: conversationId,
      item: itemId,
      participants: [
        {
          userId: itemOwner._id,
          username: itemOwner.name,
          profilePicture: itemOwner.profilePicture || null,
          role: 'owner'
        },
        {
          userId: currentUser._id,
          username: currentUser.name,
          profilePicture: currentUser.profilePicture || null,
          role: 'finder'
        }
      ],
      status: 'active',
      lastActivity: new Date()
    });

    await chat.save();

    // Send welcome message
    const welcomeMessage = new ChatMessage({
      messageId: generateMessageId(),
      conversationId: conversationId,
      senderId: itemOwner._id,
      senderUsername: itemOwner.name,
      text: `Hello! I found your ${item.type} item "${item.title}". Let's discuss the details.`,
      type: 'system'
    });

    await welcomeMessage.save();

    // Update chat metadata
    await Chat.findByIdAndUpdate(chat._id, {
      $inc: { 'metadata.totalMessages': 1 },
      lastActivity: new Date()
    });

    // Send notifications to both users
    await Notification.create({
      user: itemOwner._id,
      type: 'chat_started',
      title: 'New Chat Started',
      message: `${currentUser.name} started a chat about your ${item.type} item "${item.title}"`,
      item: itemId,
      sender: currentUser._id,
      metadata: {
        conversationId: conversationId,
        itemId: itemId
      }
    });

    await Notification.create({
      user: currentUser._id,
      type: 'chat_started',
      title: 'Chat Started',
      message: `You started a chat about "${item.title}"`,
      item: itemId,
      sender: itemOwner._id,
      metadata: {
        conversationId: conversationId,
        itemId: itemId
      }
    });

    res.json({
      conversationId: conversationId,
      message: 'Chat started successfully',
      participants: chat.participants.map(p => ({
        userId: p.userId,
        username: p.username,
        profilePicture: p.profilePicture,
        role: p.role
      }))
    });

  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /chat/send - Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const userId = req.user._id;

    if (!conversationId || !text) {
      return res.status(400).json({ message: 'Conversation ID and text are required' });
    }

    // Verify user is participant in this conversation
    const chat = await Chat.findOne({
      conversationId: conversationId,
      'participants.userId': userId,
      status: 'active'
    });

    if (!chat) {
      return res.status(404).json({ message: 'Conversation not found or access denied' });
    }

    // Get user info
    const user = await User.findById(userId);

    // Create message
    const message = new ChatMessage({
      messageId: generateMessageId(),
      conversationId: conversationId,
      senderId: userId,
      senderUsername: user.name,
      text: text.trim(),
      type: 'text',
      status: 'sent'
    });

    await message.save();

    // Prepare response data
    const responseData = {
      messageId: message.messageId,
      conversationId: conversationId,
      senderId: userId,
      senderUsername: user.name,
      text: message.text,
      timestamp: message.createdAt,
      status: message.status
    };

    // Try to update chat metadata (non-critical)
    try {
      await Chat.findByIdAndUpdate(chat._id, {
        $inc: { 'metadata.totalMessages': 1 },
        lastActivity: new Date()
      });
    } catch (metadataError) {
      console.warn('Failed to update chat metadata:', metadataError);
      // Continue execution - this is not critical
    }

    // Try to send notification to other participant (non-critical)
    try {
      const otherParticipant = chat.participants.find(p => p.userId.toString() !== userId.toString());
      if (otherParticipant) {
        await Notification.create({
          user: otherParticipant.userId,
          type: 'message_received',
          title: 'New Message',
          message: `${user.name}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
          metadata: {
            conversationId: conversationId,
            messageId: message.messageId
          }
        });
      }
    } catch (notificationError) {
      console.warn('Failed to create notification:', notificationError);
      // Continue execution - this is not critical
    }

    // Always return success if message was saved
    res.json(responseData);

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /chat/:conversationId - Fetch chat history
router.get('/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    console.log('Fetching chat for conversationId:', conversationId, 'userId:', userId);

    // Verify user is participant in this conversation
    const chat = await Chat.findOne({
      conversationId: conversationId,
      'participants.userId': userId
    }).populate('item', 'title type category');

    console.log('Chat found:', !!chat);

    if (!chat) {
      console.log('Chat not found or access denied');
      return res.status(404).json({ message: 'Conversation not found or access denied' });
    }

    // Get messages
    const messages = await ChatMessage.find({
      conversationId: conversationId,
      'metadata.isDeleted': { $ne: true }
    }).sort({ createdAt: 1 });

    console.log('Messages found:', messages.length);

    // Mark messages as read
    await ChatMessage.updateMany(
      {
        conversationId: conversationId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId: userId,
            readAt: new Date()
          }
        },
        $set: { status: 'read' }
      }
    );

    // Update user's last seen
    await Chat.findByIdAndUpdate(chat._id, {
      $set: {
        'participants.$[participant].lastSeen': new Date()
      }
    }, {
      arrayFilters: [{ 'participant.userId': userId }]
    });

    // Reset unread count
    await Chat.findByIdAndUpdate(chat._id, {
      $set: { 'metadata.unreadCount': 0 }
    });

    const response = {
      conversationId: conversationId,
      item: chat.item,
      participants: chat.participants.map(p => ({
        userId: p.userId,
        username: p.username,
        profilePicture: p.profilePicture,
        role: p.role,
        lastSeen: p.lastSeen
      })),
      status: chat.status,
      messages: messages.map(msg => ({
        messageId: msg.messageId,
        senderId: msg.senderId,
        senderUsername: msg.senderUsername,
        text: msg.text,
        type: msg.type,
        status: msg.status,
        timestamp: msg.createdAt,
        readBy: msg.readBy
      })),
      lastActivity: chat.lastActivity
    };

    console.log('Sending response:', response);
    res.json(response);

  } catch (error) {
    console.error('Error fetching chat history:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /chat - Get user's conversations
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Chat.find({
      'participants.userId': userId,
      status: { $in: ['active', 'resolved'] }
    })
    .populate('item', 'title type category images')
    .sort({ lastActivity: -1 });

    const conversationList = conversations.map(chat => {
      const userParticipant = chat.participants.find(p => p.userId.toString() === userId);
      const otherParticipant = chat.participants.find(p => p.userId.toString() !== userId);

      return {
        conversationId: chat.conversationId,
        item: chat.item,
        otherParticipant: {
          userId: otherParticipant.userId,
          username: otherParticipant.username,
          profilePicture: otherParticipant.profilePicture,
          role: otherParticipant.role
        },
        status: chat.status,
        lastActivity: chat.lastActivity,
        unreadCount: chat.metadata.unreadCount,
        totalMessages: chat.metadata.totalMessages
      };
    });

    res.json(conversationList);

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /chat/:conversationId/resolve - Mark conversation as resolved
router.put('/:conversationId/resolve', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { resolutionNotes, itemReturned } = req.body;
    const userId = req.user._id;

    // Verify user is participant in this conversation
    const chat = await Chat.findOne({
      conversationId: conversationId,
      'participants.userId': userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Conversation not found or access denied' });
    }

    // Update chat status
    await Chat.findByIdAndUpdate(chat._id, {
      $set: {
        status: 'resolved',
        'resolution.resolvedAt': new Date(),
        'resolution.resolvedBy': userId,
        'resolution.resolutionNotes': resolutionNotes || '',
        'resolution.itemReturned': itemReturned || false,
        lastActivity: new Date()
      }
    });

    // Send system message
    const user = await User.findById(userId);
    const resolveMessage = new ChatMessage({
      messageId: generateMessageId(),
      conversationId: conversationId,
      senderId: userId,
      senderUsername: user.name,
      text: `✅ ${user.name} marked this conversation as resolved. ${itemReturned ? 'Item has been returned.' : 'Item return pending.'}`,
      type: 'system'
    });

    await resolveMessage.save();

    // Notify other participant
    const otherParticipant = chat.participants.find(p => p.userId.toString() !== userId.toString());
    if (otherParticipant) {
      await Notification.create({
        user: otherParticipant.userId,
        type: 'item_resolved',
        title: 'Chat Resolved',
        message: `${user.name} marked the conversation as resolved`,
        item: chat.item,
        sender: userId,
        metadata: {
          conversationId: conversationId
        }
      });
    }

    res.json({ message: 'Conversation marked as resolved' });

  } catch (error) {
    console.error('Error resolving conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /chat/:conversationId/close - Close conversation
router.put('/:conversationId/close', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify user is participant in this conversation
    const chat = await Chat.findOne({
      conversationId: conversationId,
      'participants.userId': userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Conversation not found or access denied' });
    }

    // Update chat status
    await Chat.findByIdAndUpdate(chat._id, {
      $set: {
        status: 'closed',
        lastActivity: new Date()
      }
    });

    // Send system message
    const user = await User.findById(userId);
    const closeMessage = new ChatMessage({
      messageId: generateMessageId(),
      conversationId: conversationId,
      senderId: userId,
      senderUsername: user.name,
      text: `🔒 ${user.name} closed this conversation.`,
      type: 'system'
    });

    await closeMessage.save();

    res.json({ message: 'Conversation closed' });

  } catch (error) {
    console.error('Error closing conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /chat/:conversationId/read - Mark messages as read
router.put('/:conversationId/read', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify user is participant in this conversation
    const chat = await Chat.findOne({
      conversationId: conversationId,
      'participants.userId': userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Conversation not found or access denied' });
    }

    // Mark all unread messages as read
    await ChatMessage.updateMany(
      {
        conversationId: conversationId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId: userId,
            readAt: new Date()
          }
        },
        $set: { status: 'read' }
      }
    );

    // Reset unread count
    await Chat.findByIdAndUpdate(chat._id, {
      $set: { 'metadata.unreadCount': 0 }
    });

    res.json({ message: 'Messages marked as read' });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;