const mongoose = require('mongoose');
require('./models/ChartHistory');

mongoose.connect('mongodb://127.0.0.1:27017/excel-analytics')
  .then(() => {
    console.log('Connected to MongoDB');
    return mongoose.connection.db.collection('charthistories').findOne({});
  })
  .then(chart => {
    if (chart) {
      console.log('📊 Found chart:', {
        chartId: chart.chartId,
        title: chart.chartTitle,
        type: chart.chartType,
        hasData: !!chart.chartData,
        dataLength: chart.chartData?.length,
        hasConfig: !!chart.configuration,
        createdAt: chart.createdAt
      });
      
      // Show sample data structure
      if (chart.chartData && chart.chartData.length > 0) {
        console.log('📊 Sample chart data:', chart.chartData[0]);
      }
      
      if (chart.configuration) {
        console.log('📊 Configuration keys:', Object.keys(chart.configuration));
      }
      
      console.log('✅ Chart data structure looks good for viewing');
    } else {
      console.log('❌ No charts found in database');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });