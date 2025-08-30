import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

// Connect to MongoDB and clean all fake notifications
async function cleanFakeNotifications() {
  try {
    console.log('🧹 Cleaning up fake notifications...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/excelAnalytics');
    console.log('✅ Connected to MongoDB');
    
    // Count existing notifications
    const totalBefore = await Notification.countDocuments();
    console.log(`📊 Total notifications before cleanup: ${totalBefore}`);
    
    // Remove all existing notifications since they are from testing/seeding
    const result = await Notification.deleteMany({});
    console.log(`🗑️  Removed ${result.deletedCount} fake notifications`);
    
    // Verify cleanup
    const totalAfter = await Notification.countDocuments();
    console.log(`📊 Total notifications after cleanup: ${totalAfter}`);
    
    console.log('\n✅ Database cleaned successfully!');
    console.log('🎯 From now on, notifications will only be generated from real user activities:');
    console.log('   - User registration → Welcome notification');
    console.log('   - File upload → Processing notification');
    console.log('   - Analysis completion → Results ready notification');
    console.log('   - Profile updates → Confirmation notification');
    console.log('   - Admin requests → Admin notification');
    console.log('   - Authentication events → Security notifications');
    
  } catch (error) {
    console.error('❌ Error cleaning notifications:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
cleanFakeNotifications();
