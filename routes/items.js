const express = require('express');
const { body, validationResult } = require('express-validator');
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const MatchingService = require('../services/matchingService');
const Notification = require('../models/Notification');

const router = express.Router();

// @route   POST /api/items/upload
// @desc    Upload images for items
// @access  Private
router.post('/upload', [
  auth,
  upload.array('images', 5),
  handleUploadError
], async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Files:', req.files ? req.files.length : 0);
    
    if (!req.files || req.files.length === 0) {
      console.log('No files uploaded');
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const uploadedImages = req.files.map(file => {
      console.log('Processing file:', file.filename, 'Path:', file.path);
      
      // Check if using Cloudinary or local storage
      if (file.path && file.path.startsWith('http')) {
        // Cloudinary
        console.log('Using Cloudinary URL:', file.path);
        return {
          url: file.path,
          publicId: file.filename
        };
      } else {
        // Local storage
        const localUrl = `http://localhost:5000/uploads/${file.filename}`;
        console.log('Using local URL:', localUrl);
        return {
          url: localUrl,
          publicId: file.filename
        };
      }
    });

    console.log('Upload successful, returning:', uploadedImages);
    res.json(uploadedImages);
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.message.includes('Invalid cloud_name')) {
      res.status(500).json({ message: 'Cloudinary configuration error. Please check your credentials.' });
    } else if (error.message.includes('Invalid API key')) {
      res.status(500).json({ message: 'Invalid Cloudinary API key. Please check your credentials.' });
    } else {
      res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
  }
});

// @route   GET /api/items
// @desc    Get all items with filtering and search
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      type, 
      status = 'active',
      search,
      location 
    } = req.query;

    const query = { status };
    
    if (category) query.category = category;
    if (type) query.type = type;
    if (location) query['location.foundLocation'] = new RegExp(location, 'i');
    if (search) {
      query.$text = { $search: search };
    }

    const items = await Item.find(query)
      .populate('postedBy', 'name')
      .populate('claimedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Item.countDocuments(query);

    // Remove contact information from all items
    const itemsWithoutContact = items.map(item => {
      const itemObj = item.toObject();
      delete itemObj.contactInfo;
      return itemObj;
    });

    res.json({
      items: itemsWithoutContact,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/items/stats
// @desc    Get statistics for dashboard
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalLost = await Item.countDocuments({ type: 'lost' });
    const totalFound = await Item.countDocuments({ type: 'found' });
    const activeCases = await Item.countDocuments({ status: 'active' });
    const successfulReturns = await Item.countDocuments({ status: 'resolved' });

    res.json({
      totalLost,
      totalFound,
      activeCases,
      successfulReturns
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/items/:id
// @desc    Get single item
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('postedBy', 'name')
      .populate('claimedBy', 'name');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Remove contact information from response
    const itemResponse = item.toObject();
    delete itemResponse.contactInfo;

    res.json(itemResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/items
// @desc    Create new item
// @access  Private
router.post('/', [
  auth,
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category').isIn(['electronics', 'clothing', 'accessories', 'documents', 'books', 'keys', 'other']).withMessage('Invalid category'),
  body('type').isIn(['lost', 'found']).withMessage('Type must be either lost or found'),
  body('foundLocation').trim().isLength({ min: 3 }).withMessage('Location must be at least 3 characters'),
  body('date').isISO8601().withMessage('Please provide a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      category,
      type,
      foundLocation,
      date,
      contactInfo,
      tags = [],
      images = []
    } = req.body;

    console.log('Received item data:', req.body);
    console.log('Images received:', images);

    // Images are already processed and sent as JSON data from frontend
    // No need to process req.files since images are uploaded separately

    const item = new Item({
      title,
      description,
      category,
      type,
      location: {
        foundLocation
      },
      date,
      images,
      contactInfo: contactInfo || {
        email: req.user.email,
        phone: req.user.phone,
        preferredContact: 'email'
      },
      postedBy: req.user._id,
      tags
    });

    await item.save();
    await item.populate('postedBy', 'name');

    // Run matching service for the new item
    setTimeout(async () => {
      try {
        await MatchingService.processMatches(item._id);
      } catch (error) {
        console.error('Error processing matches for new item:', error);
      }
    }, 1000); // Delay to ensure item is fully saved

    // Remove contact information from response
    const itemResponse = item.toObject();
    delete itemResponse.contactInfo;

    res.status(201).json(itemResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/items/:id
// @desc    Update item
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category').optional().isIn(['electronics', 'clothing', 'accessories', 'documents', 'books', 'keys', 'other']).withMessage('Invalid category'),
  body('foundLocation').optional().trim().isLength({ min: 3 }).withMessage('Location must be at least 3 characters'),
  body('status').optional().isIn(['active', 'claimed', 'resolved']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user is the owner
    if (item.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    const updateData = { ...req.body };
    
    // Handle location update
    if (updateData.foundLocation) {
      updateData['location.foundLocation'] = updateData.foundLocation;
      delete updateData.foundLocation;
    }

    // Handle status update
    if (updateData.status === 'resolved' && item.status !== 'resolved') {
      // When marking as resolved, clear claimedBy if it exists
      updateData.claimedBy = null;
    }

    // Handle tags update
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('postedBy', 'name').populate('claimedBy', 'name');

    // Remove contact information from response
    const itemResponse = updatedItem.toObject();
    delete itemResponse.contactInfo;

    res.json(itemResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/items/:id
// @desc    Delete item
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user is the owner
    if (item.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/items/:id/claim
// @desc    Claim an item
// @access  Private
router.put('/:id/claim', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.postedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot claim your own item' });
    }

    if (item.status !== 'active') {
      return res.status(400).json({ message: 'Item is no longer available' });
    }

    item.status = 'claimed';
    item.claimedBy = req.user._id;

    await item.save();
    await item.populate('claimedBy', 'name');

    // Remove contact information from response
    const itemResponse = item.toObject();
    delete itemResponse.contactInfo;

    res.json(itemResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/items/:id/matches
// @desc    Get matches for a specific item
// @access  Private
router.get('/:id/matches', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user is the owner of the item
    if (item.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view matches for this item' });
    }

    const matches = await MatchingService.findMatchesForItem(req.params.id);
    
    // Populate match details
    const populatedMatches = await Promise.all(
      matches.map(async (match) => {
        const matchedItem = await Item.findById(match.item)
          .populate('postedBy', 'name');
        
        // Remove contact information from matched item
        const itemResponse = matchedItem.toObject();
        delete itemResponse.contactInfo;
        
        return {
          ...match,
          item: itemResponse
        };
      })
    );

    res.json(populatedMatches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/items/:id/claim
// @desc    Claim an item
// @access  Private
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if item is available for claiming
    if (item.status !== 'active') {
      return res.status(400).json({ message: 'Item is not available for claiming' });
    }

    // Check if user is not the original poster
    if (item.postedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot claim your own item' });
    }

    // Update item status
    item.status = 'claimed';
    item.claimedBy = req.user._id;
    await item.save();

    // Create notification for the original poster
    const notification = new Notification({
      user: item.postedBy,
      type: 'item_claimed',
      title: 'Item Claimed!',
      message: `Your ${item.type} item "${item.title}" has been claimed by someone.`,
      item: item._id,
      sender: req.user._id
    });

    await notification.save();

    await item.populate('postedBy', 'name');
    await item.populate('claimedBy', 'name');

    // Remove contact information from response
    const itemResponse = item.toObject();
    delete itemResponse.contactInfo;

    res.json({ message: 'Item claimed successfully', item: itemResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/items/:id/resolve
// @desc    Mark item as resolved
// @access  Private
router.post('/:id/resolve', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user is the original poster or admin
    if (item.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to resolve this item' });
    }

    // Update item status
    item.status = 'resolved';
    item.resolutionDate = new Date();
    item.resolutionNotes = req.body.notes || '';
    await item.save();

    // Create notification for the claimant (if exists)
    if (item.claimedBy) {
      const notification = new Notification({
        user: item.claimedBy,
        type: 'item_resolved',
        title: 'Item Resolved!',
        message: `The ${item.type} item "${item.title}" has been successfully resolved.`,
        item: item._id,
        sender: req.user._id
      });

      await notification.save();
    }

    await item.populate('postedBy', 'name');
    await item.populate('claimedBy', 'name');

    // Remove contact information from response
    const itemResponse = item.toObject();
    delete itemResponse.contactInfo;

    res.json({ message: 'Item resolved successfully', item: itemResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/items/user/suggestions
// @desc    Get match suggestions for user's items
// @access  Private
router.get('/user/suggestions', auth, async (req, res) => {
  try {
    const suggestions = await MatchingService.getUserMatchSuggestions(req.user._id);
    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/items/match
// @desc    Manually create a match between two items
// @access  Private
router.post('/match', [
  auth,
  body('itemId1').isMongoId().withMessage('Valid item ID 1 required'),
  body('itemId2').isMongoId().withMessage('Valid item ID 2 required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId1, itemId2 } = req.body;
    const result = await MatchingService.processManualMatch(itemId1, itemId2, req.user._id);
    
    if (result.success) {
      res.json({ 
        message: 'Match created successfully', 
        score: result.score 
      });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Error creating manual match:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/items/:id/matches
// @desc    Get matches for a specific item
// @access  Private
router.get('/:id/matches', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('matchedItems.item', 'title description type category location date images postedBy')
      .populate('postedBy', 'name');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user owns this item or is admin
    if (item.postedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const matches = item.matchedItems.map(match => ({
      _id: match.item._id,
      title: match.item.title,
      description: match.item.description,
      type: match.item.type,
      category: match.item.category,
      location: match.item.location,
      date: match.item.date,
      images: match.item.images,
      postedBy: match.item.postedBy,
      matchScore: match.score,
      matchedAt: match.matchedAt
    }));

    res.json(matches);
  } catch (error) {
    console.error('Error getting item matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
