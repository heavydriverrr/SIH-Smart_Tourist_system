import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/supabase.js';
import logger from '../config/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const quickSetup = async () => {
  try {
    logger.info('🚀 Quick Admin Setup...');

    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@smartwanderer.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123456';

    // First, ensure the admin_users table exists
    logger.info('📋 Creating admin_users table...');
    
    const createTableQuery = `
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
    `;

    const { error: tableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTableQuery
    });

    if (tableError) {
      // If the RPC doesn't exist, try direct table creation
      logger.info('⚠️  RPC method not available, trying direct insert...');
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Try to insert the admin user
    const { data: newAdmin, error: insertError } = await supabaseAdmin
      .from('admin_users')
      .upsert([
        {
          name: 'System Administrator',
          email: adminEmail,
          password_hash: hashedPassword,
          role: 'super_admin',
          is_active: true
        }
      ], { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (insertError) {
      logger.error('❌ Insert error:', insertError);
      
      // If the table doesn't exist, let's create it manually and try again
      if (insertError.message.includes('relation "admin_users" does not exist')) {
        logger.info('🔧 Table does not exist, please run the SQL schema manually in Supabase');
        logger.info('📋 Copy and run this SQL in your Supabase SQL Editor:');
        logger.info('');
        logger.info(`
-- Create the admin_users table
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

-- Insert the admin user
INSERT INTO admin_users (name, email, password_hash, role) 
VALUES (
    'System Administrator',
    '${adminEmail}',
    '${hashedPassword}',
    'super_admin'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();
        `);
        logger.info('');
        logger.info('🔐 After running the SQL, use these credentials:');
        logger.info(`   Email: ${adminEmail}`);
        logger.info(`   Password: ${adminPassword}`);
        return;
      }
      throw insertError;
    }

    logger.info('✅ Admin user created/updated successfully!');
    logger.info('🔐 Login Credentials:');
    logger.info(`   Email: ${adminEmail}`);
    logger.info(`   Password: ${adminPassword}`);
    logger.info(`   Role: super_admin`);
    
    if (newAdmin) {
      logger.info(`   ID: ${newAdmin.id}`);
    }

  } catch (error) {
    logger.error('❌ Setup error:', error);
  }
};

quickSetup();