import express from 'express';
import { protect, requireAdmin } from '../middleware/auth.js';
import NotificationService from '../services/NotificationService.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Test endpoint to create tab-specific notifications
router.post('/create-tab-notification', protect, requireAdmin, async (req, res) => {
  try {
    const { tabType, data = {} } = req.body;
    
    let notification;
    
    switch (tabType) {
      case 'dashboard':
        await NotificationService.notifyDashboardUpdate(req.user, {
          type: data.type || 'System Update',
          details: data.details || 'Your dashboard has been updated with new features'
        });
        notification = 'Dashboard notification created';
        break;
        
      case 'analytics':
        await NotificationService.notifyAnalyticsReportReady(req.user, {
          name: data.name || 'Test Analytics Report',
          processingTime: data.processingTime || '1 minute'
        });
        notification = 'Analytics notification created';
        break;
        
      case 'charts':
        await NotificationService.notifyChartTemplateAdded(req.user, {
          name: data.name || 'Test Chart Template',
          category: data.category || 'General'
        });
        notification = 'Charts notification created';
        break;
        
      case 'files':
        await NotificationService.notifyFilesProcessingComplete(req.user, {
          count: data.count || 3,
          totalSize: data.totalSize || '5.2 MB'
        });
        notification = 'Files notification created';
        break;
        
      case 'admin-users':
        if (data.targetUser) {
          await NotificationService.notifyAdminUserActionRequired(data.targetUser, {
            type: data.actionType || 'Account Review',
            reason: data.reason || 'Routine security check',
            deadline: data.deadline || '48 hours'
          });
        }
        notification = 'Admin users notification created';
        break;
        
      case 'admin-requests':
        await NotificationService.notifyAdminRequestActionRequired({
          pendingCount: data.pendingCount || 2,
          oldestRequestAge: data.oldestRequestAge || '1 day',
          priority: data.priority || 'medium'
        });
        notification = 'Admin requests notification created';
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid tab type. Use: dashboard, analytics, charts, files, admin-users, admin-requests'
        });
    }
    
    res.json({
      success: true,
      message: notification,
      tabType: tabType,
      data: data
    });
    
  } catch (error) {
    console.error('Create tab notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create tab notification'
    });
  }
});

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
