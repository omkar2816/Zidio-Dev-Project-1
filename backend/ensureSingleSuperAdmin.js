import mongoose from 'mongoose';
import User from './models/User.js';
import 'dotenv/config';

const ensureSingleSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check how many superadmins exist
    const superAdmins = await User.find({ role: 'superadmin' });
    console.log(`Found ${superAdmins.length} superadmin(s)`);

    if (superAdmins.length === 0) {
      console.log('No superadmin found. Creating one...');
      
      const superAdmin = new User({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@excel-analytics.local',
        password: 'SuperAdmin123!',
        role: 'superadmin',
        adminStatus: 'approved'
      });

      await superAdmin.save();
      console.log('Superadmin created successfully!');
      
    } else if (superAdmins.length === 1) {
      console.log('Perfect! Exactly one superadmin exists:');
      console.log(`- ${superAdmins[0].email} (${superAdmins[0].firstName} ${superAdmins[0].lastName})`);
      
    } else {
      console.log('WARNING: Multiple superadmins found! This should not happen.');
      console.log('Superadmins:');
      superAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email} (${admin.firstName} ${admin.lastName})`);
      });
      
      // Optionally, you could demote extras to regular admin here
      console.log('\nTo maintain single superadmin policy, consider demoting extras to admin role.');
    }

    // Show all admin users
    const allAdmins = await User.find({ 
      role: { $in: ['admin', 'superadmin'] } 
    }).select('firstName lastName email role adminStatus');
    
    console.log('\nAll admin users:');
    allAdmins.forEach(admin => {
      const roleDisplay = admin.role === 'superadmin' ? 'SUPER ADMIN' : 'Admin';
      console.log(`- ${admin.email} (${admin.firstName} ${admin.lastName}) - ${roleDisplay} [${admin.adminStatus}]`);
    });

    // Show regular users count
    const userCount = await User.countDocuments({ role: 'user' });
    console.log(`\nRegular users: ${userCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

ensureSingleSuperAdmin();
