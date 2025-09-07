import mongoose from 'mongoose';
import User from './models/User.js';
import UserActivity from './models/UserActivity.js';
import UploadedFile from './models/UploadedFile.js';
import ChartHistory from './models/ChartHistory.js';

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/excel-analytics', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const populateAnalyticsData = async () => {
  try {
    console.log('🌱 Starting analytics data population...');

    // Get existing users
    const users = await User.find().limit(10);
    if (users.length === 0) {
      console.log('❌ No users found. Please create some users first.');
      return;
    }

    console.log(`📊 Found ${users.length} users to work with`);

    // Activity types to simulate
    const activityTypes = [
      'file_upload',
      'chart_generation', 
      'chart_save',
      'data_analysis',
      'data_export',
      'login',
      'logout'
    ];

    // Generate historical activities (last 90 days)
    const activities = [];
    const now = new Date();
    
    for (let day = 0; day < 90; day++) {
      const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
      
      // Generate 5-20 activities per day
      const dailyActivities = Math.floor(Math.random() * 15) + 5;
      
      for (let i = 0; i < dailyActivities; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        
        // Random time during the day
        const activityTime = new Date(date);
        activityTime.setHours(Math.floor(Math.random() * 24));
        activityTime.setMinutes(Math.floor(Math.random() * 60));
        
        let description = '';
        const metadata = {};
        
        switch (activityType) {
          case 'file_upload':
            description = `Uploaded file: sample_data_${Math.floor(Math.random() * 100)}.xlsx`;
            metadata.fileSize = Math.floor(Math.random() * 10000000) + 100000; // 100KB to 10MB
            break;
          case 'chart_generation':
            const chartTypes = ['bar', 'line', 'pie', 'scatter', 'area'];
            const chartType = chartTypes[Math.floor(Math.random() * chartTypes.length)];
            description = `Generated ${chartType} chart: ${chartType} Analysis Chart`;
            metadata.chartType = chartType;
            metadata.dataPoints = Math.floor(Math.random() * 1000) + 10;
            break;
          case 'chart_save':
            description = `Saved chart: Analytics Chart ${Math.floor(Math.random() * 100)}`;
            metadata.chartId = `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            break;
          case 'data_analysis':
            description = `Performed comprehensive analysis on ${Math.floor(Math.random() * 5000) + 100} rows`;
            metadata.totalRows = Math.floor(Math.random() * 5000) + 100;
            metadata.totalColumns = Math.floor(Math.random() * 50) + 5;
            break;
          case 'data_export':
            const formats = ['CSV', 'JSON', 'XLSX'];
            const format = formats[Math.floor(Math.random() * formats.length)];
            description = `Exported data in ${format} format`;
            metadata.format = format;
            break;
          case 'login':
            description = 'User logged in';
            break;
          case 'logout':
            description = 'User logged out';
            break;
        }
        
        activities.push({
          user: user._id,
          activityType,
          description,
          metadata,
          performedAt: activityTime,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
      }
    }

    // Insert activities in batches
    console.log(`📝 Inserting ${activities.length} activities...`);
    await UserActivity.insertMany(activities);

    // Generate some uploaded files
    const files = [];
    for (let i = 0; i < 50; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const uploadDate = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      
      files.push({
        user: user._id,
        originalName: `sample_data_${i + 1}.xlsx`,
        storedName: `${Date.now()}_sample_data_${i + 1}.xlsx`,
        size: Math.floor(Math.random() * 10000000) + 100000,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedAt: uploadDate,
        lastAccessed: uploadDate,
        accessCount: Math.floor(Math.random() * 20) + 1,
        fileData: Buffer.from('mock file data'),
        parsedData: {
          sheets: { 'Sheet1': { headers: ['Column1', 'Column2'], data: [] } },
          sheetNames: ['Sheet1']
        }
      });
    }

    console.log(`📁 Inserting ${files.length} file records...`);
    await UploadedFile.insertMany(files);

    // Generate some chart history
    const charts = [];
    const chartTypes = ['bar', 'line', 'pie', 'scatter', 'area', 'doughnut'];
    
    for (let i = 0; i < 100; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const chartType = chartTypes[Math.floor(Math.random() * chartTypes.length)];
      const createdDate = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      
      charts.push({
        user: user._id,
        chartId: `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chartTitle: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Analysis Chart ${i + 1}`,
        chartType,
        sourceFileName: `data_source_${Math.floor(Math.random() * 20) + 1}.xlsx`,
        sourceSheet: 'Sheet1',
        configuration: {
          chartType,
          categories: ['Category A', 'Category B', 'Category C'],
          values: [Math.random() * 100, Math.random() * 100, Math.random() * 100],
          colorScheme: 'blue'
        },
        chartData: [
          { name: 'Category A', value: Math.random() * 100 },
          { name: 'Category B', value: Math.random() * 100 },
          { name: 'Category C', value: Math.random() * 100 }
        ],
        createdAt: createdDate,
        lastModified: createdDate,
        accessTracking: {
          viewCount: Math.floor(Math.random() * 50),
          lastViewed: createdDate
        },
        status: 'active',
        isActive: true
      });
    }

    console.log(`📊 Inserting ${charts.length} chart records...`);
    await ChartHistory.insertMany(charts);

    console.log('✅ Analytics data population completed!');
    console.log(`📊 Summary:`);
    console.log(`   - ${activities.length} user activities`);
    console.log(`   - ${files.length} file uploads`);
    console.log(`   - ${charts.length} charts`);
    console.log(`   - Data spans last 90 days`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating analytics data:', error);
    process.exit(1);
  }
};

populateAnalyticsData();
