import dotenv from 'dotenv';
import { supabaseAdmin } from './config/supabase.js';
import crypto from 'crypto';

dotenv.config();

// Simple logger for this script
const logger = {
  info: (msg, data = '') => console.log(`📋 ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
  warn: (msg, data = '') => console.warn(`⚠️  ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
  error: (msg, data = '') => console.error(`❌ ${msg}`, data ? JSON.stringify(data, null, 2) : '')
};

// Bhubaneswar coordinates and popular tourist spots
const BHUBANESWAR_CENTER = { lat: 20.2961, lng: 85.8245 };
const BHUBANESWAR_LANDMARKS = [
  {
    name: "Lingaraj Temple",
    lat: 20.2376,
    lng: 85.8345,
    type: "religious",
    description: "Ancient Hindu temple dedicated to Lord Shiva"
  },
  {
    name: "Khandagiri Caves",
    lat: 20.2585,
    lng: 85.7694,
    type: "historical",
    description: "Ancient Jain rock-cut caves from 2nd century BCE"
  },
  {
    name: "Udayagiri Caves",
    lat: 20.2556,
    lng: 85.7667,
    type: "historical",
    description: "Historical caves with ancient inscriptions"
  },
  {
    name: "Kalinga Stadium",
    lat: 20.2956,
    lng: 85.8201,
    type: "sports",
    description: "Multi-purpose stadium for various sports events"
  },
  {
    name: "Nandankanan Zoological Park",
    lat: 20.4000,
    lng: 85.8167,
    type: "nature",
    description: "Famous zoo and botanical garden"
  },
  {
    name: "Rajarani Temple",
    lat: 20.2428,
    lng: 85.8394,
    type: "religious",
    description: "11th century temple known for its architecture"
  },
  {
    name: "Parasurameswara Temple",
    lat: 20.2364,
    lng: 85.8350,
    type: "religious",
    description: "7th century Odishan temple"
  },
  {
    name: "Ekamra Haat",
    lat: 20.2700,
    lng: 85.8400,
    type: "shopping",
    description: "Handicrafts and handloom market"
  },
  {
    name: "Dhauli Peace Pagoda",
    lat: 20.1925,
    lng: 85.8514,
    type: "religious",
    description: "Buddhist stupa marking the Kalinga War site"
  },
  {
    name: "Brahmeswar Temple",
    lat: 20.2380,
    lng: 85.8355,
    type: "religious",
    description: "9th century temple with intricate carvings"
  }
];

// Sample tourist data
const SAMPLE_TOURISTS = [
  {
    name: "Rahul Kumar",
    phone: "+91 9876543210",
    digital_id: "TUR001",
    safety_score: 85,
    emergency_contact: "+91 9876543211"
  },
  {
    name: "Priya Sharma",
    phone: "+91 9876543212",
    digital_id: "TUR002",
    safety_score: 92,
    emergency_contact: "+91 9876543213"
  },
  {
    name: "Amit Patel",
    phone: "+91 9876543214",
    digital_id: "TUR003",
    safety_score: 78,
    emergency_contact: "+91 9876543215"
  },
  {
    name: "Sneha Singh",
    phone: "+91 9876543216",
    digital_id: "TUR004",
    safety_score: 89,
    emergency_contact: "+91 9876543217"
  },
  {
    name: "Vikram Reddy",
    phone: "+91 9876543218",
    digital_id: "TUR005",
    safety_score: 76,
    emergency_contact: "+91 9876543219"
  },
  {
    name: "Anita Gupta",
    phone: "+91 9876543220",
    digital_id: "TUR006",
    safety_score: 94,
    emergency_contact: "+91 9876543221"
  },
  {
    name: "Rajesh Mishra",
    phone: "+91 9876543222",
    digital_id: "TUR007",
    safety_score: 81,
    emergency_contact: "+91 9876543223"
  },
  {
    name: "Kavitha Rao",
    phone: "+91 9876543224",
    digital_id: "TUR008",
    safety_score: 87,
    emergency_contact: "+91 9876543225"
  },
  {
    name: "Suresh Nair",
    phone: "+91 9876543226",
    digital_id: "TUR009",
    safety_score: 73,
    emergency_contact: "+91 9876543227"
  },
  {
    name: "Meera Joshi",
    phone: "+91 9876543228",
    digital_id: "TUR010",
    safety_score: 90,
    emergency_contact: "+91 9876543229"
  }
];

// Helper function to generate random coordinates around a point
const generateNearbyCoordinates = (centerLat, centerLng, radiusKm = 0.5) => {
  const earthRadius = 6371; // Earth's radius in km
  const lat1 = centerLat * Math.PI / 180;
  const lng1 = centerLng * Math.PI / 180;
  
  const randomDistance = Math.random() * radiusKm;
  const randomBearing = Math.random() * 2 * Math.PI;
  
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(randomDistance / earthRadius) + 
                         Math.cos(lat1) * Math.sin(randomDistance / earthRadius) * Math.cos(randomBearing));
  
  const lng2 = lng1 + Math.atan2(Math.sin(randomBearing) * Math.sin(randomDistance / earthRadius) * Math.cos(lat1),
                                 Math.cos(randomDistance / earthRadius) - Math.sin(lat1) * Math.sin(lat2));
  
  return {
    lat: lat2 * 180 / Math.PI,
    lng: lng2 * 180 / Math.PI
  };
};

const seedBhubaneswarData = async () => {
  try {
    logger.info('🌟 Starting Bhubaneswar data seeding...');

    // Step 1: Create tourist profiles
    logger.info('👥 Creating tourist profiles...');
    
    const { data: existingProfiles, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('digital_id')
      .in('digital_id', SAMPLE_TOURISTS.map(t => t.digital_id));

    if (profileCheckError) {
      logger.error('Error checking existing profiles:', profileCheckError);
      throw profileCheckError;
    }

    const existingIds = new Set(existingProfiles?.map(p => p.digital_id) || []);
    const newTourists = SAMPLE_TOURISTS.filter(t => !existingIds.has(t.digital_id));

    if (newTourists.length > 0) {
      const { data: createdProfiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert(newTourists.map(tourist => ({
          id: crypto.randomUUID(),
          name: tourist.name,
          phone: tourist.phone,
          digital_id: tourist.digital_id,
          safety_score: tourist.safety_score,
          emergency_contact: tourist.emergency_contact,
          is_verified: true
        })))
        .select();

      if (profileError) {
        logger.error('Error creating profiles:', profileError);
        throw profileError;
      }

      logger.info(`✅ Created ${createdProfiles.length} tourist profiles`);
    } else {
      logger.info('ℹ️ All tourist profiles already exist');
    }

    // Get all profiles for further operations
    const { data: allProfiles, error: getAllError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('digital_id', SAMPLE_TOURISTS.map(t => t.digital_id));

    if (getAllError) {
      throw getAllError;
    }

    // Step 2: Create geofences for landmarks
    logger.info('🗺️ Creating geofences for Bhubaneswar landmarks...');
    
    const geofences = BHUBANESWAR_LANDMARKS.map(landmark => ({
      name: landmark.name,
      center_latitude: landmark.lat,
      center_longitude: landmark.lng,
      radius: landmark.type === 'nature' ? 1000 : 200, // Larger radius for nature spots
      type: landmark.type,
      description: landmark.description,
      is_active: true,
      created_at: new Date().toISOString()
    }));

    // Check if geofences table exists, if not create some sample data anyway
    try {
      const { data: createdGeofences, error: geofenceError } = await supabaseAdmin
        .from('geofences')
        .upsert(geofences, { 
          onConflict: 'name',
          ignoreDuplicates: false 
        })
        .select();

      if (geofenceError) {
        logger.warn('Geofences table might not exist:', geofenceError.message);
      } else {
        logger.info(`✅ Created/updated ${createdGeofences.length} geofences`);
      }
    } catch (error) {
      logger.warn('Could not create geofences, table may not exist:', error.message);
    }

    // Step 3: Generate location tracking data
    logger.info('📍 Generating location tracking data...');
    
    const locationData = [];
    allProfiles.forEach(profile => {
      // Generate 5-10 location points per tourist around different landmarks
      const numLocations = Math.floor(Math.random() * 6) + 5;
      
      for (let i = 0; i < numLocations; i++) {
        const randomLandmark = BHUBANESWAR_LANDMARKS[Math.floor(Math.random() * BHUBANESWAR_LANDMARKS.length)];
        const nearbyCoords = generateNearbyCoordinates(randomLandmark.lat, randomLandmark.lng, 0.3);
        
        // Generate timestamps over the last 7 days
        const daysAgo = Math.floor(Math.random() * 7);
        const hoursAgo = Math.floor(Math.random() * 24);
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - daysAgo);
        timestamp.setHours(timestamp.getHours() - hoursAgo);
        
        locationData.push({
          user_id: profile.id,
          latitude: nearbyCoords.lat,
          longitude: nearbyCoords.lng,
          accuracy: Math.floor(Math.random() * 10) + 5, // 5-15 meters accuracy
          timestamp: timestamp.toISOString(),
          created_at: timestamp.toISOString()
        });
      }
    });

    // Try to insert location data
    try {
      const { data: createdLocations, error: locationError } = await supabaseAdmin
        .from('location_tracks')
        .insert(locationData)
        .select();

      if (locationError) {
        logger.warn('Location tracks table might not exist:', locationError.message);
      } else {
        logger.info(`✅ Created ${createdLocations.length} location tracking records`);
      }
    } catch (error) {
      logger.warn('Could not create location tracks:', error.message);
    }

    // Step 4: Create emergency alerts
    logger.info('🚨 Creating emergency alerts...');
    
    const alertTypes = [
      { message: "Lost near Lingaraj Temple, need directions", priority: "medium", status: "active" },
      { message: "Medical emergency at Khandagiri Caves", priority: "high", status: "resolved" },
      { message: "Phone stolen at Ekamra Haat market", priority: "medium", status: "resolved" },
      { message: "Transportation issue near Kalinga Stadium", priority: "low", status: "active" },
      { message: "Severe accident near Dhauli Peace Pagoda", priority: "critical", status: "active" },
      { message: "Unable to find hotel, stranded", priority: "medium", status: "resolved" },
      { message: "Food poisoning, need medical help", priority: "high", status: "active" },
      { message: "Lost group at Nandankanan Zoo", priority: "medium", status: "resolved" },
      { message: "Vehicle breakdown on highway", priority: "medium", status: "active" },
      { message: "Harassment by locals, unsafe", priority: "critical", status: "active" }
    ];

    const alerts = [];
    allProfiles.slice(0, 6).forEach((profile, index) => {
      if (index < alertTypes.length) {
        const alert = alertTypes[index];
        const landmark = BHUBANESWAR_LANDMARKS[index % BHUBANESWAR_LANDMARKS.length];
        const nearbyCoords = generateNearbyCoordinates(landmark.lat, landmark.lng, 0.1);
        
        const daysAgo = Math.floor(Math.random() * 3); // Last 3 days
        const hoursAgo = Math.floor(Math.random() * 12);
        const alertTime = new Date();
        alertTime.setDate(alertTime.getDate() - daysAgo);
        alertTime.setHours(alertTime.getHours() - hoursAgo);
        
        alerts.push({
          user_id: profile.id,
          latitude: nearbyCoords.lat,
          longitude: nearbyCoords.lng,
          message: alert.message,
          priority: alert.priority,
          status: alert.status,
          created_at: alertTime.toISOString(),
          resolved_at: alert.status === 'resolved' ? new Date(alertTime.getTime() + (Math.random() * 3600000)).toISOString() : null
        });
      }
    });

    const { data: createdAlerts, error: alertError } = await supabaseAdmin
      .from('emergency_alerts')
      .insert(alerts)
      .select();

    if (alertError) {
      logger.error('Error creating alerts:', alertError);
    } else {
      logger.info(`✅ Created ${createdAlerts.length} emergency alerts`);
    }

    // Step 5: Add additional admin users
    logger.info('👨‍💼 Creating additional admin users...');
    
    const additionalAdmins = [
      {
        email: "security@bhubaneswar.gov.in",
        name: "Security Coordinator",
        role: "moderator",
        permissions: ["view_alerts", "manage_alerts"],
        is_active: true
      },
      {
        email: "tourism@odisha.gov.in",
        name: "Tourism Officer",
        role: "viewer",
        permissions: ["view_alerts", "view_tourists"],
        is_active: true
      }
    ];

    try {
      const { data: existingAdmins, error: adminCheckError } = await supabaseAdmin
        .from('admin_users')
        .select('email')
        .in('email', additionalAdmins.map(a => a.email));

      if (adminCheckError) {
        logger.warn('Could not check existing admins:', adminCheckError.message);
      } else {
        const existingEmails = new Set(existingAdmins?.map(a => a.email) || []);
        const newAdmins = additionalAdmins.filter(a => !existingEmails.has(a.email));

        if (newAdmins.length > 0) {
          // Note: In a real scenario, you'd hash the passwords
          const adminsToCreate = newAdmins.map(admin => ({
            ...admin,
            password_hash: "$2b$10$example_hash", // Placeholder - would need proper hashing
            created_at: new Date().toISOString()
          }));

          const { data: createdAdmins, error: createAdminError } = await supabaseAdmin
            .from('admin_users')
            .insert(adminsToCreate)
            .select();

          if (createAdminError) {
            logger.warn('Could not create admin users:', createAdminError.message);
          } else {
            logger.info(`✅ Created ${createdAdmins.length} additional admin users`);
          }
        }
      }
    } catch (error) {
      logger.warn('Admin user creation skipped:', error.message);
    }

    // Final summary
    logger.info('\n' + '='.repeat(80));
    logger.info('🎉 BHUBANESWAR DATA SEEDING COMPLETED!');
    logger.info('='.repeat(80));
    logger.info(`📊 Summary:`);
    logger.info(`- Tourist profiles: ${SAMPLE_TOURISTS.length} tourists with Bhubaneswar data`);
    logger.info(`- Landmarks: ${BHUBANESWAR_LANDMARKS.length} popular tourist spots`);
    logger.info(`- Emergency alerts: Various incidents around the city`);
    logger.info(`- Location tracking: GPS coordinates around landmarks`);
    logger.info(`- Admin users: Additional users for monitoring`);
    logger.info('\n🌟 Your admin portal should now show rich data for Bhubaneswar!');
    logger.info('🗺️ Map should display tourists, alerts, and geofences around landmarks');
    logger.info('📱 Check the dashboard for updated statistics and activity');
    logger.info('='.repeat(80));

    return {
      success: true,
      message: 'Bhubaneswar data seeding completed successfully',
      summary: {
        tourists: SAMPLE_TOURISTS.length,
        landmarks: BHUBANESWAR_LANDMARKS.length,
        alerts: alerts.length
      }
    };

  } catch (error) {
    logger.error('❌ Data seeding failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Data seeding failed'
    };
  }
};

// Run the seeding if this script is executed directly
console.log('🚀 Script starting...');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);
console.log('Comparison:', import.meta.url === `file://${process.argv[1]}`);

logger.info('🚀 Starting Bhubaneswar data seeding script...');

seedBhubaneswarData()
  .then(result => {
    if (result.success) {
      logger.info('✅ Data seeding successful!');
      process.exit(0);
    } else {
      logger.error('❌ Data seeding failed:', result.message);
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error('❌ Script execution failed:', error);
    process.exit(1);
  });

export { seedBhubaneswarData, BHUBANESWAR_LANDMARKS, SAMPLE_TOURISTS };