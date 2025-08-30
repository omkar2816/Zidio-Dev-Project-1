import Notification from '../models/Notification.js';
import User from '../models/User.js';

class NotificationService {
  
  // Get users by role
  static async getUsersByRole(role) {
    return await User.find({ role: role, isActive: true }).select('_id');
  }

  // Get all superadmins
  static async getSuperAdmins() {
    return await User.find({ role: 'superadmin', isActive: true }).select('_id');
  }

  // Get all admins (including superadmins)
  static async getAdmins() {
    return await User.find({ 
      role: { $in: ['admin', 'superadmin'] }, 
      isActive: true 
    }).select('_id');
  }

  // Create notification for all users of specific roles
  static async notifyUsersByRole(roles, notificationData) {
    try {
      const users = await User.find({ 
        role: { $in: roles }, 
        isActive: true 
      }).select('_id');
      
      if (users.length === 0) {
        console.log(`No active users found for roles: ${roles.join(', ')}`);
        return;
      }

      const notifications = users.map(user => ({
        recipient: user._id,
        targetRoles: roles,
        ...notificationData
      }));

      await Notification.insertMany(notifications);
      console.log(`Created ${notifications.length} notifications for roles: ${roles.join(', ')}`);
    } catch (error) {
      console.error('Error creating role-based notifications:', error);
    }
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
        userId: admin._id,
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
        isPersonal: true,
        ...notificationData
      });
      console.log(`Created personal notification for user: ${userId}`);
    } catch (error) {
      console.error('Error creating user notification:', error);
    }
  }

  // ===== USER-SPECIFIC NOTIFICATIONS =====

  // Welcome notification for new users
  static async notifyWelcomeUser(user) {
    const notification = this.getNotificationTemplate('welcome_user', {
      userName: `${user.firstName} ${user.lastName}`
    });
    
    await this.notifyUser(user._id, notification);
  }

  // Notify user when their file is processed
  static async notifyFileProcessed(user, fileName, analysisResults) {
    const notification = this.getNotificationTemplate('file_processed', {
      userName: `${user.firstName} ${user.lastName}`,
      fileName: fileName,
      rowCount: analysisResults.rowCount,
      sheetCount: analysisResults.sheetCount
    });
    
    await this.notifyUser(user._id, notification);
  }

  // Notify user when analysis is ready
  static async notifyAnalysisReady(user, fileName, chartCount) {
    const notification = this.getNotificationTemplate('analysis_ready', {
      userName: `${user.firstName} ${user.lastName}`,
      fileName: fileName,
      chartCount: chartCount
    });
    
    await this.notifyUser(user._id, notification);
  }

  // Notify user about account updates
  static async notifyAccountUpdated(user, updateType) {
    const notification = this.getNotificationTemplate('account_updated', {
      userName: `${user.firstName} ${user.lastName}`,
      updateType: updateType
    });
    
    await this.notifyUser(user._id, notification);
  }

  // Notify user about password change
  static async notifyPasswordChanged(user) {
    const notification = this.getNotificationTemplate('password_changed', {
      userName: `${user.firstName} ${user.lastName}`
    });
    
    await this.notifyUser(user._id, notification);
  }

  // Notify user about successful login (optional security feature)
  static async notifyLoginSuccess(user, loginInfo) {
    const notification = this.getNotificationTemplate('login_success', {
      userName: `${user.firstName} ${user.lastName}`,
      location: loginInfo.location || 'Unknown',
      device: loginInfo.device || 'Unknown',
      time: new Date().toLocaleString()
    });
    
    await this.notifyUser(user._id, notification);
  }

  // Notify user about suspicious activity on their account
  static async notifySuspiciousActivity(user, activityDetails) {
    const notification = this.getNotificationTemplate('suspicious_activity', {
      userName: `${user.firstName} ${user.lastName}`,
      activity: activityDetails.type,
      location: activityDetails.location || 'Unknown',
      time: activityDetails.time
    });
    
    await this.notifyUser(user._id, notification);
  }

  // Notify user about quota warnings
  static async notifyQuotaWarning(user, quotaType, currentUsage, limit) {
    const notification = this.getNotificationTemplate('quota_warning', {
      userName: `${user.firstName} ${user.lastName}`,
      quotaType: quotaType,
      currentUsage: currentUsage,
      limit: limit,
      percentage: Math.round((currentUsage / limit) * 100)
    });
    
    await this.notifyUser(user._id, notification);
  }

  // ===== ADMIN-SPECIFIC NOTIFICATIONS =====

  // Notify admins about new user assignments
  static async notifyNewUserAssigned(adminUser, newUser) {
    const notification = this.getNotificationTemplate('new_user_assigned', {
      adminName: `${adminUser.firstName} ${adminUser.lastName}`,
      userName: `${newUser.firstName} ${newUser.lastName}`,
      userEmail: newUser.email
    });
    
    await this.notifyUsersByRole(['admin', 'superadmin'], notification);
  }

  // Notify admins about user support requests
  static async notifyUserSupportRequest(user, requestDetails) {
    const notification = this.getNotificationTemplate('user_support_request', {
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      requestType: requestDetails.type,
      priority: requestDetails.priority,
      description: requestDetails.description
    });
    
    await this.notifyUsersByRole(['admin', 'superadmin'], notification);
  }

  // Notify admins about system maintenance
  static async notifySystemMaintenance(maintenanceDetails) {
    const notification = this.getNotificationTemplate('system_maintenance', {
      maintenanceType: maintenanceDetails.type,
      scheduledTime: maintenanceDetails.scheduledTime,
      duration: maintenanceDetails.duration,
      affectedServices: maintenanceDetails.affectedServices
    });
    
    await this.notifyUsersByRole(['admin', 'superadmin'], notification);
  }

  // Notify admins about performance reports
  static async notifyPerformanceReport(reportData) {
    const notification = this.getNotificationTemplate('performance_report', {
      reportPeriod: reportData.period,
      totalUsers: reportData.totalUsers,
      totalFiles: reportData.totalFiles,
      systemLoad: reportData.systemLoad,
      issues: reportData.issues || 'None'
    });
    
    await this.notifyUsersByRole(['admin', 'superadmin'], notification);
  }

  // ===== ANNOUNCEMENT NOTIFICATIONS =====

  // Notify all users about new features
  static async notifyFeatureAnnouncement(announcementData) {
    const notification = this.getNotificationTemplate('feature_announcement', {
      featureName: announcementData.featureName,
      description: announcementData.description,
      releaseDate: announcementData.releaseDate
    });
    
    await this.notifyUsersByRole(['user', 'admin', 'superadmin'], notification);
  }

  // ===== NOTIFICATION TEMPLATES =====

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
        navigationUrl: '/admin/requests',
        priority: 'high',
        category: 'admin_requests_tab',
        targetRoles: ['superadmin']
      },

      admin_request_approved: {
        type: 'admin_request_approved',
        title: 'Admin Request Approved',
        message: `Congratulations! Your admin request has been approved. You now have admin access.`,
        navigationUrl: '/admin',
        priority: 'high',
        category: 'account',
        targetRoles: ['admin'],
        isPersonal: true
      },

      admin_request_rejected: {
        type: 'admin_request_rejected',
        title: 'Admin Request Rejected',
        message: `Your admin request has been rejected. Reason: ${data.reason}`,
        navigationUrl: '/profile',
        priority: 'medium',
        category: 'account',
        targetRoles: ['user'],
        isPersonal: true
      },

      admin_privileges_granted: {
        type: 'admin_privileges_granted',
        title: 'Admin Privileges Granted',
        message: `${data.userName} has been granted admin privileges by ${data.grantedBy}`,
        navigationUrl: '/admin/users',
        priority: 'medium',
        category: 'user_management',
        targetRoles: ['superadmin']
      },

      admin_privileges_revoked: {
        type: 'admin_privileges_revoked',
        title: 'Admin Privileges Revoked',
        message: `${data.userName} admin privileges have been revoked by ${data.revokedBy}`,
        navigationUrl: '/admin/users',
        priority: 'medium',
        category: 'user_management',
        targetRoles: ['superadmin']
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
        message: data.alertMessage || 'Security event detected',
        actionUrl: '/admin',
        priority: 'critical',
        category: 'security'
      },

      user_deletion: {
        type: 'user_deletion',
        title: 'User Account Deleted',
        message: `${data.userName} account has been permanently deleted by ${data.deletedBy}`,
        actionUrl: '/admin',
        priority: 'high',
        category: 'admin'
      },

      admin_privileges_granted: {
        type: 'admin_privileges_granted',
        title: 'Admin Privileges Granted',
        message: `${data.userName} has been granted admin privileges by ${data.grantedBy}`,
        actionUrl: '/admin',
        priority: 'high',
        category: 'admin'
      },

      admin_privileges_revoked: {
        type: 'admin_privileges_revoked',
        title: 'Admin Privileges Revoked',
        message: `${data.userName} admin privileges have been revoked by ${data.revokedBy}`,
        actionUrl: '/admin',
        priority: 'high',
        category: 'admin'
      },

      bulk_operation_completed: {
        type: 'bulk_operation_completed',
        title: 'Bulk Operation Completed',
        message: `${data.operationType} operation completed on ${data.itemCount} items by ${data.performedBy}`,
        actionUrl: data.actionUrl || '/admin',
        priority: 'medium',
        category: 'system'
      },

      system_milestone: {
        type: 'system_milestone',
        title: 'Platform Milestone Reached',
        message: data.milestoneMessage,
        actionUrl: '/admin',
        priority: 'medium',
        category: 'system'
      },

      login_alert: {
        type: 'login_alert',
        title: 'Login Activity Alert',
        message: `${data.userName} logged in from ${data.location}`,
        actionUrl: `/admin?user=${data.userId}`,
        priority: 'low',
        category: 'security'
      },

      // User-specific notification templates
      welcome_user: {
        type: 'welcome_user',
        title: 'Welcome to Excel Analytics!',
        message: `Welcome ${data.userName}! Start by uploading your first Excel file to begin data analysis.`,
        actionUrl: '/analytics',
        priority: 'medium',
        category: 'user'
      },

      file_processed: {
        type: 'file_processed',
        title: 'File Processing Complete',
        message: `Your file "${data.fileName}" has been processed successfully. ${data.rowCount} rows across ${data.sheetCount} sheets are ready for analysis.`,
        actionUrl: '/analytics',
        priority: 'medium',
        category: 'user'
      },

      analysis_ready: {
        type: 'analysis_ready',
        title: 'Analysis Results Ready',
        message: `Analysis complete for "${data.fileName}". ${data.chartCount} charts have been generated and are ready to view.`,
        actionUrl: '/analytics',
        priority: 'medium',
        category: 'analytics'
      },

      account_updated: {
        type: 'account_updated',
        title: 'Account Updated',
        message: `Your ${data.updateType} has been updated successfully.`,
        actionUrl: '/profile',
        priority: 'low',
        category: 'user'
      },

      password_changed: {
        type: 'password_changed',
        title: 'Password Changed',
        message: 'Your password has been changed successfully. If this wasn\'t you, please contact support immediately.',
        actionUrl: '/profile',
        priority: 'high',
        category: 'security'
      },

      login_success: {
        type: 'login_success',
        title: 'Successful Login',
        message: `Login successful from ${data.location} on ${data.device} at ${data.time}`,
        actionUrl: '/dashboard',
        priority: 'low',
        category: 'security'
      },

      suspicious_activity: {
        type: 'suspicious_activity',
        title: 'Suspicious Activity Detected',
        message: `Suspicious ${data.activity} detected from ${data.location} at ${data.time}. Please review your account security.`,
        actionUrl: '/profile',
        priority: 'critical',
        category: 'security'
      },

      quota_warning: {
        type: 'quota_warning',
        title: 'Quota Warning',
        message: `Your ${data.quotaType} usage is at ${data.percentage}% (${data.currentUsage}/${data.limit}). Consider upgrading your plan.`,
        actionUrl: '/profile',
        priority: 'medium',
        category: 'user'
      },

      feature_announcement: {
        type: 'feature_announcement',
        title: 'New Feature Available',
        message: `${data.featureName}: ${data.description}. Available from ${data.releaseDate}.`,
        actionUrl: '/dashboard',
        priority: 'medium',
        category: 'system'
      },

      // Admin-specific notification templates
      new_user_assigned: {
        type: 'new_user_assigned',
        title: 'New User Assignment',
        message: `New user ${data.userName} (${data.userEmail}) has been assigned to your management.`,
        actionUrl: '/admin',
        priority: 'medium',
        category: 'admin'
      },

      user_support_request: {
        type: 'user_support_request',
        title: 'User Support Request',
        message: `${data.userName} (${data.userEmail}) submitted a ${data.priority} priority ${data.requestType} request: ${data.description}`,
        actionUrl: '/admin',
        priority: data.priority === 'high' ? 'high' : 'medium',
        category: 'admin'
      },

      system_maintenance: {
        type: 'system_maintenance',
        title: 'Scheduled System Maintenance',
        message: `${data.maintenanceType} maintenance scheduled for ${data.scheduledTime} (${data.duration}). Affected: ${data.affectedServices}`,
        actionUrl: '/admin',
        priority: 'high',
        category: 'system'
      },

      performance_report: {
        type: 'performance_report',
        title: 'System Performance Report',
        message: `${data.reportPeriod} report: ${data.totalUsers} users, ${data.totalFiles} files, ${data.systemLoad}% load. Issues: ${data.issues}`,
        actionUrl: '/admin',
        priority: 'medium',
        category: 'system'
      },

      analytics_data_ready: {
        type: 'analytics_data_ready',
        title: 'Analytics Data Ready',
        message: `New analytics data is available for review. Check the analytics tab for updated insights.`,
        actionUrl: '/analytics',
        navigationUrl: '/analytics',
        priority: 'medium',
        category: 'analytics_tab',
        targetRoles: ['user', 'admin', 'superadmin']
      },

      chart_generation_complete: {
        type: 'chart_generation_complete',
        title: 'Chart Generation Complete',
        message: `Your charts have been generated successfully. View them in the charts section.`,
        actionUrl: '/charts',
        navigationUrl: '/charts',
        priority: 'medium',
        category: 'charts_tab',
        targetRoles: ['user'],
        isPersonal: true
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

  // Notify superadmins about user deletion
  static async notifyUserDeletion(deletedUser, adminUser) {
    const notification = this.getNotificationTemplate('user_deletion', {
      userName: `${deletedUser.firstName} ${deletedUser.lastName}`,
      userEmail: deletedUser.email,
      deletedBy: `${adminUser.firstName} ${adminUser.lastName}`,
      userId: deletedUser._id
    });
    
    await this.notifySuperAdmins(notification);
  }

  // Notify user about profile update
  static async notifyProfileUpdated(user) {
    const notification = this.getNotificationTemplate('profile_updated', {
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      userId: user._id
    });
    
    // Send personal notification to the user
    await this.createNotification({
      ...notification,
      userId: user._id,
      isPersonal: true
    });
  }

  // Notify user about admin request approval
  static async notifyAdminApproved(user) {
    const notification = this.getNotificationTemplate('admin_request_approved', {
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      userId: user._id
    });
    
    // Send personal notification to the user
    await this.createNotification({
      ...notification,
      userId: user._id,
      isPersonal: true
    });
  }

  // Notify user about admin request rejection
  static async notifyAdminRejected(user, reason) {
    const notification = this.getNotificationTemplate('admin_request_rejected', {
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      reason: reason || 'No reason provided',
      userId: user._id
    });
    
    // Send personal notification to the user
    await this.createNotification({
      ...notification,
      userId: user._id,
      isPersonal: true
    });
  }

  // Notify superadmins about admin privileges changes
  static async notifyAdminPrivilegesGranted(user, grantedBy) {
    const notification = this.getNotificationTemplate('admin_privileges_granted', {
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      grantedBy: `${grantedBy.firstName} ${grantedBy.lastName}`,
      userId: user._id
    });
    
    await this.notifySuperAdmins(notification);
  }

  static async notifyAdminPrivilegesRevoked(user, revokedBy) {
    const notification = this.getNotificationTemplate('admin_privileges_revoked', {
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      revokedBy: `${revokedBy.firstName} ${revokedBy.lastName}`,
      userId: user._id
    });
    
    await this.notifySuperAdmins(notification);
  }

  // Notify superadmins about bulk operations
  static async notifyBulkOperation(operationType, itemCount, adminUser) {
    const notification = this.getNotificationTemplate('bulk_operation_completed', {
      operationType: operationType,
      itemCount: itemCount,
      performedBy: `${adminUser.firstName} ${adminUser.lastName}`,
      actionUrl: '/admin'
    });
    
    await this.notifySuperAdmins(notification);
  }

  // Notify superadmins about system milestones
  static async notifySystemMilestone(milestoneData) {
    const notification = this.getNotificationTemplate('system_milestone', {
      milestoneMessage: milestoneData.message,
      milestone: milestoneData.type,
      value: milestoneData.value
    });
    
    await this.notifySuperAdmins(notification);
  }

  // Notify superadmins about suspicious login activity
  static async notifyLoginAlert(user, loginInfo) {
    const notification = this.getNotificationTemplate('login_alert', {
      userName: `${user.firstName} ${user.lastName}`,
      location: loginInfo.location || 'Unknown',
      ipAddress: loginInfo.ip,
      userAgent: loginInfo.userAgent,
      userId: user._id
    });
    
    await this.notifySuperAdmins(notification);
  }

  // Notify superadmins about security alerts
  static async notifySecurityAlert(alertData) {
    const notification = this.getNotificationTemplate('security_alert', {
      alertMessage: alertData.message,
      severity: alertData.severity || 'medium',
      source: alertData.source || 'system'
    });
    
    await this.notifySuperAdmins(notification);
  }

  // Notify superadmins about system updates
  static async notifySystemUpdate(updateData) {
    const notification = this.getNotificationTemplate('system_update', {
      updateMessage: updateData.message,
      version: updateData.version,
      changes: updateData.changes
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
