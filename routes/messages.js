const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Item = require('../models/Item');
const Notification = require('../models/Notification');

// Get messages for a specific item
router.get('/item/:itemId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ item: req.params.itemId })
      .populate('sender', 'name email avatar')
      .populate('receiver', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { itemId, receiverId, message, messageType = 'text' } = req.body;

    // Verify the item exists and user has permission to message
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user is the poster or potential claimant
    const isPoster = item.postedBy.toString() === req.user._id.toString();
    const isClaimant = receiverId === item.postedBy.toString();

    if (!isPoster && !isClaimant) {
      return res.status(403).json({ message: 'Not authorized to send message for this item' });
    }

    const newMessage = new Message({
      item: itemId,
      sender: req.user._id,
      receiver: receiverId,
      message,
      messageType
    });

    await newMessage.save();

    // Populate the message with user details
    await newMessage.populate('sender', 'name email avatar');
    await newMessage.populate('receiver', 'name email avatar');

    // Try to create notification for receiver (non-critical)
    try {
      const notification = new Notification({
        user: receiverId,
        type: 'message_received',
        title: 'New Message Received',
        message: `You have a new message regarding ${item.title}`,
        item: itemId,
        sender: req.user._id
      });

      await notification.save();
    } catch (notificationError) {
      console.warn('Failed to create notification:', notificationError);
      // Continue execution - this is not critical
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Mark message as read
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to mark this message as read' });
    }

    message.isRead = true;
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating message', error: error.message });
  }
});

// Get user's conversation list
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$item',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiver', req.user._id] },
                  { $eq: ['$isRead', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: '_id',
          as: 'item'
        }
      },
      {
        $unwind: '$item'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.receiver',
          foreignField: '_id',
          as: 'receiver'
        }
      },
      {
        $unwind: '$sender'
      },
      {
        $unwind: '$receiver'
      }
    ]);

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
});

module.exports = router;
