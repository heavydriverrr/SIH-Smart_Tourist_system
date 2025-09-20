// Test script to verify the deployed alert stats endpoint
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const BACKEND_URL = 'https://smart-wanderer-backend.onrender.com';
const TEST_CREDENTIALS = {
  email: 'admin@smartwanderer.com',
  password: 'admin123456'
};

const testAlertStatsEndpoint = async () => {
  try {
    console.log('🔍 Testing deployed alert stats endpoint...');
    console.log(`🌐 Backend URL: ${BACKEND_URL}`);
    
    // Step 1: Login to get admin token
    console.log('\n🔐 Step 1: Admin login...');
    
    const loginResponse = await fetch(`${BACKEND_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_CREDENTIALS)
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success || !loginData.token) {
      throw new Error('Login response invalid or missing token');
    }
    
    console.log('✅ Admin login successful');
    
    // Step 2: Test alert stats endpoint
    console.log('\n📊 Step 2: Testing alert stats endpoint...');
    
    const statsResponse = await fetch(`${BACKEND_URL}/api/alerts/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📈 Response status: ${statsResponse.status}`);
    
    if (!statsResponse.ok) {
      const errorText = await statsResponse.text();
      throw new Error(`Alert stats request failed: ${statsResponse.status} - ${errorText}`);
    }
    
    const statsData = await statsResponse.json();
    
    console.log('✅ Alert stats endpoint working!');
    console.log('📊 Stats data:', JSON.stringify(statsData, null, 2));
    
    // Verify expected structure
    if (statsData.success && statsData.data) {
      const { data } = statsData;
      const expectedFields = ['total_alerts', 'active_alerts', 'resolved_today', 'priority_breakdown'];
      
      const missingFields = expectedFields.filter(field => !(field in data));
      
      if (missingFields.length > 0) {
        console.warn('⚠️ Missing expected fields:', missingFields);
      } else {
        console.log('✅ All expected fields present');
      }
      
      console.log('\n📈 Summary:');
      console.log(`- Total alerts: ${data.total_alerts}`);
      console.log(`- Active alerts: ${data.active_alerts}`);
      console.log(`- Resolved today: ${data.resolved_today}`);
      console.log('- Priority breakdown:', data.priority_breakdown);
    }
    
    return {
      success: true,
      message: 'Alert stats endpoint is working correctly',
      data: statsData
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message,
      message: 'Alert stats endpoint test failed'
    };
  }
};

console.log('🚀 Starting deployed endpoint test...');
testAlertStatsEndpoint()
  .then(result => {
    console.log('\n' + '='.repeat(80));
    if (result.success) {
      console.log('✅ TEST PASSED: Alert stats endpoint is working!');
      console.log('🎯 Your admin portal should now load alert statistics correctly.');
      console.log('🔄 Please refresh your admin portal and check that the stats load without errors.');
    } else {
      console.log('❌ TEST FAILED:', result.message);
      if (result.error) {
        console.log('Error details:', result.error);
      }
      console.log('⏳ The backend might still be deploying. Please wait 2-3 minutes and try again.');
    }
    console.log('='.repeat(80));
  })
  .catch(error => {
    console.error('❌ Test script error:', error);
  });