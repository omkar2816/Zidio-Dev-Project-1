import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zidio_analytics');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedNotifications = async () => {
  try {
    // Clear existing notifications
    await Notification.deleteMany({});
    console.log('Cleared existing notifications');

    // Get users by role
    const users = await User.find({});
    const usersByRole = {
      user: users.filter(u => u.role === 'user'),
      admin: users.filter(u => u.role === 'admin'),
      superadmin: users.filter(u => u.role === 'superadmin')
    };

    console.log(`Found ${usersByRole.user.length} users, ${usersByRole.admin.length} admins, ${usersByRole.superadmin.length} superadmins`);

    const notifications = [];

    // Superadmin notifications
    if (usersByRole.superadmin.length > 0) {
      const superadminNotifications = [
        {
          userId: usersByRole.superadmin[0]._id,
          type: 'new_user_registered',
          title: 'New User Registration',
          message: 'A new user "john.doe@example.com" has registered to the system',
          category: 'user_management',
          priority: 'medium',
          targetRoles: ['superadmin'],
          data: { userId: usersByRole.user[0]?._id, email: 'john.doe@example.com' },
          navigationUrl: '/admin/users',
          isRead: false
        },
        {
          userId: usersByRole.superadmin[0]._id,
          type: 'system_maintenance',
          title: 'System Maintenance Required',
          message: 'Database optimization scheduled for tonight at 2 AM EST',
          category: 'system',
          priority: 'high',
          targetRoles: ['superadmin'],
          navigationUrl: '/admin/system',
          isRead: false
        },
        {
          userId: usersByRole.superadmin[0]._id,
          type: 'file_upload',
          title: 'File Upload Activity',
          message: 'User uploaded "sales_data.xlsx" (2.5 MB)',
          category: 'file_management',
          priority: 'low',
          targetRoles: ['superadmin'],
          data: { fileName: 'sales_data.xlsx', fileSize: '2.5 MB' },
          navigationUrl: '/admin/files',
          isRead: false
        },
        {
          userId: usersByRole.superadmin[0]._id,
          type: 'security_alert',
          title: 'Security Alert',
          message: 'Multiple failed login attempts detected from IP 192.168.1.100',
          category: 'security',
          priority: 'high',
          targetRoles: ['superadmin'],
          data: { ip: '192.168.1.100', attempts: 5 },
          navigationUrl: '/admin/security',
          isRead: true
        }
      ];
      notifications.push(...superadminNotifications);
    }

    // Admin notifications
    if (usersByRole.admin.length > 0) {
      const adminNotifications = [
        {
          userId: usersByRole.admin[0]._id,
          type: 'user_support_request',
          title: 'User Support Request',
          message: 'User needs help with data analysis features',
          category: 'support',
          priority: 'medium',
          targetRoles: ['admin', 'superadmin'],
          data: { userId: usersByRole.user[0]?._id, subject: 'Data Analysis Help' },
          navigationUrl: '/admin/support',
          isRead: false
        },
        {
          userId: usersByRole.admin[0]._id,
          type: 'system_update',
          title: 'System Update Available',
          message: 'Analytics module update v2.1.0 is ready for deployment',
          category: 'system',
          priority: 'medium',
          targetRoles: ['admin', 'superadmin'],
          navigationUrl: '/admin/updates',
          isRead: false
        },
        {
          userId: usersByRole.admin[0]._id,
          type: 'user_activity_summary',
          title: 'Daily Activity Summary',
          message: 'Today: 25 file uploads, 18 analyses completed, 12 new users',
          category: 'analytics',
          priority: 'low',
          targetRoles: ['admin', 'superadmin'],
          navigationUrl: '/admin/analytics',
          isRead: true
        }
      ];
      notifications.push(...adminNotifications);
    }

    // User notifications
    if (usersByRole.user.length > 0) {
      const userNotifications = [
        {
          userId: usersByRole.user[0]._id,
          type: 'welcome',
          title: 'Welcome to Zidio Analytics!',
          message: 'Your account has been successfully created. Start by uploading your first data file.',
          category: 'account',
          priority: 'medium',
          targetRoles: ['user'],
          isPersonal: true,
          navigationUrl: '/dashboard',
          isRead: false
        },
        {
          userId: usersByRole.user[0]._id,
          type: 'file_processed',
          title: 'File Processing Complete',
          message: 'Your file "customer_data.xlsx" has been processed successfully (1,250 rows, 8 columns)',
          category: 'file_management',
          priority: 'medium',
          targetRoles: ['user'],
          isPersonal: true,
          data: { fileName: 'customer_data.xlsx', rowCount: 1250, columnCount: 8 },
          navigationUrl: '/analytics',
          isRead: false
        },
        {
          userId: usersByRole.user[0]._id,
          type: 'analysis_ready',
          title: 'Analysis Results Ready',
          message: 'Your data analysis is complete! View insights from 1,250 rows across 8 columns.',
          category: 'analytics',
          priority: 'high',
          targetRoles: ['user'],
          isPersonal: true,
          data: { totalRows: 1250, totalColumns: 8, numericColumns: 5, categoricalColumns: 3 },
          navigationUrl: '/analytics',
          isRead: false
        },
        {
          userId: usersByRole.user[0]._id,
          type: 'profile_updated',
          title: 'Profile Updated',
          message: 'Your profile information has been successfully updated',
          category: 'account',
          priority: 'low',
          targetRoles: ['user'],
          isPersonal: true,
          navigationUrl: '/profile',
          isRead: true
        }
      ];

      // Add notifications for additional users if they exist
      if (usersByRole.user.length > 1) {
        userNotifications.push({
          userId: usersByRole.user[1]._id,
          type: 'welcome',
          title: 'Welcome to Zidio Analytics!',
          message: 'Your account has been successfully created. Start by uploading your first data file.',
          category: 'account',
          priority: 'medium',
          targetRoles: ['user'],
          isPersonal: true,
          navigationUrl: '/dashboard',
          isRead: false
        });
      }

      notifications.push(...userNotifications);
    }

    // Insert notifications
    if (notifications.length > 0) {
      const insertedNotifications = await Notification.insertMany(notifications);
      console.log(`Successfully seeded ${insertedNotifications.length} notifications`);

      // Display summary by role
      const summary = {
        superadmin: insertedNotifications.filter(n => n.targetRoles.includes('superadmin')).length,
        admin: insertedNotifications.filter(n => n.targetRoles.includes('admin')).length,
        user: insertedNotifications.filter(n => n.targetRoles.includes('user')).length
      };

      console.log('\nNotification Summary:');
      console.log(`Superadmin notifications: ${summary.superadmin}`);
      console.log(`Admin notifications: ${summary.admin}`);
      console.log(`User notifications: ${summary.user}`);

      // Display unread count by role
      const unreadCounts = {
        superadmin: insertedNotifications.filter(n => n.targetRoles.includes('superadmin') && !n.isRead).length,
        admin: insertedNotifications.filter(n => n.targetRoles.includes('admin') && !n.isRead).length,
        user: insertedNotifications.filter(n => n.targetRoles.includes('user') && !n.isRead).length
      };

      console.log('\nUnread Notifications:');
      console.log(`Superadmin unread: ${unreadCounts.superadmin}`);
      console.log(`Admin unread: ${unreadCounts.admin}`);
      console.log(`User unread: ${unreadCounts.user}`);
    } else {
      console.log('No notifications to seed - no users found');
    }

  } catch (error) {
    console.error('Error seeding notifications:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the seeder
connectDB().then(() => {
  console.log('Starting notification seeding...\n');
  seedNotifications();
});

