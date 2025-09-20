import { supabaseAdmin } from '../config/supabase.js';
import logger from '../config/logger.js';
import { createEmergencyAlertsTable } from './create-emergency-alerts-table.js';

/**
 * Test script to diagnose and fix the alert stats endpoint issue
 * This will check if the emergency_alerts table exists and create it if needed
 */

const testAlertStats = async () => {
  try {
    logger.info('🔍 Diagnosing alert stats endpoint issue...');

    // Step 1: Check if emergency_alerts table exists
    logger.info('📋 Step 1: Checking if emergency_alerts table exists...');
    
    const { data: alertsTest, error: alertsError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('id, status, priority, created_at')
      .limit(1);

    if (alertsError) {
      if (alertsError.code === 'PGRST116' || alertsError.message.includes('does not exist')) {
        logger.info('❌ emergency_alerts table does not exist. Creating it...');
        
        // Create the table
        const migrationResult = await createEmergencyAlertsTable();
        
        if (!migrationResult.success) {
          logger.error('❌ Failed to create emergency_alerts table');
          console.log('\n' + '='.repeat(80));
          console.log('🛠️  MANUAL DATABASE SETUP REQUIRED');
          console.log('='.repeat(80));
          console.log('The emergency_alerts table needs to be created manually.');
          console.log('Please go to your Supabase Dashboard > SQL Editor and run:');
          console.log('='.repeat(80));
          console.log(migrationResult.sql);
          console.log('='.repeat(80));
          return migrationResult;
        }
        
        logger.info('✅ emergency_alerts table created successfully!');
      } else {
        logger.error('❌ Database error:', alertsError);
        throw alertsError;
      }
    } else {
      logger.info(`✅ emergency_alerts table exists with ${alertsTest?.length || 0} records`);
    }

    // Step 2: Test the stats endpoint logic manually
    logger.info('📊 Step 2: Testing stats endpoint logic...');

    try {
      // Get overall stats (same logic as the endpoint)
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
        .gte('updated_at', today);

      // Get priority breakdown
      const { data: priorityStats, error: priorityError } = await supabaseAdmin
        .from('emergency_alerts')
        .select('priority')
        .eq('status', 'active');

      if (totalError || activeError || todayError || priorityError) {
        logger.error('❌ Stats query errors:', { totalError, activeError, todayError, priorityError });
        throw new Error('Failed to query alert statistics');
      }

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

      logger.info('✅ Stats endpoint logic test successful!');
      logger.info('📊 Current stats:', JSON.stringify(statsResult, null, 2));

      // Step 3: Create test alert data if none exists
      if (statsResult.total_alerts === 0) {
        logger.info('📝 Step 3: Creating sample alert data...');
        await createSampleAlerts();
      }

      return {
        success: true,
        message: 'Alert stats endpoint is ready to work',
        stats: statsResult
      };

    } catch (error) {
      logger.error('❌ Error testing stats logic:', error);
      throw error;
    }

  } catch (error) {
    logger.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Alert stats endpoint test failed'
    };
  }
};

const createSampleAlerts = async () => {
  try {
    // Get a sample user
    const { data: users, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .limit(1);

    if (userError || !users || users.length === 0) {
      logger.warn('⚠️ No users found to create sample alerts');
      return;
    }

    const userId = users[0].id;
    logger.info(`👤 Using user: ${users[0].name} (${userId})`);

    // Create sample alerts
    const sampleAlerts = [
      {
        user_id: userId,
        latitude: 40.7128,
        longitude: -74.0060,
        message: 'Lost in Times Square',
        priority: 'medium',
        status: 'active'
      },
      {
        user_id: userId,
        latitude: 40.7589,
        longitude: -73.9851,
        message: 'Medical emergency in Central Park',
        priority: 'high',
        status: 'resolved',
        resolved_at: new Date().toISOString()
      },
      {
        user_id: userId,
        latitude: 40.6892,
        longitude: -74.0445,
        message: 'Minor incident at Statue of Liberty',
        priority: 'low',
        status: 'false_alarm'
      }
    ];

    const { data: createdAlerts, error: insertError } = await supabaseAdmin
      .from('emergency_alerts')
      .insert(sampleAlerts)
      .select();

    if (insertError) {
      logger.error('❌ Error creating sample alerts:', insertError);
    } else {
      logger.info(`✅ Created ${createdAlerts?.length || 0} sample alerts`);
    }

  } catch (error) {
    logger.error('❌ Error creating sample alerts:', error);
  }
};

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info('🚀 Starting alert stats endpoint test...');
  
  testAlertStats()
    .then(result => {
      logger.info('Test result:', result);
      if (result.success) {
        logger.info('✅ Alert stats endpoint is ready!');
        logger.info('🎯 The admin portal should now load alert stats without errors.');
        process.exit(0);
      } else {
        logger.error('❌ Test failed:', result.message);
        if (result.error) {
          logger.error('Error details:', result.error);
        }
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testAlertStats };