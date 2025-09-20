import { supabaseAdmin } from '../config/supabase.js';
import logger from '../config/logger.js';

/**
 * Create emergency_alerts table and related structures
 * This script ensures the database has all necessary tables for the alert system
 */

const createEmergencyAlertsTable = async () => {
  try {
    logger.info('🔧 Creating emergency_alerts table...');

    // Create the emergency_alerts table via direct SQL
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Create emergency_alerts table if it doesn't exist
        CREATE TABLE IF NOT EXISTS emergency_alerts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          message TEXT,
          priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
          status VARCHAR(20) CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_alarm')) DEFAULT 'active',
          assigned_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
          admin_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          resolved_at TIMESTAMP WITH TIME ZONE
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_id ON emergency_alerts(user_id);
        CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
        CREATE INDEX IF NOT EXISTS idx_emergency_alerts_priority ON emergency_alerts(priority);
        CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON emergency_alerts(created_at);
        CREATE INDEX IF NOT EXISTS idx_emergency_alerts_assigned_admin ON emergency_alerts(assigned_admin_id);

        -- Enable Row Level Security
        ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

        -- Create policy for admin access
        DROP POLICY IF EXISTS "Admin can access all alerts" ON emergency_alerts;
        CREATE POLICY "Admin can access all alerts" ON emergency_alerts
          FOR ALL USING (true);

        -- Create trigger for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_emergency_alerts_updated_at ON emergency_alerts;
        CREATE TRIGGER update_emergency_alerts_updated_at
          BEFORE UPDATE ON emergency_alerts
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (createError) {
      // If rpc doesn't work, try individual operations
      logger.warn('RPC method failed, trying individual table creation...');
      
      // Check if table exists
      const { data: tableExists, error: checkError } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'emergency_alerts');

      if (checkError) {
        logger.error('Error checking table existence:', checkError);
        throw checkError;
      }

      if (!tableExists || tableExists.length === 0) {
        logger.info('Table does not exist, it needs to be created manually in Supabase dashboard');
        
        // Return the SQL that needs to be executed
        return {
          success: false,
          message: 'Table needs to be created manually',
          sql: `
-- Execute this SQL in your Supabase SQL Editor:

CREATE TABLE emergency_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  message TEXT,
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status VARCHAR(20) CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_alarm')) DEFAULT 'active',
  assigned_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_emergency_alerts_user_id ON emergency_alerts(user_id);
CREATE INDEX idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX idx_emergency_alerts_priority ON emergency_alerts(priority);
CREATE INDEX idx_emergency_alerts_created_at ON emergency_alerts(created_at);
CREATE INDEX idx_emergency_alerts_assigned_admin ON emergency_alerts(assigned_admin_id);

-- Enable RLS
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Create admin policy
CREATE POLICY "Admin can access all alerts" ON emergency_alerts
  FOR ALL USING (true);
          `
        };
      } else {
        logger.info('✅ emergency_alerts table already exists');
      }
    } else {
      logger.info('✅ emergency_alerts table created successfully via RPC');
    }

    // Test the table by inserting and then deleting a test record
    logger.info('🧪 Testing emergency_alerts table...');
    
    // First, get a test user ID
    const { data: testUser, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    if (userError || !testUser || testUser.length === 0) {
      logger.warn('No test user found, skipping table test');
      return { success: true, message: 'Table created but not tested (no users)' };
    }

    const testUserId = testUser[0].id;

    // Insert test record
    const { data: testAlert, error: insertError } = await supabaseAdmin
      .from('emergency_alerts')
      .insert({
        user_id: testUserId,
        latitude: 40.7128,
        longitude: -74.0060,
        message: 'Test alert - will be deleted',
        priority: 'low',
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Error inserting test alert:', insertError);
      throw insertError;
    }

    logger.info('✅ Test alert created successfully');

    // Delete test record
    const { error: deleteError } = await supabaseAdmin
      .from('emergency_alerts')
      .delete()
      .eq('id', testAlert.id);

    if (deleteError) {
      logger.warn('Error deleting test alert:', deleteError);
    } else {
      logger.info('✅ Test alert deleted successfully');
    }

    // Test the stats endpoint logic
    const { data: statsTest, error: statsError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('id, status, priority, created_at');

    if (statsError) {
      logger.error('Error testing stats query:', statsError);
      throw statsError;
    }

    logger.info(`✅ emergency_alerts table is working! Found ${statsTest?.length || 0} alerts`);

    return {
      success: true,
      message: 'emergency_alerts table is ready',
      alertCount: statsTest?.length || 0
    };

  } catch (error) {
    logger.error('❌ Error creating emergency_alerts table:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create or verify emergency_alerts table'
    };
  }
};

// Run the migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info('🚀 Starting emergency_alerts table migration...');
  
  createEmergencyAlertsTable()
    .then(result => {
      logger.info('Migration result:', result);
      if (result.success) {
        logger.info('✅ Migration completed successfully!');
        process.exit(0);
      } else {
        logger.error('❌ Migration failed:', result.message);
        if (result.sql) {
          console.log('\n' + '='.repeat(60));
          console.log('MANUAL SQL TO EXECUTE:');
          console.log('='.repeat(60));
          console.log(result.sql);
          console.log('='.repeat(60) + '\n');
        }
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { createEmergencyAlertsTable };