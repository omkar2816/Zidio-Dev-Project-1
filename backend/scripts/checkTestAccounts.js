import mongoose from 'mongoose';
import User from '../models/User.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/zidio-dev');

async function checkTestAccounts() {
  try {
    console.log('🔍 Checking existing user accounts...\n');
    
    // Find all users
    const users = await User.find({}).select('email role isActive adminStatus');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('\n📝 Creating a test user account...');
      
      // Create a test user
      const testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Test123!',
        role: 'user',
        isActive: true
      });
      
      await testUser.save();
      console.log('✅ Test user created: test@example.com / Test123!');
      
      // Also create a test admin
      const testAdmin = new User({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@example.com',
        password: 'Admin123!',
        role: 'superadmin',
        isActive: true
      });
      
      await testAdmin.save();
      console.log('✅ Test admin created: admin@example.com / Admin123!');
      
    } else {
      console.log(`✅ Found ${users.length} users in database:\n`);
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Admin Status: ${user.adminStatus || 'N/A'}`);
        console.log('');
      });
      
      console.log('🔐 Test login credentials:');
      const regularUser = users.find(u => u.role === 'user' && u.isActive);
      const adminUser = users.find(u => ['admin', 'superadmin'].includes(u.role) && u.isActive);
      
      if (regularUser) {
        console.log(`📱 Regular User: ${regularUser.email} (password may vary)`);
      }
      
      if (adminUser) {
        console.log(`👑 Admin User: ${adminUser.email} (password may vary)`);
      }
      
      if (!regularUser && !adminUser) {
        console.log('⚠️  No active accounts found for testing');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking accounts:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the script
checkTestAccounts();
