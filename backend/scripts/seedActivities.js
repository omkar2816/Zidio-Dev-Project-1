import mongoose from 'mongoose';
import User from '../models/User.js';
import UserActivity from '../models/UserActivity.js';
import { ACTIVITY_TYPES } from '../utils/activityLogger.js';

const seedActivities = async () => {
  try {
    console.log('Seeding sample activities...');

    // Get all regular users
    const users = await User.find({ role: 'user' });
    
    if (users.length === 0) {
      console.log('No users found. Please register some users first.');
      return;
    }

    const activities = [];
    const now = new Date();

    // Generate activities for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Random number of activities per day (0-10)
      const activitiesPerDay = Math.floor(Math.random() * 11);

      for (let j = 0; j < activitiesPerDay; j++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const activityTypes = Object.values(ACTIVITY_TYPES);
        const randomActivityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];

        // Create random timestamp for this day
        const randomTime = new Date(date);
        randomTime.setHours(Math.floor(Math.random() * 24));
        randomTime.setMinutes(Math.floor(Math.random() * 60));

        let description = '';
        let metadata = {};

        switch (randomActivityType) {
          case ACTIVITY_TYPES.LOGIN:
            description = 'User logged in successfully';
            break;
          case ACTIVITY_TYPES.FILE_UPLOAD:
            description = `Uploaded file: sample_data_${Math.floor(Math.random() * 100)}.xlsx`;
            metadata = { fileSize: Math.floor(Math.random() * 5000000), sheets: Math.floor(Math.random() * 5) + 1 };
            break;
          case ACTIVITY_TYPES.CHART_GENERATION:
            description = `Generated ${['bar', 'line', 'pie', '3D'][Math.floor(Math.random() * 4)]} chart`;
            metadata = { chartType: ['bar', 'line', 'pie', '3D'][Math.floor(Math.random() * 4)] };
            break;
          case ACTIVITY_TYPES.DASHBOARD_VIEW:
            description = 'Viewed analytics dashboard';
            break;
          case ACTIVITY_TYPES.DATA_EXPORT:
            description = 'Exported chart data';
            metadata = { format: ['PDF', 'PNG', 'XLSX'][Math.floor(Math.random() * 3)] };
            break;
          case ACTIVITY_TYPES.PROFILE_UPDATE:
            description = 'Updated profile information';
            break;
          default:
            description = `Performed ${randomActivityType} action`;
        }

        activities.push({
          user: randomUser._id,
          activityType: randomActivityType,
          description,
          metadata,
          timestamp: randomTime,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
      }
    }

    // Insert all activities
    await UserActivity.insertMany(activities);
    console.log(`Successfully seeded ${activities.length} sample activities`);

  } catch (error) {
    console.error('Error seeding activities:', error);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Connect to MongoDB
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/excel-analytics';
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      return seedActivities();
    })
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedActivities;
