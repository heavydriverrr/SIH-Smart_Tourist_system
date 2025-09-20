import dotenv from 'dotenv';
import { supabaseAdmin } from './config/supabase.js';

// Load environment variables
dotenv.config();

console.log('🔍 Debugging alert stats endpoint issue...');
console.log('📊 Environment:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Not set',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'
});

const debugAlertStats = async () => {
  try {
    console.log('\n🔗 Testing Supabase connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Check if emergency_alerts table exists
    console.log('\n📋 Checking emergency_alerts table...');
    
    const { data: alerts, error: alertsError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('*')
      .limit(1);

    if (alertsError) {
      console.error('❌ Emergency alerts table error:', alertsError);
      
      if (alertsError.code === 'PGRST116' || alertsError.message.includes('does not exist')) {
        console.log('🛠️  The emergency_alerts table does not exist!');
        console.log('Creating table manually...');
        
        // Create the table using SQL
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.emergency_alerts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
          latitude DECIMAL(10,8) NOT NULL,
          longitude DECIMAL(11,8) NOT NULL,
          message TEXT,
          priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
          status TEXT CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_alarm')) DEFAULT 'active',
          assigned_admin_id UUID REFERENCES public.admin_users(id),
          admin_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          resolved_at TIMESTAMP WITH TIME ZONE
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_id ON public.emergency_alerts(user_id);
        CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON public.emergency_alerts(status);
        CREATE INDEX IF NOT EXISTS idx_emergency_alerts_priority ON public.emergency_alerts(priority);
        CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON public.emergency_alerts(created_at);

        -- Enable RLS
        ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Admin users can view all alerts" ON public.emergency_alerts FOR SELECT TO authenticated USING (
          EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid()
          )
        );

        CREATE POLICY "Admin users can update alerts" ON public.emergency_alerts FOR UPDATE TO authenticated USING (
          EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid()
          )
        );

        CREATE POLICY "Users can create emergency alerts" ON public.emergency_alerts FOR INSERT TO authenticated WITH CHECK (
          auth.uid() = user_id
        );

        CREATE POLICY "Service role full access" ON public.emergency_alerts TO service_role USING (true) WITH CHECK (true);
        `;

        const { error: createError } = await supabaseAdmin.rpc('exec_sql', { sql: createTableSQL });
        
        if (createError) {
          console.error('❌ Failed to create table via RPC:', createError);
          console.log('\n📝 Please run this SQL in your Supabase SQL Editor:');
          console.log('='.repeat(80));
          console.log(createTableSQL);
          console.log('='.repeat(80));
        } else {
          console.log('✅ Table created successfully!');
        }
      }
      return;
    }

    console.log(`✅ Emergency alerts table exists with ${alerts?.length || 0} records`);

    // Test the stats queries
    console.log('\n📊 Testing alert stats queries...');

    const { data: totalAlerts, error: totalError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('id');

    const { data: activeAlerts, error: activeError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('id')
      .eq('status', 'active');

    const today = new Date().toISOString().split('T')[0];
    const { data: resolvedToday, error: todayError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('id')
      .eq('status', 'resolved')
      .gte('created_at', today);

    const { data: priorityStats, error: priorityError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('priority')
      .eq('status', 'active');

    if (totalError || activeError || todayError || priorityError) {
      console.error('❌ Stats query errors:', { totalError, activeError, todayError, priorityError });
    } else {
      console.log('✅ All stats queries successful!');
      
      const statsResult = {
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
      
      console.log('📊 Current alert stats:', JSON.stringify(statsResult, null, 2));
      
      if (statsResult.total_alerts === 0) {
        console.log('\n📝 Creating sample alert data...');
        await createSampleAlerts();
      }
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
};

const createSampleAlerts = async () => {
  try {
    // Get a user to create alerts for
    const { data: users, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.warn('⚠️ No users found to create sample alerts');
      return;
    }

    const userId = users[0].id;
    console.log(`👤 Creating alerts for user: ${users[0].name} (${userId})`);

    const sampleAlerts = [
      {
        user_id: userId,
        latitude: 40.7128,
        longitude: -74.0060,
        message: 'Lost in Times Square - debug test',
        priority: 'medium',
        status: 'active'
      },
      {
        user_id: userId,
        latitude: 40.7589,
        longitude: -73.9851,
        message: 'Test resolved alert - debug',
        priority: 'high',
        status: 'resolved',
        resolved_at: new Date().toISOString()
      },
      {
        user_id: userId,
        latitude: 40.6892,
        longitude: -74.0445,
        message: 'Low priority test alert - debug',
        priority: 'low',
        status: 'active'
      }
    ];

    const { data: createdAlerts, error: insertError } = await supabaseAdmin
      .from('emergency_alerts')
      .insert(sampleAlerts)
      .select();

    if (insertError) {
      console.error('❌ Error creating sample alerts:', insertError);
    } else {
      console.log(`✅ Created ${createdAlerts?.length || 0} sample alerts`);
    }

  } catch (error) {
    console.error('❌ Error creating sample alerts:', error);
  }
};

console.log('🚀 Starting debug script...');
debugAlertStats()
  .then(() => {
    console.log('\n✅ Debug script completed!');
    console.log('🎯 Now test the admin portal alert stats again.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Debug script failed:', error);
    process.exit(1);
  });