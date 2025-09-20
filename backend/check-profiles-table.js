import dotenv from 'dotenv';
import { supabaseAdmin } from './config/supabase.js';

dotenv.config();

const checkProfilesTable = async () => {
  try {
    console.log('🔍 Checking profiles table structure...');
    
    // Get a sample record to see the structure
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Sample query error:', sampleError);
    } else if (sampleData && sampleData.length > 0) {
      console.log('✅ Sample profile record:');
      console.log(JSON.stringify(sampleData[0], null, 2));
      console.log('\n📊 Available columns:', Object.keys(sampleData[0]));
    } else {
      console.log('ℹ️ No records in profiles table, checking schema...');
      
      // Try to get all data to see structure
      const { data: allData, error: allError } = await supabaseAdmin
        .from('profiles')
        .select('*');
      
      console.log('All profiles query result:', { data: allData, error: allError });
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
};

checkProfilesTable()
  .then(() => {
    console.log('\n✅ Profile table check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });