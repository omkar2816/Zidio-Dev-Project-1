import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

dotenv.config();

const createTabNotificationDemo = async () => {
  try {
    console.log('🎯 TAB NOTIFICATION DEMO');
    console.log('========================\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a real user to create notifications for
    const testUser = await User.findOne({ role: 'user' });
    const superadmin = await User.findOne({ role: 'superadmin' });
    
    if (!testUser && !superadmin) {
      console.log('❌ No users found. Please ensure you have users in the database.');
      return;
    }

    console.log('🔔 Creating Tab-Specific Notifications...\n');

    // Demo notifications for each tab
    const demoNotifications = [];

    // Dashboard tab notification
    if (testUser) {
      demoNotifications.push({
        userId: testUser._id,
        type: 'dashboard_update',
        title: 'Dashboard Updated',
        message: 'New analytics widget has been added to your dashboard',
        category: 'dashboard_tab',
        priority: 'medium',
        targetRoles: ['user'],
        isPersonal: true,
        actionUrl: '/dashboard',
        navigationUrl: '/dashboard'
      });
    }

    // Analytics tab notification
    if (testUser) {
      demoNotifications.push({
        userId: testUser._id,
        type: 'analytics_report_ready',
        title: 'Analytics Report Ready',
        message: 'Your monthly analytics report is now available for review',
        category: 'analytics_tab',
        priority: 'medium',
        targetRoles: ['user'],
        isPersonal: true,
        actionUrl: '/analytics',
        navigationUrl: '/analytics'
      });
    }

    // Charts tab notification (for all users)
    if (superadmin) {
      demoNotifications.push({
        userId: superadmin._id,
        type: 'charts_template_added',
        title: 'New Chart Template Available',
        message: 'Admin added a new "Sales Performance" chart template in Business category',
        category: 'charts_tab',
        priority: 'low',
        targetRoles: ['user', 'admin', 'superadmin'],
        actionUrl: '/charts',
        navigationUrl: '/charts'
      });
    }

    // Files tab notification
    if (testUser) {
      demoNotifications.push({
        userId: testUser._id,
        type: 'files_processing_complete',
        title: 'Batch File Processing Complete',
        message: 'Processing complete! 3 files (4.2 MB) have been processed successfully',
        category: 'files_tab',
        priority: 'medium',
        targetRoles: ['user'],
        isPersonal: true,
        actionUrl: '/files',
        navigationUrl: '/files'
      });
    }

    // Admin Users tab notification
    if (superadmin) {
      demoNotifications.push({
        userId: superadmin._id,
        type: 'admin_user_action_required',
        title: 'User Action Required',
        message: 'User "John Doe" requires account verification due to suspicious activity',
        category: 'admin_users_tab',
        priority: 'high',
        targetRoles: ['admin', 'superadmin'],
        actionUrl: '/admin',
        navigationUrl: '/admin'
      });
    }

    // Admin Requests tab notification
    if (superadmin) {
      demoNotifications.push({
        userId: superadmin._id,
        type: 'admin_request_action_required',
        title: 'Admin Requests Need Attention',
        message: '2 pending admin requests require your immediate attention',
        category: 'admin_requests_tab',
        priority: 'high',
        targetRoles: ['superadmin'],
        actionUrl: '/admin',
        navigationUrl: '/admin'
      });
    }

    // Insert all demo notifications
    if (demoNotifications.length > 0) {
      await Notification.insertMany(demoNotifications);
      console.log(`✅ Created ${demoNotifications.length} tab-specific demo notifications\n`);
    }

    // Show summary of notifications by tab
    console.log('📊 TAB NOTIFICATION SUMMARY:');
    console.log('============================');
    
    const tabCounts = await Promise.all([
      { tab: 'Dashboard', count: await Notification.countDocuments({ category: 'dashboard_tab', isRead: false }) },
      { tab: 'Analytics', count: await Notification.countDocuments({ category: 'analytics_tab', isRead: false }) },
      { tab: 'Charts', count: await Notification.countDocuments({ category: 'charts_tab', isRead: false }) },
      { tab: 'Files', count: await Notification.countDocuments({ category: 'files_tab', isRead: false }) },
      { tab: 'Admin Users', count: await Notification.countDocuments({ category: 'admin_users_tab', isRead: false }) },
      { tab: 'Admin Requests', count: await Notification.countDocuments({ category: 'admin_requests_tab', isRead: false }) }
    ]);

    tabCounts.forEach(({ tab, count }) => {
      console.log(`📋 ${tab} Tab: ${count} unread notifications`);
    });

    console.log('\n🎯 HOW TO TEST:');
    console.log('===============');
    console.log('1. Start your frontend: npm run dev (in frontend folder)');
    console.log('2. Start your backend: npm run dev (in backend folder)');
    console.log('3. Login to your application');
    console.log('4. Look for red badge numbers on:');
    console.log('   - Sidebar navigation items (Dashboard, Analytics, Charts, Files)');
    console.log('   - Admin panel tabs (User Management, Admin Requests)');
    console.log('5. Click the notification bell to see detailed notifications');
    console.log('6. Use the category filter to view tab-specific notifications');

    console.log('\n✨ TAB NOTIFICATION FEATURES:');
    console.log('=============================');
    console.log('• Real-time badge counting on tabs');
    console.log('• Role-based notification targeting');
    console.log('• Category-based filtering in notification panel');
    console.log('• Automatic refresh every 30 seconds');
    console.log('• Tab-specific colors and icons');
    console.log('• Seamless navigation to relevant pages');

  } catch (error) {
    console.error('❌ Demo error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

createTabNotificationDemo();
