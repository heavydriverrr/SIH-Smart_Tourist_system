import { supabaseAdmin } from './config/supabase.js';
import bcrypt from 'bcryptjs';

const test = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@smartwanderer.com');
    
    if (error) {
      console.error('❌ Database error:', error.message);
      
      // Create the user directly
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123456', 10);
      
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('admin_users')
        .insert({
          name: 'System Administrator',
          email: 'admin@smartwanderer.com',
          password_hash: hashedPassword,
          role: 'super_admin',
          is_active: true
        })
        .select();
      
      if (insertError) {
        console.error('❌ Insert error:', insertError.message);
      } else {
        console.log('✅ Admin user created:', inserted[0]);
      }
      
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Admin user found:', data[0]);
      
      // Test password
      const isValid = await bcrypt.compare('admin123456', data[0].password_hash);
      console.log('Password valid:', isValid);
      
      if (!isValid) {
        console.log('Fixing password...');
        const newHash = await bcrypt.hash('admin123456', 10);
        const { error: updateError } = await supabaseAdmin
          .from('admin_users')
          .update({ password_hash: newHash })
          .eq('email', 'admin@smartwanderer.com');
        
        if (updateError) {
          console.error('❌ Update error:', updateError.message);
        } else {
          console.log('✅ Password updated');
        }
      }
    } else {
      console.log('❌ No admin user found');
    }
    
  } catch (err) {
    console.error('❌ Test error:', err);
  }
  
  process.exit(0);
};

test();