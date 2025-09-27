const mongoose = require('mongoose');
require('./models/ChartHistory');

mongoose.connect('mongodb://127.0.0.1:27017/excel-analytics')
  .then(async () => {
    console.log('Connected to MongoDB');
    const charts = await mongoose.connection.db.collection('charthistories').find({}).limit(5).toArray();
    console.log('📊 Found', charts.length, 'charts in database');
    
    if (charts.length > 0) {
      const chart = charts[0];
      console.log('\n🔍 First chart detailed structure:');
      console.log('- Chart ID:', chart.chartId);
      console.log('- Title:', chart.chartTitle);
      console.log('- Type:', chart.chartType);
      console.log('- User ID:', chart.userId);
      console.log('- Created:', chart.createdAt);
      console.log('- Has chartData:', !!chart.chartData, '(length:', chart.chartData?.length, ')');
      console.log('- Has configuration:', !!chart.configuration);
      
      if (chart.chartData && chart.chartData.length > 0) {
        console.log('\n📊 Sample chart data:');
        console.log(JSON.stringify(chart.chartData[0], null, 2));
      }
      
      if (chart.configuration) {
        console.log('\n⚙️ Configuration keys:', Object.keys(chart.configuration));
        console.log('Configuration sample:', JSON.stringify(chart.configuration, null, 2).substring(0, 200) + '...');
      }
      
      // Test all charts
      console.log('\n📋 All charts summary:');
      charts.forEach((c, i) => {
        console.log(`${i + 1}. ${c.chartTitle} (${c.chartType}) - Data: ${c.chartData?.length || 0} points`);
      });
      
    } else {
      console.log('❌ No charts found - this might be the issue!');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database error:', err);
    process.exit(1);
  });