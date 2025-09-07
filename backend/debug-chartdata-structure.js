import mongoose from 'mongoose';
import ChartHistory from './models/ChartHistory.js';

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/zidio-dev', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  analyzeChartDataStructure();
}).catch(error => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

async function analyzeChartDataStructure() {
  try {
    console.log('🔍 Analyzing chartData structure...\n');
    
    const charts = await ChartHistory.find({}).limit(3);
    
    for (const [index, chart] of charts.entries()) {
      console.log(`📊 Chart ${index + 1}: "${chart.chartTitle}"`);
      console.log('   ID:', chart._id);
      
      // Analyze chartData
      console.log('   chartData analysis:');
      console.log('   - Type:', typeof chart.chartData);
      console.log('   - Constructor:', chart.chartData?.constructor?.name);
      console.log('   - Is Array:', Array.isArray(chart.chartData));
      console.log('   - Length/Size:', chart.chartData?.length || Object.keys(chart.chartData || {}).length);
      
      if (chart.chartData) {
        if (Array.isArray(chart.chartData)) {
          console.log('   - First item type:', typeof chart.chartData[0]);
          console.log('   - First item:', chart.chartData[0]);
        } else {
          console.log('   - Keys:', Object.keys(chart.chartData).slice(0, 10));
          console.log('   - First key value:', chart.chartData[Object.keys(chart.chartData)[0]]);
        }
      }
      
      // Analyze configuration
      console.log('   configuration.values:');
      console.log('   - Type:', typeof chart.configuration?.values);
      console.log('   - Is Array:', Array.isArray(chart.configuration?.values));
      console.log('   - Length:', chart.configuration?.values?.length);
      if (chart.configuration?.values?.length > 0) {
        console.log('   - First value:', chart.configuration.values[0]);
      }
      
      // Analyze dataInfo
      console.log('   dataInfo:');
      console.log('   - totalRows:', chart.dataInfo?.totalRows);
      console.log('   - displayedRows:', chart.dataInfo?.displayedRows);
      
      console.log(''); // Empty line for readability
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error analyzing chart data:', error);
    process.exit(1);
  }
}
