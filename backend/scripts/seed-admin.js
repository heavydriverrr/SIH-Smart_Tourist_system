import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/supabase.js';
import logger from '../config/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdminUser = async () => {
  try {
    logger.info('🌱 Starting admin user seeding...');

    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@smartwanderer.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123456';

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email')
      .eq('email', adminEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingAdmin) {
      logger.info(`✅ Admin user already exists: ${adminEmail}`);
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create the admin user
    const { data: newAdmin, error: insertError } = await supabaseAdmin
      .from('admin_users')
      .insert([
        {
          name: 'System Administrator',
          email: adminEmail,
          password_hash: hashedPassword,
          role: 'super_admin',
          is_active: true
        }
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    logger.info(`✅ Admin user created successfully:`);
    logger.info(`   Email: ${adminEmail}`);
    logger.info(`   Password: ${adminPassword}`);
    logger.info(`   Role: super_admin`);
    logger.info(`   ID: ${newAdmin.id}`);

    // Create additional sample admins
    const additionalAdmins = [
      {
        name: 'Alert Manager',
        email: 'alerts@smartwanderer.com',
        password_hash: hashedPassword,
        role: 'alert_manager'
      },
      {
        name: 'System Operator',
        email: 'operator@smartwanderer.com',
        password_hash: hashedPassword,
        role: 'operator'
      }
    ];

    const { data: additionalInserted, error: additionalError } = await supabaseAdmin
      .from('admin_users')
      .insert(additionalAdmins)
      .select();

    if (additionalError) {
      logger.warn('⚠️  Error creating additional admin users:', additionalError.message);
    } else {
      logger.info(`✅ Created ${additionalInserted.length} additional admin users`);
      additionalInserted.forEach(admin => {
        logger.info(`   - ${admin.name} (${admin.email}) - ${admin.role}`);
      });
    }

    logger.info('🎉 Admin seeding completed successfully!');
    logger.info('');
    logger.info('🔐 Default Login Credentials:');
    logger.info(`   Email: ${adminEmail}`);
    logger.info(`   Password: ${adminPassword}`);
    logger.info('');
    logger.info('⚠️  IMPORTANT: Change the default password after first login in production!');

  } catch (error) {
    logger.error('❌ Error seeding admin user:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Create sample tourist locations for testing
const seedSampleData = async () => {
  try {
    logger.info('🌱 Creating sample tourist locations...');

    // Get existing tourist profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .limit(5);

    if (profilesError || !profiles || profiles.length === 0) {
      logger.info('ℹ️  No tourist profiles found, skipping sample location data');
      return;
    }

    // Sample locations in Guwahati, Assam
    const sampleLocations = [
      { lat: 26.1445, lng: 91.7362, address: 'Guwahati Railway Station, Guwahati, Assam' },
      { lat: 26.1408, lng: 91.7417, address: 'Fancy Bazaar, Guwahati, Assam' },
      { lat: 26.1584, lng: 91.7626, address: 'Kamakhya Temple, Guwahati, Assam' },
      { lat: 26.1739, lng: 91.7514, address: 'Umananda Temple, Guwahati, Assam' },
      { lat: 26.1195, lng: 91.7898, address: 'Lokpriya Gopinath Bordoloi Airport, Guwahati, Assam' }
    ];

    const locationInserts = [];
    profiles.forEach((profile, index) => {
      const location = sampleLocations[index % sampleLocations.length];
      // Add some random variation
      const latVariation = (Math.random() - 0.5) * 0.01; // ~1km variation
      const lngVariation = (Math.random() - 0.5) * 0.01;
      
      locationInserts.push({
        user_id: profile.id,
        latitude: location.lat + latVariation,
        longitude: location.lng + lngVariation,
        address: location.address,
        accuracy: Math.floor(Math.random() * 50) + 5, // 5-55 meters accuracy
        updated_at: new Date(Date.now() - Math.random() * 3600000).toISOString() // Within last hour
      });
    });

    const { data: insertedLocations, error: locationError } = await supabaseAdmin
      .from('tourist_locations')
      .insert(locationInserts)
      .select();

    if (locationError) {
      logger.warn('⚠️  Error creating sample locations:', locationError.message);
    } else {
      logger.info(`✅ Created ${insertedLocations.length} sample tourist locations`);
    }

  } catch (error) {
    logger.warn('⚠️  Error creating sample data:', error.message);
  }
};

// Run the seeding
const main = async () => {
  await seedAdminUser();
  
  // Only create sample data in development
  if (process.env.NODE_ENV !== 'production') {
    await seedSampleData();
  }
};

main();