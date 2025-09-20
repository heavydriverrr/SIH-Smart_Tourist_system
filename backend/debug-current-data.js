import dotenv from 'dotenv';
import { supabaseAdmin } from './config/supabase.js';

dotenv.config();

const debugCurrentData = async () => {
  try {
    console.log('🔍 Checking current database state...\n');

    // Check profiles
    console.log('👥 PROFILES TABLE:');
    console.log('==================');
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(10);

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
    } else {
      console.log(`✅ Found ${profiles?.length || 0} profiles:`);
      profiles?.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.name || 'No name'} (ID: ${profile.digital_id || 'No ID'}) - Safety: ${profile.safety_score || 'N/A'}`);
        console.log(`   Phone: ${profile.phone || 'No phone'} | Emergency: ${profile.emergency_contact || 'No emergency contact'}`);
        console.log(`   Verified: ${profile.is_verified ? 'Yes' : 'No'} | Created: ${profile.created_at}`);
        console.log('');
      });
    }

    // Check emergency alerts
    console.log('\n🚨 EMERGENCY ALERTS TABLE:');
    console.log('===========================');
    const { data: alerts, error: alertError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('*')
      .limit(15);

    if (alertError) {
      console.error('❌ Error fetching alerts:', alertError);
    } else {
      console.log(`✅ Found ${alerts?.length || 0} emergency alerts:`);
      alerts?.forEach((alert, index) => {
        console.log(`${index + 1}. ${alert.message}`);
        console.log(`   Priority: ${alert.priority} | Status: ${alert.status}`);
        console.log(`   Location: ${alert.latitude}, ${alert.longitude}`);
        console.log(`   User ID: ${alert.user_id}`);
        console.log(`   Created: ${alert.created_at}`);
        console.log('');
      });
    }

    // Check alert stats (what the admin portal uses)
    console.log('\n📊 ALERT STATISTICS (Admin Portal Data):');
    console.log('==========================================');
    try {
      const { data: totalAlerts } = await supabaseAdmin
        .from('emergency_alerts')
        .select('id');

      const { data: activeAlerts } = await supabaseAdmin
        .from('emergency_alerts')
        .select('id')
        .eq('status', 'active');

      const today = new Date().toISOString().split('T')[0];
      const { data: resolvedToday } = await supabaseAdmin
        .from('emergency_alerts')
        .select('id')
        .eq('status', 'resolved')
        .gte('created_at', today);

      const { data: priorityStats } = await supabaseAdmin
        .from('emergency_alerts')
        .select('priority')
        .eq('status', 'active');

      const stats = {
        total_alerts: totalAlerts?.length || 0,
        active_alerts: activeAlerts?.length || 0,
        resolved_today: resolvedToday?.length || 0,
        priority_breakdown: {
          low: priorityStats?.filter(a => a.priority === 'low').length || 0,
          medium: priorityStats?.filter(a => a.priority === 'medium').length || 0,
          high: priorityStats?.filter(a => a.priority === 'high').length || 0,
          critical: priorityStats?.filter(a => a.priority === 'critical').length || 0
        }
      };

      console.log('📈 Current Statistics:');
      console.log(JSON.stringify(stats, null, 2));
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }

    // Check if backend is accessible
    console.log('\n🌐 BACKEND CONNECTION TEST:');
    console.log('============================');
    try {
      const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
      const response = await fetch('https://smart-wanderer-backend.onrender.com/health');
      const health = await response.json();
      console.log('✅ Backend is accessible:', health);
    } catch (error) {
      console.error('❌ Backend connection error:', error.message);
    }

    // Test admin login
    console.log('\n🔐 ADMIN LOGIN TEST:');
    console.log('====================');
    try {
      const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
      const loginResponse = await fetch('https://smart-wanderer-backend.onrender.com/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@smartwanderer.com',
          password: 'admin123456'
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Admin login successful');
        
        // Test alert stats endpoint
        const statsResponse = await fetch('https://smart-wanderer-backend.onrender.com/api/alerts/stats', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('✅ Alert stats API working:', statsData);
        } else {
          console.error('❌ Alert stats API failed:', statsResponse.status);
        }
      } else {
        console.error('❌ Admin login failed:', loginResponse.status);
      }
    } catch (error) {
      console.error('❌ Admin login test error:', error.message);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 TROUBLESHOOTING SUGGESTIONS:');
    console.log('='.repeat(80));
    console.log('1. If you see data above but not in admin portal:');
    console.log('   - Clear your browser cache');
    console.log('   - Hard refresh the admin portal (Ctrl+F5)');
    console.log('   - Check browser console for JavaScript errors');
    console.log('');
    console.log('2. If you see no alerts or profiles:');
    console.log('   - Run the seeding script again: npm run seed-bhubaneswar');
    console.log('   - Check that the database connection is working');
    console.log('');
    console.log('3. If backend is not accessible:');
    console.log('   - Wait for deployment to complete (2-3 minutes)');
    console.log('   - Check Render dashboard for deployment status');
    console.log('');
    console.log('4. Check admin portal environment variables:');
    console.log('   - Ensure VITE_API_URL is set to https://smart-wanderer-backend.onrender.com');
    console.log('   - Redeploy frontend if needed');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
};

console.log('🚀 Starting database debug check...\n');
debugCurrentData()
  .then(() => {
    console.log('\n✅ Debug check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Debug check failed:', error);
    process.exit(1);
  });