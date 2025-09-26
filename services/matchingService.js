const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');

class MatchingService {
  constructor() {
    this.matchThreshold = 0.7; // Minimum similarity score for a match
    this.locationWeight = 0.3;
    this.dateWeight = 0.2;
    this.categoryWeight = 0.3;
    this.keywordWeight = 0.2;
  }

  // Main function to process matches for a new item
  async processMatches(newItemId) {
    try {
      console.log(`Processing matches for item: ${newItemId}`);
      
      const newItem = await Item.findById(newItemId).populate('postedBy', 'name email');
      if (!newItem) {
        console.log('Item not found');
        return;
      }

      // Find potential matches in opposite category
      const potentialMatches = await this.findPotentialMatches(newItem);
      
      if (potentialMatches.length === 0) {
        console.log('No potential matches found');
        return;
      }

      // Calculate similarity scores and filter strong matches
      const strongMatches = await this.calculateMatchScores(newItem, potentialMatches);
      
      if (strongMatches.length === 0) {
        console.log('No strong matches found');
        return;
      }

      // Process each strong match
      for (const match of strongMatches) {
        await this.processMatch(newItem, match.item, match.score);
      }

      console.log(`Processed ${strongMatches.length} matches for item: ${newItemId}`);
      
    } catch (error) {
      console.error('Error processing matches:', error);
    }
  }

  // Find potential matches based on basic criteria
  async findPotentialMatches(newItem) {
    const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';
    
    // Date range: within 7 days
    const dateRange = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const itemDate = new Date(newItem.date);
    const startDate = new Date(itemDate.getTime() - dateRange);
    const endDate = new Date(itemDate.getTime() + dateRange);

    const query = {
      type: oppositeType,
      status: 'active',
      _id: { $ne: newItem._id }, // Exclude the same item
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Add category filter if available
    if (newItem.category && newItem.category !== 'other') {
      query.category = newItem.category;
    }

    const potentialMatches = await Item.find(query)
      .populate('postedBy', 'name email')
      .limit(50); // Limit to prevent too many comparisons

    return potentialMatches;
  }

  // Calculate similarity scores between items
  async calculateMatchScores(newItem, potentialMatches) {
    const matches = [];

    for (const potentialMatch of potentialMatches) {
      const score = await this.calculateSimilarity(newItem, potentialMatch);
      
      if (score >= this.matchThreshold) {
        matches.push({
          item: potentialMatch,
          score: score
        });
      }
    }

    // Sort by score (highest first) and limit to top 5 matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  // Calculate similarity score between two items
  async calculateSimilarity(item1, item2) {
    let totalScore = 0;
    let weightSum = 0;

    // Category match (exact match gets full points)
    if (item1.category === item2.category) {
      totalScore += this.categoryWeight;
    }
    weightSum += this.categoryWeight;

    // Location similarity
    const locationScore = this.calculateLocationSimilarity(item1.location, item2.location);
    totalScore += locationScore * this.locationWeight;
    weightSum += this.locationWeight;

    // Date proximity
    const dateScore = this.calculateDateSimilarity(item1.date, item2.date);
    totalScore += dateScore * this.dateWeight;
    weightSum += this.dateWeight;

    // Keyword similarity
    const keywordScore = this.calculateKeywordSimilarity(item1, item2);
    totalScore += keywordScore * this.keywordWeight;
    weightSum += this.keywordWeight;

    return weightSum > 0 ? totalScore / weightSum : 0;
  }

  // Calculate location similarity
  calculateLocationSimilarity(location1, location2) {
    if (!location1 || !location2) return 0;

    // Extract foundLocation from location objects
    const loc1 = (location1.foundLocation || location1).toLowerCase().trim();
    const loc2 = (location2.foundLocation || location2).toLowerCase().trim();

    // Exact match
    if (loc1 === loc2) return 1.0;

    // Check for common campus locations
    const campusLocations = [
      'library', 'cafeteria', 'canteen', 'lab', 'laboratory', 'classroom', 
      'auditorium', 'gym', 'parking', 'gate', 'entrance', 'office', 'admin'
    ];

    const loc1Words = loc1.split(/\s+/);
    const loc2Words = loc2.split(/\s+/);

    // Check for common words
    let commonWords = 0;
    for (const word1 of loc1Words) {
      for (const word2 of loc2Words) {
        if (word1 === word2 && campusLocations.includes(word1)) {
          commonWords++;
        }
      }
    }

    if (commonWords > 0) {
      return Math.min(0.8, commonWords * 0.3);
    }

    // Check for substring matches
    if (loc1.includes(loc2) || loc2.includes(loc1)) {
      return 0.6;
    }

    return 0;
  }

  // Calculate date similarity
  calculateDateSimilarity(date1, date2) {
    const timeDiff = Math.abs(new Date(date1) - new Date(date2));
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    if (daysDiff <= 1) return 1.0;      // Same day
    if (daysDiff <= 3) return 0.8;      // Within 3 days
    if (daysDiff <= 7) return 0.6;      // Within 7 days
    if (daysDiff <= 14) return 0.4;     // Within 2 weeks
    return 0.2;                         // More than 2 weeks
  }

  // Calculate keyword similarity
  calculateKeywordSimilarity(item1, item2) {
    const text1 = `${item1.title} ${item1.description}`.toLowerCase();
    const text2 = `${item2.title} ${item2.description}`.toLowerCase();

    // Extract keywords (remove common words)
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words1 = text1.split(/\s+/).filter(word => word.length > 2 && !commonWords.includes(word));
    const words2 = text2.split(/\s+/).filter(word => word.length > 2 && !commonWords.includes(word));

    if (words1.length === 0 || words2.length === 0) return 0;

    // Calculate Jaccard similarity
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  // Process a single match
  async processMatch(newItem, matchedItem, score) {
    try {
      // Check if match already exists
      const existingMatch = await this.checkExistingMatch(newItem._id, matchedItem._id);
      if (existingMatch) {
        console.log('Match already exists, skipping');
        return;
      }

      // Update items with match information
      await this.updateItemMatches(newItem._id, matchedItem._id, score);
      await this.updateItemMatches(matchedItem._id, newItem._id, score);

      // Send notifications to both users
      await this.sendMatchNotifications(newItem, matchedItem, score);

      // Create a chat between the users
      await this.createMatchChat(newItem, matchedItem);

      console.log(`Processed match between ${newItem._id} and ${matchedItem._id} with score ${score}`);

    } catch (error) {
      console.error('Error processing match:', error);
    }
  }

  // Check if match already exists
  async checkExistingMatch(itemId1, itemId2) {
    const item1 = await Item.findById(itemId1);
    if (!item1 || !item1.matchedItems) return false;

    return item1.matchedItems.some(match => 
      match.item.toString() === itemId2.toString()
    );
  }

  // Update item with match information
  async updateItemMatches(itemId, matchedItemId, score) {
    await Item.findByIdAndUpdate(itemId, {
      $push: {
        matchedItems: {
          item: matchedItemId,
          score: score,
          matchedAt: new Date()
        }
      },
      $set: {
        matchScore: score
      }
    });
  }

  // Send notifications to both users
  async sendMatchNotifications(item1, item2, score) {
    const matchPercentage = Math.round(score * 100);
    
    // Notification for item1 owner
    await Notification.create({
      user: item1.postedBy._id,
      type: 'match_found',
      title: 'Potential Match Found!',
      message: `We found a ${matchPercentage}% match for your ${item1.type} item "${item1.title}". Check your dashboard for details.`,
      item: item1._id,
      sender: item2.postedBy._id,
      metadata: {
        matchedItemId: item2._id,
        originalItemId: item1._id,
        matchScore: score,
        matchType: 'auto'
      }
    });

    // Notification for item2 owner
    await Notification.create({
      user: item2.postedBy._id,
      type: 'match_found',
      title: 'Potential Match Found!',
      message: `We found a ${matchPercentage}% match for your ${item2.type} item "${item2.title}". Check your dashboard for details.`,
      item: item2._id,
      sender: item1.postedBy._id,
      metadata: {
        matchedItemId: item1._id,
        originalItemId: item2._id,
        matchScore: score,
        matchType: 'auto'
      }
    });
  }

  // Create a chat between matched users
  async createMatchChat(item1, item2) {
    try {
      // Check if chat already exists
      const existingChat = await Chat.findOne({
        item: { $in: [item1._id, item2._id] },
        status: 'active',
        'participants.userId': { $in: [item1.postedBy._id, item2.postedBy._id] }
      });

      if (existingChat) {
        console.log('Chat already exists for this match');
        return;
      }

      // Generate display names
      const displayName1 = this.generateDisplayName(item1.postedBy.name, 'owner');
      const displayName2 = this.generateDisplayName(item2.postedBy.name, item2.type === 'lost' ? 'finder' : 'claimer');

      // Create new chat
      const chat = new Chat({
        conversationId: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        item: item1._id, // Use the lost item as primary
        participants: [
          {
            userId: item1.postedBy._id,
            username: item1.postedBy.name,
            role: 'owner'
          },
          {
            userId: item2.postedBy._id,
            username: item2.postedBy.name,
            role: item2.type === 'lost' ? 'finder' : 'claimer'
          }
        ],
        status: 'active'
      });

      await chat.save();

      // Send welcome message
      const welcomeMessage = new (require('../models/ChatMessage'))({
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId: chat.conversationId,
        senderId: item1.postedBy._id,
        senderUsername: item1.postedBy.name,
        text: `Hello! Our system found a potential match between your items. Let's verify the details to see if this is your lost/found item.`,
        type: 'system'
      });
      await welcomeMessage.save();

      console.log(`Created chat ${chat._id} for match between ${item1._id} and ${item2._id}`);

    } catch (error) {
      console.error('Error creating match chat:', error);
    }
  }

  // Generate anonymous display name
  generateDisplayName(userName, role) {
    const adjectives = ['Swift', 'Bright', 'Kind', 'Smart', 'Brave', 'Wise', 'Gentle', 'Strong'];
    const nouns = ['Helper', 'Finder', 'Owner', 'Student', 'Member', 'Friend', 'Guardian', 'Hero'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective}${noun}${role.charAt(0).toUpperCase()}`;
  }

  // Get match suggestions for a user
  async getUserMatchSuggestions(userId) {
    try {
      const userItems = await Item.find({
        postedBy: userId,
        status: 'active',
        matchedItems: { $exists: true, $not: { $size: 0 } }
      }).populate('matchedItems.item', 'title description type category location date images postedBy');

      const suggestions = [];

      for (const item of userItems) {
        for (const match of item.matchedItems) {
          if (match.item) {
            suggestions.push({
              originalItem: {
                _id: item._id,
                title: item.title,
                type: item.type,
                category: item.category
              },
              matchedItem: {
                _id: match.item._id,
                title: match.item.title,
                type: match.item.type,
                category: match.item.category,
                location: match.item.location,
                date: match.item.date,
                images: match.item.images,
                postedBy: match.item.postedBy
              },
              matchScore: match.score,
              matchedAt: match.matchedAt
            });
          }
        }
      }

      // Sort by match score and date
      return suggestions.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return new Date(b.matchedAt) - new Date(a.matchedAt);
      });

    } catch (error) {
      console.error('Error getting user match suggestions:', error);
      return [];
    }
  }

  // Manual match processing (for admin or user-triggered)
  async processManualMatch(itemId1, itemId2, userId) {
    try {
      const item1 = await Item.findById(itemId1).populate('postedBy', 'name email');
      const item2 = await Item.findById(itemId2).populate('postedBy', 'name email');

      if (!item1 || !item2) {
        throw new Error('One or both items not found');
      }

      // Calculate similarity score
      const score = await this.calculateSimilarity(item1, item2);

      // Process the match
      await this.processMatch(item1, item2, score);

      return { success: true, score };

    } catch (error) {
      console.error('Error processing manual match:', error);
      return { success: false, error: error.message };
    }
  }

  // Global matching service for cron jobs
  async runGlobalMatching() {
    try {
      console.log('Running global matching service...');
      
      // Get all active items
      const activeItems = await Item.find({ status: 'active' })
        .populate('postedBy', 'name email')
        .limit(100); // Limit to prevent overload

      let processedCount = 0;
      
      for (const item of activeItems) {
        try {
          await this.processMatches(item._id);
          processedCount++;
        } catch (error) {
          console.error(`Error processing matches for item ${item._id}:`, error);
        }
      }

      console.log(`Global matching completed. Processed ${processedCount} items.`);
      
    } catch (error) {
      console.error('Error in global matching:', error);
    }
  }
}

module.exports = new MatchingService();