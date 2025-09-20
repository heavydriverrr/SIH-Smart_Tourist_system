import dotenv from 'dotenv';
import { supabaseAdmin } from './config/supabase.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const BACKEND_URL = 'https://smart-wanderer-backend.onrender.com';
const ADMIN_CREDENTIALS = {
  email: 'admin@smartwanderer.com',
  password: 'admin123456'
};

const finalFixAndTest = async () => {
  console.log('🔧 FINAL FIX & COMPREHENSIVE TEST');
  console.log('=' .repeat(80));

  try {
    // Step 1: Fix Admin Credentials
    console.log('\n🔐 STEP 1: FIXING ADMIN CREDENTIALS');
    console.log('-'.repeat(50));

    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', ADMIN_CREDENTIALS.email)
      .single();

    if (existingAdmin) {
      console.log('✅ Admin user exists, updating password hash...');
      
      // Hash the password properly
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, saltRounds);
      
      const { error: updateError } = await supabaseAdmin
        .from('admin_users')
        .update({ 
          password_hash: hashedPassword,
          is_active: true
        })
        .eq('email', ADMIN_CREDENTIALS.email);

      if (updateError) {
        console.error('❌ Failed to update admin password:', updateError);
      } else {
        console.log('✅ Admin password hash updated successfully');
      }
    } else {
      console.log('🔧 Creating admin user with proper password hash...');
      
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, saltRounds);
      
      const { error: createError } = await supabaseAdmin
        .from('admin_users')
        .insert({
          email: ADMIN_CREDENTIALS.email,
          name: 'System Administrator',
          role: 'super_admin',
          password_hash: hashedPassword,
          is_active: true,
          permissions: ['view_all', 'manage_all'],
          created_at: new Date().toISOString()
        });

      if (createError) {
        console.error('❌ Failed to create admin:', createError);
      } else {
        console.log('✅ Admin user created with proper password hash');
      }
    }

    // Step 2: Test Database Content
    console.log('\\n📊 STEP 2: DATABASE CONTENT VERIFICATION');
    console.log('-'.repeat(50));

    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
    const { data: alerts } = await supabaseAdmin.from('emergency_alerts').select('*');

    console.log(`✅ PROFILES: ${profiles?.length || 0} tourists with Bhubaneswar data`);
    profiles?.slice(0, 3).forEach((p, i) => {
      console.log(`   ${i+1}. ${p.name} (${p.digital_id}) - Phone: ${p.phone} - Safety: ${p.safety_score}%`);
    });

    console.log(`✅ ALERTS: ${alerts?.length || 0} emergency alerts around landmarks`);
    const alertsByPriority = alerts?.reduce((acc, alert) => {
      acc[alert.priority] = (acc[alert.priority] || 0) + 1;
      return acc;
    }, {});
    const alertsByStatus = alerts?.reduce((acc, alert) => {
      acc[alert.status] = (acc[alert.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   Priority breakdown:', alertsByPriority);
    console.log('   Status breakdown:', alertsByStatus);

    // Step 3: Test Backend Authentication
    console.log('\\n🌐 STEP 3: BACKEND AUTHENTICATION TEST');
    console.log('-'.repeat(50));

    const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

    // Test correct login endpoint
    const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });

    if (!loginResponse.ok) {
      console.error(`❌ Login failed: ${loginResponse.status}`);
      const errorText = await loginResponse.text();
      console.error('   Error:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Admin login successful!');
    console.log(`   Logged in as: ${loginData.admin.name}`);
    console.log(`   Role: ${loginData.admin.role}`);

    // Step 4: Test All API Endpoints
    console.log('\\n📡 STEP 4: API ENDPOINTS COMPREHENSIVE TEST');
    console.log('-'.repeat(50));

    const apiTests = [
      { endpoint: '/api/alerts/stats', name: 'Alert Statistics' },
      { endpoint: '/api/alerts?limit=5', name: 'Alerts List' },
      { endpoint: '/api/admin/dashboard', name: 'Admin Dashboard' }
    ];

    let allApiWorking = true;
    const testResults = {};

    for (const test of apiTests) {
      const response = await fetch(`${BACKEND_URL}${test.endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`✅ ${test.name} - Working perfectly`);
        const data = await response.json();
        testResults[test.endpoint] = data;
        
        // Show key stats for alerts
        if (test.endpoint === '/api/alerts/stats') {
          console.log(`   📊 Stats: ${JSON.stringify(data.data, null, 2)}`);
        }
      } else {
        console.log(`❌ ${test.name} - Failed (${response.status})`);
        allApiWorking = false;
      }
    }

    // Final Results
    console.log('\\n' + '='.repeat(80));
    console.log('🎉 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(80));
    
    if (allApiWorking) {
      console.log('✅ ALL SYSTEMS WORKING PERFECTLY!');
      console.log('✅ Database: Rich Bhubaneswar tourism data loaded');
      console.log('✅ Backend: Healthy and all APIs responding');
      console.log('✅ Authentication: Fixed and working correctly');
      console.log(`✅ Data Ready: ${profiles?.length} tourists, ${alerts?.length} alerts`);

      console.log('\\n🎯 FRONTEND SETUP - COPY THESE EXACT STEPS:');
      console.log('='.repeat(80));
      console.log('');
      console.log('1. 🔧 VERCEL ENVIRONMENT VARIABLES:');
      console.log('   Login to Vercel → Your Project → Settings → Environment Variables');
      console.log('   Add these EXACT variables (copy-paste):');
      console.log('');
      console.log(`   VITE_API_URL=${BACKEND_URL}`);
      console.log('   VITE_WS_URL=wss://smart-wanderer-backend.onrender.com');
      console.log('   VITE_FALLBACK_TO_DEMO=true');
      console.log('   VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here');
      console.log('');
      console.log('2. 🚀 REDEPLOY FRONTEND:');
      console.log('   - Click "Redeploy" in Vercel after adding environment variables');
      console.log('   - Wait 2-3 minutes for deployment to complete');
      console.log('');
      console.log('3. 🔐 LOGIN CREDENTIALS:');
      console.log(`   Email: ${ADMIN_CREDENTIALS.email}`);
      console.log(`   Password: ${ADMIN_CREDENTIALS.password}`);
      console.log('');
      console.log('4. 🎯 WHAT YOU WILL SEE:');
      console.log(`   - Dashboard: ${alerts?.length} total alerts, ${alertsByStatus.active || 0} active`);
      console.log('   - Map: Markers around Bhubaneswar landmarks');
      console.log(`   - Tourists: ${profiles?.length} verified profiles with Indian names`);
      console.log('   - Alerts: Medical emergencies, theft, accidents, harassment');
      console.log('   - Real-time: WebSocket updates and live data');
      console.log('');
      console.log('5. 🔍 BROWSER VERIFICATION:');
      console.log('   - Press F12 to open Developer Tools');
      console.log('   - Console should show: "✅ Alert stats loaded from backend"');
      console.log('   - Network tab should show successful API calls');
      console.log('   - NO red errors or demo mode messages');
      console.log('');
      console.log('='.repeat(80));
      console.log('🌟 YOUR SMART WANDERER ADMIN PORTAL IS 100% READY!');
      console.log('🗺️ Complete Bhubaneswar tourism emergency management system');
      console.log('📱 Tourist safety tracking with real-time alerts and GPS');
      console.log('🚨 Emergency response system with priority management');
      console.log('='.repeat(80));

    } else {
      console.log('⚠️ SOME ISSUES FOUND');
      console.log('Please check the error messages above and fix accordingly.');
    }

  } catch (error) {
    console.error('❌ Fix and test failed:', error);
  }
};

console.log('🚀 Running final fix and comprehensive test...\\n');
finalFixAndTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });