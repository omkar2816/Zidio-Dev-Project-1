import Notification from '../models/Notification.js';
import User from '../models/User.js';

class NotificationService {
  
  // Get all superadmins
  static async getSuperAdmins() {
    return await User.find({ role: 'superadmin' }).select('_id');
  }

  // Create notification for all superadmins
  static async notifySuperAdmins(notificationData) {
    try {
      const superAdmins = await this.getSuperAdmins();
      
      if (superAdmins.length === 0) {
        console.log('No superadmins found to notify');
        return;
      }

      const notifications = superAdmins.map(admin => ({
        recipient: admin._id,
        ...notificationData
      }));

      await Notification.insertMany(notifications);
      console.log(`Created ${notifications.length} notifications for superadmins`);
    } catch (error) {
      console.error('Error creating superadmin notifications:', error);
    }
  }

  // Create notification for specific user
  static async notifyUser(userId, notificationData) {
    try {
      await Notification.create({
        recipient: userId,
        ...notificationData
      });
    } catch (error) {
      console.error('Error creating user notification:', error);
    }
  }

  // Notification templates for different events
  static getNotificationTemplate(type, data) {
    const templates = {
      new_user_registration: {
        type: 'new_user_registration',
        title: 'New User Registration',
        message: `${data.userName} has registered on the platform`,
        actionUrl: '/admin/users',
        priority: 'medium',
        category: 'admin'
      },
      
      admin_request_submitted: {
        type: 'admin_request_submitted',
        title: 'New Admin Request',
        message: `${data.userName} has requested admin privileges`,
        actionUrl: '/admin/requests',
        priority: 'high',
        category: 'admin'
      },
      
      file_upload: {
        type: 'file_upload',
        title: 'File Upload Activity',
        message: `${data.userName} uploaded "${data.fileName}"`,
        actionUrl: '/admin/analytics',
        priority: 'low',
        category: 'user'
      },
      
      data_analysis_completed: {
        type: 'data_analysis_completed',
        title: 'Data Analysis Completed',
        message: `${data.userName} completed analysis on "${data.fileName}"`,
        actionUrl: '/admin/analytics',
        priority: 'low',
        category: 'user'
      },
      
      user_activity_alert: {
        type: 'user_activity_alert',
        title: 'High User Activity',
        message: `${data.userName} has performed ${data.activityCount} actions in the last hour`,
        actionUrl: '/admin/users',
        priority: 'medium',
        category: 'admin'
      },
      
      system_update: {
        type: 'system_update',
        title: 'System Update',
        message: data.message || 'System has been updated',
        actionUrl: '/admin/dashboard',
        priority: 'medium',
        category: 'system'
      },
      
      security_alert: {
        type: 'security_alert',
        title: 'Security Alert',
        message: data.message || 'Security event detected',
        actionUrl: '/admin/security',
        priority: 'urgent',
        category: 'security'
      }
    };

    const template = templates[type];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    return {
      ...template,
      data: data
    };
  }

  // Notify superadmins about new user registration
  static async notifyNewUserRegistration(user) {
    const notification = this.getNotificationTemplate('new_user_registration', {
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      userId: user._id
    });
    
    await this.notifySuperAdmins(notification);
  }

  // Notify superadmins about admin request
  static async notifyAdminRequest(user) {
    const notification = this.getNotificationTemplate('admin_request_submitted', {
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      userId: user._id
    });
    
    await this.notifySuperAdmins(notification);
  }

  // Notify superadmins about file uploads
  static async notifyFileUpload(user, fileName) {
    const notification = this.getNotificationTemplate('file_upload', {
      userName: `${user.firstName} ${user.lastName}`,
      fileName: fileName,
      userId: user._id
    });
    
    await this.notifySuperAdmins(notification);
  }

  // Notify superadmins about data analysis
  static async notifyDataAnalysis(user, fileName) {
    const notification = this.getNotificationTemplate('data_analysis_completed', {
      userName: `${user.firstName} ${user.lastName}`,
      fileName: fileName,
      userId: user._id
    });
    
    await this.notifySuperAdmins(notification);
  }

  // Notify superadmins about high user activity
  static async notifyHighActivity(user, activityCount) {
    const notification = this.getNotificationTemplate('user_activity_alert', {
      userName: `${user.firstName} ${user.lastName}`,
      activityCount: activityCount,
      userId: user._id
    });
    
    await this.notifySuperAdmins(notification);
  }

  // Mark notification as read and return action URL
  static async markAsReadAndGetAction(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { 
          isRead: true, 
          readAt: new Date() 
        },
        { new: true }
      );

      return notification ? notification.actionUrl : null;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }
  }
}

export default NotificationService;
