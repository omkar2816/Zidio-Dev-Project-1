/**
 * Investigate chart data structure to fix data points display
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ChartHistory from './models/ChartHistory.js';
import User from './models/User.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const investigateChartData = async () => {
  try {
    await connectDB();
    
    // Find a real user
    const user = await User.findOne({
      email: { $not: { $regex: 'test|demo', $options: 'i' } },
      isActive: true
    });
    
    if (!user) {
      console.log('❌ No real users found in database');
      return;
    }
    
    console.log('👤 Investigating charts for user:', user.email);
    
    // Find charts for this user
    const charts = await ChartHistory.find({
      user: user._id,
      isActive: true,
      status: 'active'
    }).limit(5);
    
    console.log(`📊 Found ${charts.length} active charts`);
    
    charts.forEach((chart, index) => {
      console.log(`\n📋 Chart ${index + 1}: "${chart.chartTitle}"`);
      console.log('📊 Chart Type:', chart.chartType);
      console.log('📊 Chart ID:', chart.chartId);
      
      // Check all possible data sources
      console.log('\n🔍 Data Structure Analysis:');
      
      // 1. Chart Data
      console.log('💾 chartData exists:', !!chart.chartData);
      if (chart.chartData) {
        console.log('💾 chartData type:', typeof chart.chartData);
        console.log('💾 chartData isArray:', Array.isArray(chart.chartData));
        if (Array.isArray(chart.chartData)) {
          console.log('💾 chartData length:', chart.chartData.length);
          console.log('💾 chartData sample:', chart.chartData.slice(0, 2));
        } else if (typeof chart.chartData === 'object') {
          const keys = Object.keys(chart.chartData);
          console.log('💾 chartData keys count:', keys.length);
          console.log('💾 chartData keys sample:', keys.slice(0, 5));
        }
      }
      
      // 2. Configuration
      console.log('\n⚙️ Configuration Analysis:');
      console.log('⚙️ configuration exists:', !!chart.configuration);
      if (chart.configuration) {
        console.log('⚙️ categories length:', chart.configuration.categories?.length || 0);
        console.log('⚙️ values length:', chart.configuration.values?.length || 0);
        console.log('⚙️ categories sample:', chart.configuration.categories?.slice(0, 3));
        console.log('⚙️ values sample:', chart.configuration.values?.slice(0, 3));
      }
      
      // 3. Data Info
      console.log('\n📈 DataInfo Analysis:');
      console.log('📈 dataInfo exists:', !!chart.dataInfo);
      if (chart.dataInfo) {
        console.log('📈 totalRows:', chart.dataInfo.totalRows);
        console.log('📈 displayedRows:', chart.dataInfo.displayedRows);
        console.log('📈 originalDataRows:', chart.dataInfo.originalDataRows);
      }
      
      // Calculate what the frontend would show
      const frontendCalculation = chart.configuration?.values?.length || chart.dataInfo?.totalRows || 0;
      console.log('\n📊 Frontend Display Logic:');
      console.log('📊 Current calculation result:', frontendCalculation);
      
      // Better calculation
      let betterCount = 0;
      if (chart.configuration?.values?.length) {
        betterCount = chart.configuration.values.length;
        console.log('🎯 Better count (from config values):', betterCount);
      } else if (chart.configuration?.categories?.length) {
        betterCount = chart.configuration.categories.length;
        console.log('🎯 Better count (from config categories):', betterCount);
      } else if (Array.isArray(chart.chartData)) {
        betterCount = chart.chartData.length;
        console.log('🎯 Better count (from chartData array):', betterCount);
      } else if (chart.chartData && typeof chart.chartData === 'object') {
        betterCount = Object.keys(chart.chartData).length;
        console.log('🎯 Better count (from chartData object keys):', betterCount);
      } else if (chart.dataInfo?.totalRows) {
        betterCount = chart.dataInfo.totalRows;
        console.log('🎯 Better count (from dataInfo):', betterCount);
      }
      
      console.log('🔄 Improvement needed:', frontendCalculation !== betterCount);
      console.log('═'.repeat(50));
    });
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

investigateChartData();
