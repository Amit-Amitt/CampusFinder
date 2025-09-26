const MatchingService = require('./matchingService');
const Item = require('../models/Item');

class CronService {
  // Run matching for all active items every hour
  static async runHourlyMatching() {
    try {
      console.log('Running hourly matching service...');
      await MatchingService.runGlobalMatching();
      console.log('Hourly matching completed successfully');
    } catch (error) {
      console.error('Error in hourly matching:', error);
    }
  }

  // Clean up old resolved items (older than 1 year)
  static async cleanupOldItems() {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const oldItems = await Item.find({
        status: 'resolved',
        resolutionDate: { $lt: oneYearAgo }
      });

      if (oldItems.length > 0) {
        // Archive old items instead of deleting
        await Item.updateMany(
          { 
            status: 'resolved',
            resolutionDate: { $lt: oneYearAgo }
          },
          { 
            $set: { 
              isPublic: false,
              adminNotes: 'Archived due to age'
            }
          }
        );

        console.log(`Archived ${oldItems.length} old resolved items`);
      }
    } catch (error) {
      console.error('Error cleaning up old items:', error);
    }
  }

  // Update item statistics
  static async updateItemStats() {
    try {
      const stats = await Item.aggregate([
        {
          $group: {
            _id: null,
            totalLost: { $sum: { $cond: [{ $eq: ['$type', 'lost'] }, 1, 0] } },
            totalFound: { $sum: { $cond: [{ $eq: ['$type', 'found'] }, 1, 0] } },
            totalResolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            totalActive: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
          }
        }
      ]);

      console.log('Updated item statistics:', stats[0]);
    } catch (error) {
      console.error('Error updating item stats:', error);
    }
  }

  // Send weekly summary emails (placeholder for future email service)
  static async sendWeeklySummary() {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const weeklyStats = await Item.aggregate([
        {
          $match: {
            createdAt: { $gte: oneWeekAgo }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);

      console.log('Weekly summary:', weeklyStats);
      // TODO: Implement email sending service
    } catch (error) {
      console.error('Error sending weekly summary:', error);
    }
  }

  // Initialize cron jobs
  static initializeCronJobs() {
    // Run matching every hour
    setInterval(() => {
      this.runHourlyMatching();
    }, 60 * 60 * 1000); // 1 hour

    // Cleanup old items daily
    setInterval(() => {
      this.cleanupOldItems();
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Update stats every 6 hours
    setInterval(() => {
      this.updateItemStats();
    }, 6 * 60 * 60 * 1000); // 6 hours

    // Send weekly summary every Sunday
    setInterval(() => {
      const now = new Date();
      if (now.getDay() === 0) { // Sunday
        this.sendWeeklySummary();
      }
    }, 24 * 60 * 60 * 1000); // Check daily

    console.log('Cron jobs initialized successfully');
  }
}

module.exports = CronService;
