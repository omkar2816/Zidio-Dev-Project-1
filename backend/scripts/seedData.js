import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import UploadedFile from '../models/UploadedFile.js';
import UserActivity from '../models/UserActivity.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/excelAnalytics');
    console.log('Connected to MongoDB');

    // Check if we should clear and reseed data
    const existingUserCount = await User.countDocuments();
    const hasGenericUsers = await User.findOne({ 
      firstName: { $regex: /^User\d+$/ } 
    });
    
    if (existingUserCount > 10 && !hasGenericUsers) {
      console.log('Realistic data already exists, skipping seeding');
      process.exit(0);
    }
    
    // Clear existing generic data if found
    if (hasGenericUsers) {
      console.log('Clearing existing generic sample data...');
      await UserActivity.deleteMany({ 'metadata.source': 'seeded_data' });
      await UploadedFile.deleteMany({ originalName: { $regex: /^sample_data_\d+\.xlsx$/ } });
      await User.deleteMany({ firstName: { $regex: /^User\d+$/ } });
      console.log('Generic data cleared');
    }

    console.log('Seeding sample data...');

    // Realistic names for sample users
    const firstNames = [
      'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
      'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
      'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
      'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra', 'Donald', 'Donna',
      'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Michelle',
      'Kenneth', 'Laura', 'Kevin', 'Sarah', 'Brian', 'Kimberly', 'George', 'Deborah',
      'Edward', 'Dorothy', 'Ronald', 'Lisa', 'Timothy', 'Nancy', 'Jason', 'Karen'
    ];

    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
      'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
      'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
      'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
      'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
      'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker'
    ];

    const companies = [
      'techcorp', 'innovate', 'dataworks', 'analytics', 'insights', 'solutions',
      'systems', 'digital', 'consulting', 'enterprises', 'ventures', 'labs'
    ];

    // Create sample users (only if not exists)
    const sampleUsers = [];
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      
      const user = new User({
        firstName: firstName,
        lastName: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company}.com`,
        password: 'password123',
        role: i % 10 === 0 ? 'admin' : 'user',
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date in last 90 days
        lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
      });
      sampleUsers.push(user);
    }

    const savedUsers = await User.insertMany(sampleUsers);
    console.log(`Created ${savedUsers.length} sample users`);

    // Realistic file names for data analysis
    const fileNameTemplates = [
      'Q{quarter}_Sales_Report_2024.xlsx',
      'Monthly_Revenue_Analysis_{month}.xlsx',
      'Customer_Demographics_Study.xlsx',
      'Product_Performance_Metrics.xlsx',
      'Marketing_Campaign_Results.xlsx',
      'Employee_Productivity_Data.xlsx',
      'Financial_Summary_{year}.xlsx',
      'Inventory_Management_Report.xlsx',
      'User_Engagement_Analytics.xlsx',
      'Budget_Forecast_Analysis.xlsx',
      'Market_Research_Data.xlsx',
      'Operational_KPIs_Dashboard.xlsx',
      'Survey_Response_Analysis.xlsx',
      'Web_Traffic_Statistics.xlsx',
      'Supply_Chain_Metrics.xlsx'
    ];

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const years = ['2023', '2024', '2025'];

    // Create sample uploaded files
    const sampleFiles = [];
    for (let i = 0; i < 200; i++) {
      const randomUser = savedUsers[Math.floor(Math.random() * savedUsers.length)];
      const template = fileNameTemplates[Math.floor(Math.random() * fileNameTemplates.length)];
      
      // Replace placeholders in file names
      let fileName = template
        .replace('{quarter}', quarters[Math.floor(Math.random() * quarters.length)])
        .replace('{month}', months[Math.floor(Math.random() * months.length)])
        .replace('{year}', years[Math.floor(Math.random() * years.length)]);
      
      // Add variation for duplicate file names
      if (Math.random() > 0.7) {
        fileName = fileName.replace('.xlsx', `_v${Math.floor(Math.random() * 5) + 1}.xlsx`);
      }
      
      const file = new UploadedFile({
        user: randomUser._id,
        originalName: fileName,
        storedName: `${Date.now()}-${fileName}`,
        size: Math.floor(Math.random() * 1000000) + 10000, // Random size between 10KB and 1MB
        fileData: Buffer.from('sample data'),
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        parsedData: {
          sheets: { 'Sheet1': { headers: ['A', 'B', 'C'], data: [] } },
          sheetNames: ['Sheet1'],
          totalSheets: 1
        },
        uploadedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000) // Random date in last 60 days
      });
      sampleFiles.push(file);
    }

    const savedFiles = await UploadedFile.insertMany(sampleFiles);
    console.log(`Created ${savedFiles.length} sample files`);

    // Create sample user activities
    const activityTypes = ['file_upload', 'data_analysis', 'chart_generation', 'data_export', 'login', 'logout'];
    const activityDescriptions = {
      'file_upload': [
        'Uploaded quarterly sales report for analysis',
        'Imported customer database for processing',
        'Added new financial data spreadsheet',
        'Uploaded marketing campaign results',
        'Imported inventory management data'
      ],
      'data_analysis': [
        'Performed statistical analysis on revenue data',
        'Generated correlation analysis for customer metrics',
        'Executed trend analysis on quarterly performance',
        'Analyzed customer segmentation patterns',
        'Conducted predictive analysis on sales forecasts'
      ],
      'chart_generation': [
        'Created bar chart for monthly revenue comparison',
        'Generated pie chart for market share analysis',
        'Built line chart for growth trend visualization',
        'Designed scatter plot for correlation analysis',
        'Created dashboard with multiple chart types'
      ],
      'data_export': [
        'Exported analysis results to PDF report',
        'Downloaded processed data as Excel file',
        'Generated CSV export for external system',
        'Exported visualization as PNG image',
        'Created PowerPoint presentation from charts'
      ],
      'login': [
        'User logged into analytics platform',
        'Successful authentication to dashboard',
        'Accessed platform via web interface',
        'Mobile app login completed',
        'SSO authentication successful'
      ],
      'logout': [
        'User logged out of platform',
        'Session ended successfully',
        'Secure logout completed',
        'Platform session terminated',
        'User disconnected from system'
      ]
    };
    
    const sampleActivities = [];
    
    for (let i = 0; i < 1000; i++) {
      const randomUser = savedUsers[Math.floor(Math.random() * savedUsers.length)];
      const randomFile = savedFiles[Math.floor(Math.random() * savedFiles.length)];
      const randomActivityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const descriptions = activityDescriptions[randomActivityType];
      const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
      
      const activity = new UserActivity({
        user: randomUser._id,
        activityType: randomActivityType,
        description: randomDescription,
        fileId: Math.random() > 0.5 ? randomFile._id : undefined,
        fileName: Math.random() > 0.5 ? randomFile.originalName : undefined,
        metadata: { source: 'platform_activity', browser: 'Chrome/118.0' },
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        performedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date in last 90 days
      });
      sampleActivities.push(activity);
    }

    const savedActivities = await UserActivity.insertMany(sampleActivities);
    console.log(`Created ${savedActivities.length} sample activities`);

    console.log('Data seeding completed successfully!');
    
    // Show summary
    const userCount = await User.countDocuments();
    const fileCount = await UploadedFile.countDocuments();
    const activityCount = await UserActivity.countDocuments();
    
    console.log('Database Summary:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Files: ${fileCount}`);
    console.log(`- Activities: ${activityCount}`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

seedData();
