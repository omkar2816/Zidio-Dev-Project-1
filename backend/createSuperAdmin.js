import mongoose from 'mongoose';
import User from './models/User.js';
import 'dotenv/config';

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Create superadmin user
    const superAdmin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@excel-analytics.local',
      password: 'SuperAdmin123!',
      role: 'superadmin',
      adminStatus: 'approved'
    });

    await superAdmin.save();
    console.log('Super admin created successfully!');
    console.log('Email: superadmin@excel-analytics.local');
    console.log('Password: SuperAdmin123!');

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

createSuperAdmin();
