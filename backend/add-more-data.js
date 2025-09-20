import dotenv from 'dotenv';
import { supabaseAdmin } from './config/supabase.js';

dotenv.config();

const addMoreBhubaneswarData = async () => {
  try {
    console.log('🌟 Adding more diverse Bhubaneswar data...\n');

    // Get existing profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(10);

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
      return;
    }

    console.log(`✅ Working with ${profiles.length} profiles`);

    // More diverse alerts around Bhubaneswar
    const diverseAlerts = [
      {
        message: "Lost near Lingaraj Temple, need directions to hotel",
        priority: "medium",
        status: "active",
        lat: 20.2376,
        lng: 85.8345
      },
      {
        message: "Medical emergency at Khandagiri Caves, tourist injured",
        priority: "high", 
        status: "active",
        lat: 20.2585,
        lng: 85.7694
      },
      {
        message: "Phone and wallet stolen at Ekamra Haat market",
        priority: "medium",
        status: "resolved",
        lat: 20.2700,
        lng: 85.8400
      },
      {
        message: "Vehicle breakdown near Kalinga Stadium",
        priority: "low",
        status: "active",
        lat: 20.2956,
        lng: 85.8201
      },
      {
        message: "CRITICAL: Serious accident near Dhauli Peace Pagoda",
        priority: "critical",
        status: "active",
        lat: 20.1925,
        lng: 85.8514
      },
      {
        message: "Group member missing at Nandankanan Zoo",
        priority: "high",
        status: "active", 
        lat: 20.4000,
        lng: 85.8167
      },
      {
        message: "Food poisoning, need immediate medical help",
        priority: "high",
        status: "resolved",
        lat: 20.2428,
        lng: 85.8394
      },
      {
        message: "Transportation strike, stranded tourists",
        priority: "medium",
        status: "active",
        lat: 20.2364,
        lng: 85.8350
      },
      {
        message: "Tourist harassment reported, unsafe area",
        priority: "critical",
        status: "active",
        lat: 20.2380,
        lng: 85.8355
      },
      {
        message: "Minor injury during temple visit, first aid needed",
        priority: "low",
        status: "resolved",
        lat: 20.2376,
        lng: 85.8345
      }
    ];

    // Create alerts for different users
    const alertsToCreate = [];
    profiles.forEach((profile, index) => {
      if (index < diverseAlerts.length) {
        const alertTemplate = diverseAlerts[index];
        
        // Generate random coordinates near the landmark
        const latOffset = (Math.random() - 0.5) * 0.01; // ~1km radius
        const lngOffset = (Math.random() - 0.5) * 0.01;
        
        // Random time in last 3 days
        const hoursAgo = Math.floor(Math.random() * 72);
        const alertTime = new Date();
        alertTime.setHours(alertTime.getHours() - hoursAgo);
        
        alertsToCreate.push({
          user_id: profile.id,
          latitude: alertTemplate.lat + latOffset,
          longitude: alertTemplate.lng + lngOffset,
          message: alertTemplate.message,
          priority: alertTemplate.priority,
          status: alertTemplate.status,
          created_at: alertTime.toISOString(),
          resolved_at: alertTemplate.status === 'resolved' ? 
            new Date(alertTime.getTime() + Math.random() * 3600000 * 2).toISOString() : null
        });
      }
    });

    console.log(`🚨 Creating ${alertsToCreate.length} diverse emergency alerts...`);
    
    const { data: newAlerts, error: alertError } = await supabaseAdmin
      .from('emergency_alerts')
      .insert(alertsToCreate)
      .select();

    if (alertError) {
      console.error('❌ Error creating alerts:', alertError);
    } else {
      console.log(`✅ Successfully created ${newAlerts.length} diverse alerts`);
      
      // Show summary of what was created
      console.log('\n📊 Alert Summary:');
      const priorities = newAlerts.reduce((acc, alert) => {
        acc[alert.priority] = (acc[alert.priority] || 0) + 1;
        return acc;
      }, {});
      console.log('Priorities:', priorities);
      
      const statuses = newAlerts.reduce((acc, alert) => {
        acc[alert.status] = (acc[alert.status] || 0) + 1;
        return acc;
      }, {});
      console.log('Statuses:', statuses);
    }

    // Check admin user credentials
    console.log('\n🔐 Checking admin credentials...');
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*');

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError);
    } else {
      console.log(`✅ Found ${adminUsers.length} admin users:`);
      adminUsers.forEach(admin => {
        console.log(`- ${admin.name || admin.email} (${admin.role}) - Active: ${admin.is_active}`);
      });
    }

    // Final stats check
    console.log('\n📈 Updated Database Statistics:');
    const { data: totalAlerts } = await supabaseAdmin
      .from('emergency_alerts')
      .select('id');
    
    const { data: activeAlerts } = await supabaseAdmin
      .from('emergency_alerts')
      .select('id')
      .eq('status', 'active');
    
    const { data: allProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id');

    console.log(`📊 Current Totals:`);
    console.log(`- Total Alerts: ${totalAlerts?.length || 0}`);
    console.log(`- Active Alerts: ${activeAlerts?.length || 0}`);
    console.log(`- Tourist Profiles: ${allProfiles?.length || 0}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ MORE DATA ADDED SUCCESSFULLY!');
    console.log('🎯 Now try refreshing your admin portal');
    console.log('🗺️ You should see more diverse alerts on the map');
    console.log('📱 Check different priority levels and statuses');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Failed to add more data:', error);
  }
};

console.log('🚀 Adding more diverse Bhubaneswar data...\n');
addMoreBhubaneswarData()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });