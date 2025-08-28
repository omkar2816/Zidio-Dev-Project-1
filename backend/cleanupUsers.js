import mongoose from 'mongoose';
import User from './models/User.js';
import 'dotenv/config';

const cleanupUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove the hardcoded admin user (keep only superadmin)
    const hardcodedAdminEmail = 'admin@excel-analytics.local';
    const hardcodedAdmin = await User.findOne({ email: hardcodedAdminEmail });
    
    if (hardcodedAdmin) {
      console.log(`Found hardcoded admin: ${hardcodedAdmin.email}`);
      console.log(`Role: ${hardcodedAdmin.role}, Status: ${hardcodedAdmin.adminStatus}`);
      
      // Only delete if it's the hardcoded admin (not user-requested admin)
      if (hardcodedAdmin.adminStatus !== 'approved' || hardcodedAdmin.role === 'admin') {
        await User.deleteOne({ email: hardcodedAdminEmail });
        console.log('✅ Removed hardcoded admin user');
      } else {
        console.log('⚠️  Keeping admin user as it appears to be legitimately approved');
      }
    } else {
      console.log('✅ No hardcoded admin found');
    }

    // Verify superadmin exists
    const superadmin = await User.findOne({ role: 'superadmin' });
    if (superadmin) {
      console.log(`✅ Superadmin exists: ${superadmin.email}`);
    } else {
      console.log('❌ No superadmin found! Creating one...');
      
      const newSuperadmin = new User({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@excel-analytics.local',
        password: 'SuperAdmin123!',
        role: 'superadmin',
        adminStatus: 'approved'
      });
      
      await newSuperadmin.save();
      console.log('✅ Superadmin created');
    }

    // Show final user breakdown
    const users = await User.find({}).select('firstName lastName email role adminStatus');
    console.log('\n📊 Final user breakdown:');
    console.log('='.repeat(50));
    
    const breakdown = {
      superadmin: users.filter(u => u.role === 'superadmin'),
      admin: users.filter(u => u.role === 'admin'),
      user: users.filter(u => u.role === 'user')
    };
    
    console.log(`🔴 Super Admins (${breakdown.superadmin.length}):`);
    breakdown.superadmin.forEach(u => {
      console.log(`  - ${u.firstName} ${u.lastName} (${u.email}) [${u.adminStatus}]`);
    });
    
    console.log(`🟣 Regular Admins (${breakdown.admin.length}):`);
    breakdown.admin.forEach(u => {
      console.log(`  - ${u.firstName} ${u.lastName} (${u.email}) [${u.adminStatus}]`);
    });
    
    console.log(`🔵 Users (${breakdown.user.length}):`);
    breakdown.user.forEach(u => {
      console.log(`  - ${u.firstName} ${u.lastName} (${u.email})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

cleanupUsers();
