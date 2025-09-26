const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  // Unique message ID
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  
  // The conversation this message belongs to
  conversationId: {
    type: String,
    required: true
  },
  
  // The sender (user ID)
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Sender's username (for display)
  senderUsername: {
    type: String,
    required: true
  },
  
  // Message content
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Message type
  type: {
    type: String,
    enum: ['text', 'system', 'image', 'file'],
    default: 'text'
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
  // Read receipts
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message metadata
  metadata: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatMessage'
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
chatMessageSchema.index({ senderId: 1 });
chatMessageSchema.index({ messageId: 1 });
chatMessageSchema.index({ 'readBy.userId': 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
