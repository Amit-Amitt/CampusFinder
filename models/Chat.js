const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // Unique conversation ID
  conversationId: {
    type: String,
    required: true,
    unique: true
  },
  
  // The item being discussed
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  
  // Participants in the chat (item owner and finder)
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    profilePicture: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: ['owner', 'finder'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Chat status
  status: {
    type: String,
    enum: ['active', 'resolved', 'closed', 'archived'],
    default: 'active'
  },
  
  // Last activity timestamp
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  // Resolution details
  resolution: {
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolutionNotes: String,
    itemReturned: {
      type: Boolean,
      default: false
    }
  },
  
  // Chat metadata
  metadata: {
    totalMessages: {
      type: Number,
      default: 0
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatSchema.index({ conversationId: 1 });
chatSchema.index({ item: 1 });
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ status: 1, lastActivity: -1 });

module.exports = mongoose.model('Chat', chatSchema);
