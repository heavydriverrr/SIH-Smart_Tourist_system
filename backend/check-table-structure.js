import dotenv from 'dotenv';
import { supabaseAdmin } from './config/supabase.js';

dotenv.config();

const checkTableStructure = async () => {
  try {
    console.log('🔍 Checking emergency_alerts table structure...');
    
    // Use a raw SQL query to get table structure
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'emergency_alerts' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      ` 
    });

    if (error) {
      console.error('❌ Error getting table structure:', error);
      
      // Alternative approach - try to select with specific columns
      console.log('🔄 Trying alternative approach...');
      
      const { data: sampleData, error: sampleError } = await supabaseAdmin
        .from('emergency_alerts')
        .select('*')
        .limit(1)
        .single();
      
      if (sampleError) {
        console.error('❌ Sample query error:', sampleError);
      } else if (sampleData) {
        console.log('✅ Sample record structure:');
        console.log(JSON.stringify(sampleData, null, 2));
        console.log('\n📊 Available columns:', Object.keys(sampleData));
      }
    } else {
      console.log('✅ Table structure:');
      console.table(data);
    }

    // Test which date columns work
    console.log('\n🔍 Testing date column queries...');
    
    const testColumns = ['created_at', 'updated_at', 'resolved_at'];
    
    for (const column of testColumns) {
      try {
        const { data: testData, error: testError } = await supabaseAdmin
          .from('emergency_alerts')
          .select(column)
          .limit(1);
        
        if (testError) {
          console.log(`❌ ${column}: ${testError.message}`);
        } else {
          console.log(`✅ ${column}: Available`);
        }
      } catch (err) {
        console.log(`❌ ${column}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
};

checkTableStructure()
  .then(() => {
    console.log('\n✅ Table structure check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });