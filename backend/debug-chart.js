import mongoose from 'mongoose';
import ChartHistory from './models/ChartHistory.js';

mongoose.connect('mongodb://127.0.0.1:27017/excelAnalytics')
  .then(async () => {
    console.log('Connected to MongoDB');
    const sample = await ChartHistory.findOne().lean();
    if (sample) {
      console.log('Sample chart data:');
      console.log(JSON.stringify(sample, null, 2));
    } else {
      console.log('No chart data found in database');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
