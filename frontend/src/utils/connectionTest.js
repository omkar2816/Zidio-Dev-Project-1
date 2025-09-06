// Simple connection test utility
// This file can be run to test backend connectivity

import axios from '../config/axios.js';

const testConnection = async () => {
  console.log('🔗 Testing backend connection...');
  
  try {
    // Test health endpoint
    const healthResponse = await axios.get('/api/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test auth endpoint (this might fail if not logged in, which is expected)
    try {
      const authResponse = await axios.get('/api/auth/me');
      console.log('✅ Auth check:', authResponse.status);
    } catch (authError) {
      console.log('⚠️ Auth check failed (expected if not logged in):', authError.response?.status);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', {
      status: error.response?.status,
      message: error.message,
      code: error.code
    });
    return false;
  }
};

// Run test if called directly
if (typeof window !== 'undefined') {
  window.testConnection = testConnection;
}

export default testConnection;
