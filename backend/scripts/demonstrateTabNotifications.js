import fetch from 'node-fetch';
import NotificationService from '../services/NotificationService.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Comprehensive demonstration of tab-specific notification system
const demonstrateTabNotifications = async () => {
  console.log('🎯 TAB-SPECIFIC NOTIFICATION SYSTEM DEMONSTRATION\n');
  console.log('=' .repeat(60));

  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/excel-analytics');
      console.log('✅ Connected to MongoDB');
    }

    // Get test users
    const superAdmin = await User.findOne({ role: 'superadmin' });
    const admin = await User.findOne({ role: 'admin' });
    const user = await User.findOne({ role: 'user' });

    if (!superAdmin || !admin || !user) {
      console.log('❌ Test users not found. Please ensure users exist in database.');
      return;
    }

    console.log('\n📊 GENERATING TAB-SPECIFIC NOTIFICATIONS');
    console.log('-' .repeat(40));

    // 1. Dashboard notifications
    console.log('\n🏠 Dashboard Notifications:');
    await NotificationService.notifyDashboardUpdate(user, 'Dashboard Refreshed', {});
    console.log('   ✅ Dashboard update notification created');

    // 2. Analytics notifications  
    console.log('\n📈 Analytics Notifications:');
    await NotificationService.notifyAnalyticsEvent(user, 'File Analysis Complete', 'sales_data.xlsx');
    console.log('   ✅ Analytics event notification created');

    // 3. Charts notifications
    console.log('\n📊 Charts Notifications:');
    await NotificationService.notifyChartCreated(user, 'Bar Chart', 'sales_data.xlsx');
    console.log('   ✅ Chart creation notification created');

    // 4. Files notifications
    console.log('\n📁 Files Notifications:');
    await NotificationService.notifyFileUploaded(user, 'quarterly_report.xlsx');
    console.log('   ✅ File upload notification created');

    // 5. Admin notifications with sub-sections
    console.log('\n👥 Admin Notifications:');
    
    // Admin > Users sub-section
    await NotificationService.notifyAdminEvent('New User Added', {
      message: 'A new user has been added to the system',
      priority: 'medium'
    }, 'users');
    console.log('   ✅ Admin users sub-section notification created');

    // Admin > Requests sub-section  
    await NotificationService.notifyAdminEvent('Admin Request Received', {
      message: 'New admin privilege request received',
      priority: 'high'
    }, 'requests');
    console.log('   ✅ Admin requests sub-section notification created');

    // 6. Profile notifications
    console.log('\n👤 Profile Notifications:');
    await NotificationService.notifyProfileEvent(user, 'profile_update', 'Your profile information has been updated');
    console.log('   ✅ Profile update notification created');

    // 7. Settings notifications
    console.log('\n⚙️ Settings Notifications:');
    await NotificationService.notifySettingsChange(user, 'Email Preferences', 'updated');
    console.log('   ✅ Settings change notification created');

    // Wait a moment for database operations
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n🔍 TESTING API ENDPOINTS');
    console.log('-' .repeat(40));

    // Test the API endpoints (simulated)
    const baseUrl = 'http://localhost:5000';
    
    // Login to get auth token
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: superAdmin.email,
        password: 'SuperAdmin123!' // Assuming this is the default password
      })
    }).catch(() => null);

    if (loginResponse && loginResponse.ok) {
      const { token } = await loginResponse.json();
      console.log('\n✅ Authentication successful');

      // Test tab counts
      const tabCountsResponse = await fetch(`${baseUrl}/api/notifications/tab-counts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null);

      if (tabCountsResponse && tabCountsResponse.ok) {
        const tabCounts = await tabCountsResponse.json();
        console.log('\n📊 Tab Notification Counts:');
        Object.entries(tabCounts.data).forEach(([tab, count]) => {
          if (count > 0) {
            console.log(`   📍 ${tab.charAt(0).toUpperCase() + tab.slice(1)}: ${count} notifications`);
          }
        });
      }

      // Test admin tab with sub-sections
      const adminTabResponse = await fetch(`${baseUrl}/api/notifications/tab/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null);

      if (adminTabResponse && adminTabResponse.ok) {
        const adminData = await adminTabResponse.json();
        console.log(`\n👥 Admin Tab: ${adminData.data.totalCount} total, ${adminData.data.unreadCount} unread`);
      }

    } else {
      console.log('\n⚠️ API testing skipped (server not running or authentication failed)');
    }

    console.log('\n🎉 DEMONSTRATION SUMMARY');
    console.log('=' .repeat(60));
    console.log('✅ Dashboard notifications: Generated');
    console.log('✅ Analytics notifications: Generated');  
    console.log('✅ Charts notifications: Generated');
    console.log('✅ Files notifications: Generated');
    console.log('✅ Admin notifications (with sub-sections): Generated');
    console.log('✅ Profile notifications: Generated');
    console.log('✅ Settings notifications: Generated');

    console.log('\n🚀 INTEGRATION BENEFITS:');
    console.log('• Users see notifications organized by application sections');
    console.log('• Tab badges show unread counts for each section');
    console.log('• Admin panel supports sub-section filtering (users, requests)');
    console.log('• Real-time updates every 30 seconds');
    console.log('• Seamless integration with existing notification system');
    console.log('• Enhanced filtering and search capabilities');

    console.log('\n📱 FRONTEND COMPONENTS READY:');
    console.log('• TabNotificationBadge: Shows tab-specific notification counts');
    console.log('• Enhanced NotificationPanel: Supports tab filtering');
    console.log('• Updated Sidebar: Displays notification badges per tab');
    console.log('• Admin Component: Sub-section notification badges');

    console.log('\n🔧 API ENDPOINTS AVAILABLE:');
    console.log('• GET /api/notifications/tab-counts - Get counts per tab');
    console.log('• GET /api/notifications/tab/:section - Get tab notifications');
    console.log('• GET /api/notifications?tabSection=X&subSection=Y - Filtered notifications');

  } catch (error) {
    console.error('\n❌ Demonstration failed:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Ensure MongoDB is running and connected');
    console.log('2. Check that test users exist in database');
    console.log('3. Verify notification model schema is updated');
    console.log('4. Ensure backend server is running for API tests');
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n✅ Database connection closed');
    }
  }
};

// Run the demonstration
demonstrateTabNotifications();
