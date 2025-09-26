const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'clothing', 'accessories', 'documents', 'books', 'keys', 'wallet', 'id_card', 'phone', 'laptop', 'bag', 'jewelry', 'other']
  },
  type: {
    type: String,
    required: true,
    enum: ['lost', 'found']
  },
  location: {
    foundLocation: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  date: {
    type: Date,
    required: true
  },
  images: [{
    url: String,
    publicId: String
  }],
  status: {
    type: String,
    enum: ['active', 'claimed', 'resolved', 'pending_approval'],
    default: 'active'
  },
  contactInfo: {
    email: String,
    phone: String,
    preferredContact: {
      type: String,
      enum: ['email', 'phone'],
      default: 'email'
    }
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  verificationDetails: {
    uniqueIdentifiers: [String], // For items like ID cards, wallets with specific marks
    verificationQuestions: [String], // Questions to verify ownership
    verificationAnswers: [String] // Answers provided by the owner
  },
  matchScore: {
    type: Number,
    default: 0
  },
  matchedItems: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    },
    score: Number,
    matchedAt: Date
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  adminNotes: {
    type: String,
    trim: true
  },
  resolutionDate: {
    type: Date
  },
  resolutionNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for search functionality
itemSchema.index({ title: 'text', description: 'text', tags: 'text' });
itemSchema.index({ category: 1, type: 1, status: 1 });
itemSchema.index({ 'location.foundLocation': 'text' });

module.exports = mongoose.model('Item', itemSchema);
