import express from 'express';
import { protect } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get tab notification counts
router.get('/tab-counts', protect, async (req, res) => {
  try {
    const { role } = req.user;
    
    // Build role-based filter
    let roleFilter = {};
    if (role === 'superadmin') {
      roleFilter = { targetRoles: { $in: ['superadmin', 'admin', 'user'] } };
    } else if (role === 'admin') {
      roleFilter = { targetRoles: { $in: ['admin', 'user'] } };
    } else {
      roleFilter = { targetRoles: 'user' };
    }
    
    const tabCounts = {
      dashboard: await Notification.countDocuments({ 
        category: 'dashboard_tab', 
        isRead: false,
        ...roleFilter
      }),
      analytics: await Notification.countDocuments({ 
        category: 'analytics_tab', 
        isRead: false,
        ...roleFilter
      }),
      charts: await Notification.countDocuments({ 
        category: 'charts_tab', 
        isRead: false,
        ...roleFilter
      }),
      files: await Notification.countDocuments({ 
        category: 'files_tab', 
        isRead: false,
        ...roleFilter
      }),
      adminUsers: await Notification.countDocuments({ 
        category: 'admin_users_tab', 
        isRead: false,
        ...roleFilter
      }),
      adminRequests: await Notification.countDocuments({ 
        category: 'admin_requests_tab', 
        isRead: false,
        ...roleFilter
      })
    };
    
    res.json({
      success: true,
      data: tabCounts,
      userRole: role
    });
    
  } catch (error) {
    console.error('Get tab counts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tab notification counts'
    });
  }
});

export default router;
