import { supabaseAdmin } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import logger from '../config/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const checkAdmin = async () => {
  try {
    logger.info('🔍 Checking admin user...');

    // First, check if the table exists
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'admin_users');

    if (tablesError) {
      logger.error('❌ Error checking tables:', tablesError.message);
      return;
    }

    if (!tables || tables.length === 0) {
      logger.info('📋 admin_users table does not exist. Creating it...');
      
      // Try to create the table using raw SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS admin_users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(50) DEFAULT 'operator' CHECK (role IN ('super_admin', 'admin', 'alert_manager', 'operator')),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          last_login_at TIMESTAMPTZ
        );
        
        CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
      `;

      const { error: createError } = await supabaseAdmin.rpc('exec', { sql: createTableSQL });
      
      if (createError) {
        logger.error('❌ Error creating table:', createError.message);
        logger.info('');
        logger.info('🔧 Please run this SQL manually in your Supabase SQL Editor:');
        logger.info('');
        logger.info(createTableSQL);
        logger.info('');
        return;
      } else {
        logger.info('✅ Table created successfully');
      }
    } else {
      logger.info('✅ admin_users table exists');
    }

    // Check if admin user exists
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@smartwanderer.com')
      .single();

    if (adminError && adminError.code !== 'PGRST116') {
      logger.error('❌ Error checking admin user:', adminError.message);
      return;
    }

    if (!admin) {
      logger.info('👤 Admin user does not exist. Creating...');
      
      const hashedPassword = await bcrypt.hash('admin123456', 10);
      
      const { data: newAdmin, error: insertError } = await supabaseAdmin
        .from('admin_users')
        .insert({
          name: 'System Administrator',
          email: 'admin@smartwanderer.com',
          password_hash: hashedPassword,
          role: 'super_admin',
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        logger.error('❌ Error creating admin user:', insertError.message);
        return;
      }

      logger.info('✅ Admin user created successfully!');
      logger.info(`   ID: ${newAdmin.id}`);
      logger.info(`   Email: ${newAdmin.email}`);
      logger.info(`   Role: ${newAdmin.role}`);
    } else {
      logger.info('✅ Admin user exists:');
      logger.info(`   ID: ${admin.id}`);
      logger.info(`   Email: ${admin.email}`);
      logger.info(`   Role: ${admin.role}`);
      logger.info(`   Active: ${admin.is_active}`);
      logger.info(`   Created: ${admin.created_at}`);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('admin123456', admin.password_hash);
      logger.info(`   Password valid: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        logger.info('🔑 Updating password...');
        const newHashedPassword = await bcrypt.hash('admin123456', 10);
        
        const { error: updateError } = await supabaseAdmin
          .from('admin_users')
          .update({ password_hash: newHashedPassword })
          .eq('email', 'admin@smartwanderer.com');
        
        if (updateError) {
          logger.error('❌ Error updating password:', updateError.message);
        } else {
          logger.info('✅ Password updated successfully!');
        }
      }
    }

    logger.info('');
    logger.info('🔐 Login Credentials:');
    logger.info('   Email: admin@smartwanderer.com');
    logger.info('   Password: admin123456');

  } catch (error) {
    logger.error('❌ Script error:', error);
  }
};

checkAdmin();