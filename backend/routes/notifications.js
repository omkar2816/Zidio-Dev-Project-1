import express from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { protect, requireAdmin, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications with filtering and pagination
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category,
      priority,
      isRead,
      type,
      targetRoles
    } = req.query;

    // Build filter object based on user role
    let filter;
    
    if (req.user.role === 'superadmin') {
      // Superadmins see all notifications targeted to them or global notifications
      filter = {
        $or: [
          { userId: req.user._id },
          { targetRoles: 'superadmin' },
          { targetRoles: { $in: ['admin', 'superadmin'] } }
        ]
      };
    } else if (req.user.role === 'admin') {
      // Admins see admin and some superadmin notifications
      filter = {
        $or: [
          { userId: req.user._id, isPersonal: true },
          { targetRoles: 'admin' },
          { targetRoles: { $in: ['admin', 'superadmin'] } }
        ]
      };
    } else {
      // Users see only their personal notifications
      filter = { 
        userId: req.user._id,
        $or: [
          { isPersonal: true },
          { targetRoles: 'user' }
        ]
      };
    }
    
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    
    // Handle targetRoles filtering for tab-specific notifications
    if (targetRoles) {
      const rolesArray = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
      filter.targetRoles = { $in: rolesArray };
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false
    });

    const totalCount = await Notification.countDocuments(filter);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        totalCount,
        hasMore: notifications.length === parseInt(limit),
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// Delete notification
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

// Get notification statistics (superadmin only)
router.get('/stats', protect, requireSuperAdmin, async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const priorityStats = await Notification.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Notification.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        typeStats: stats,
        priorityStats,
        categoryStats
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics'
    });
  }
});

// Bulk operations (superadmin only)
router.post('/bulk', protect, requireSuperAdmin, async (req, res) => {
  try {
    const { action, notificationIds, filters } = req.body;

    let query = {};
    if (notificationIds && notificationIds.length > 0) {
      query._id = { $in: notificationIds };
    } else if (filters) {
      // Apply filters for bulk operations
      if (filters.category) query.category = filters.category;
      if (filters.priority) query.priority = filters.priority;
      if (filters.type) query.type = filters.type;
      if (filters.isRead !== undefined) query.isRead = filters.isRead;
    }

    let result;
    switch (action) {
      case 'markAsRead':
        result = await Notification.updateMany(query, {
          isRead: true,
          readAt: new Date()
        });
        break;
      case 'delete':
        result = await Notification.deleteMany(query);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid bulk action'
        });
    }

    res.json({
      success: true,
      message: `Bulk ${action} completed`,
      data: { modifiedCount: result.modifiedCount || result.deletedCount }
    });
  } catch (error) {
    console.error('Bulk notification operation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk operation'
    });
  }
});

// Send notification to specific users (admin/superadmin only)
router.post('/send', protect, requireAdmin, async (req, res) => {
  try {
    const {
      recipients, // array of user IDs or 'all' or role name
      type,
      title,
      message,
      actionUrl,
      priority = 'medium',
      category = 'system'
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }

    let targetUsers = [];

    if (recipients === 'all') {
      // Send to all active users
      targetUsers = await User.find({ isActive: true }).select('_id');
    } else if (Array.isArray(recipients)) {
      // Send to specific user IDs
      targetUsers = await User.find({ 
        _id: { $in: recipients }, 
        isActive: true 
      }).select('_id');
    } else if (typeof recipients === 'string' && ['user', 'admin', 'superadmin'].includes(recipients)) {
      // Send to all users of a specific role
      targetUsers = await User.find({ 
        role: recipients, 
        isActive: true 
      }).select('_id');
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipients format'
      });
    }

    if (targetUsers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No valid recipients found'
      });
    }

    const notifications = targetUsers.map(user => ({
      userId: user._id,
      type: type || 'system_update',
      title,
      message,
      navigationUrl: actionUrl,
      priority,
      category,
      targetRoles: [user.role],
      data: {
        sentBy: req.user._id,
        sentByName: `${req.user.firstName} ${req.user.lastName}`,
        sentAt: new Date()
      }
    }));

    await Notification.insertMany(notifications);

    res.json({
      success: true,
      message: `Notification sent to ${notifications.length} users`,
      data: {
        recipientCount: notifications.length,
        notificationType: type
      }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
});

// Get notification preferences (for future use)
router.get('/preferences', protect, async (req, res) => {
  try {
    // This could be extended to include user notification preferences
    const preferences = {
      emailNotifications: true,
      pushNotifications: true,
      categories: {
        admin: req.user.role === 'admin' || req.user.role === 'superadmin',
        system: true,
        security: true,
        analytics: true,
        user: true
      }
    };

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preferences'
    });
  }
});

// Clean up old read notifications
router.delete('/cleanup/read', protect, async (req, res) => {
  try {
    // Delete read notifications older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await Notification.deleteMany({
      userId: req.user._id,
      isRead: true,
      createdAt: { $lt: sevenDaysAgo }
    });

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} old read notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Cleanup notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup notifications'
    });
  }
});

// Remove all read notifications for current user
router.delete('/cleanup/all-read', protect, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user._id,
      isRead: true
    });

    res.json({
      success: true,
      message: `Removed ${result.deletedCount} read notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Remove read notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove read notifications'
    });
  }
});

export default router;
