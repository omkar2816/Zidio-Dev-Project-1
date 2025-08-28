import mongoose from 'mongoose';
import User from './models/User.js';
import 'dotenv/config';

const checkSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the superadmin user
    const superAdmin = await User.findOne({ role: 'superadmin' });
    
    if (superAdmin) {
      console.log('Super Admin found:');
      console.log('ID:', superAdmin._id);
      console.log('Name:', superAdmin.firstName, superAdmin.lastName);
      console.log('Email:', superAdmin.email);
      console.log('Role:', superAdmin.role);
      console.log('Admin Status:', superAdmin.adminStatus);
      console.log('Is Active:', superAdmin.isActive);
      console.log('Created:', superAdmin.createdAt);
    } else {
      console.log('No super admin found');
    }

    // Also check for any admin users
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } });
    console.log('\nAll admin users:');
    admins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.role})`);
    });

  } catch (error) {
    console.error('Error checking super admin:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

checkSuperAdmin();
