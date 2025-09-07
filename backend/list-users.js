import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/excel-analytics');
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'email name role').limit(10);
    console.log('\n📋 Existing users:');
    console.log('='.repeat(50));
    
    if (users.length === 0) {
      console.log('No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listUsers();
