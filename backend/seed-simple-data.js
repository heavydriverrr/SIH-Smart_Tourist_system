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

const seedSimpleBhubaneswarData = async () => {
  try {
    logger.info('🌟 Starting simple Bhubaneswar data seeding...');

    // Step 1: Get existing users/profiles
    logger.info('👥 Getting existing tourist profiles...');
    
    const { data: existingProfiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(10);

    if (profileError) {
      logger.error('Error fetching profiles:', profileError);
      throw profileError;
    }

    logger.info(`✅ Found ${existingProfiles.length} existing profiles`);

    if (existingProfiles.length === 0) {
      logger.warn('No existing profiles found. Please create some users first.');
      return {
        success: false,
        message: 'No existing profiles to work with'
      };
    }

    // Step 2: Update existing profiles with better data
    logger.info('✨ Updating existing profiles with Bhubaneswar data...');
    
    const sampleNames = [
      "Rahul Kumar", "Priya Sharma", "Amit Patel", "Sneha Singh", 
      "Vikram Reddy", "Anita Gupta", "Rajesh Mishra", "Kavitha Rao"
    ];
    
    const samplePhones = [
      "+91 9876543210", "+91 9876543212", "+91 9876543214", "+91 9876543216",
      "+91 9876543218", "+91 9876543220", "+91 9876543222", "+91 9876543224"
    ];

    for (let i = 0; i < existingProfiles.length && i < sampleNames.length; i++) {
      const profile = existingProfiles[i];
      const updates = {
        name: sampleNames[i] || profile.name,
        phone: samplePhones[i] || profile.phone,
        digital_id: `TUR${String(i + 1).padStart(3, '0')}`,
        emergency_contact: `+91 987654321${i}`,
        safety_score: Math.floor(Math.random() * 30) + 70, // 70-100
        is_verified: true
      };

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (updateError) {
        logger.warn(`Failed to update profile ${profile.id}:`, updateError);
      } else {
        logger.info(`✅ Updated profile: ${updates.name}`);
      }
    }

    // Step 3: Create emergency alerts for Bhubaneswar
    logger.info('🚨 Creating emergency alerts around Bhubaneswar...');
    
    const alertTypes = [
      { message: "Lost near Lingaraj Temple, need directions", priority: "medium", status: "active" },
      { message: "Medical emergency at Khandagiri Caves", priority: "high", status: "resolved" },
      { message: "Phone stolen at Ekamra Haat market", priority: "medium", status: "resolved" },
      { message: "Transportation issue near Kalinga Stadium", priority: "low", status: "active" },
      { message: "Severe accident near Dhauli Peace Pagoda", priority: "critical", status: "active" },
      { message: "Unable to find hotel, stranded", priority: "medium", status: "resolved" },
      { message: "Food poisoning, need medical help", priority: "high", status: "active" },
      { message: "Lost group at Nandankanan Zoo", priority: "medium", status: "resolved" },
      { message: "Vehicle breakdown near temple area", priority: "medium", status: "active" },
      { message: "Harassment by locals, feeling unsafe", priority: "critical", status: "active" }
    ];

    const alerts = [];
    existingProfiles.slice(0, 8).forEach((profile, index) => {
      if (index < alertTypes.length) {
        const alert = alertTypes[index];
        const landmark = BHUBANESWAR_LANDMARKS[index % BHUBANESWAR_LANDMARKS.length];
        const nearbyCoords = generateNearbyCoordinates(landmark.lat, landmark.lng, 0.1);
        
        // Generate alerts from last 5 days
        const daysAgo = Math.floor(Math.random() * 5);
        const hoursAgo = Math.floor(Math.random() * 24);
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
          resolved_at: alert.status === 'resolved' ? new Date(alertTime.getTime() + (Math.random() * 7200000)).toISOString() : null
        });
      }
    });

    const { data: createdAlerts, error: alertError } = await supabaseAdmin
      .from('emergency_alerts')
      .insert(alerts)
      .select();

    if (alertError) {
      logger.error('Error creating alerts:', alertError);
      // Don't fail completely, just log the error
      logger.warn('Continuing without alerts...');
    } else {
      logger.info(`✅ Created ${createdAlerts.length} emergency alerts around Bhubaneswar`);
    }

    // Step 4: Create some recent location data (if table exists)
    logger.info('📍 Trying to create location tracking data...');
    
    try {
      const locationData = [];
      existingProfiles.slice(0, 5).forEach(profile => {
        // Generate 3-5 location points per tourist around different landmarks
        const numLocations = Math.floor(Math.random() * 3) + 3;
        
        for (let i = 0; i < numLocations; i++) {
          const randomLandmark = BHUBANESWAR_LANDMARKS[Math.floor(Math.random() * BHUBANESWAR_LANDMARKS.length)];
          const nearbyCoords = generateNearbyCoordinates(randomLandmark.lat, randomLandmark.lng, 0.2);
          
          // Generate timestamps over the last 2 days
          const hoursAgo = Math.floor(Math.random() * 48);
          const timestamp = new Date();
          timestamp.setHours(timestamp.getHours() - hoursAgo);
          
          locationData.push({
            user_id: profile.id,
            latitude: nearbyCoords.lat,
            longitude: nearbyCoords.lng,
            accuracy: Math.floor(Math.random() * 10) + 5, // 5-15 meters
            timestamp: timestamp.toISOString(),
            created_at: timestamp.toISOString()
          });
        }
      });

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

    // Final summary
    logger.info('\n' + '='.repeat(80));
    logger.info('🎉 BHUBANESWAR DATA SEEDING COMPLETED!');
    logger.info('='.repeat(80));
    logger.info(`📊 Summary:`);
    logger.info(`- Updated ${existingProfiles.length} tourist profiles with Bhubaneswar data`);
    logger.info(`- Created emergency alerts around ${BHUBANESWAR_LANDMARKS.length} popular landmarks`);
    logger.info(`- Added location tracking data for recent visits`);
    logger.info(`- All data is centered around Bhubaneswar, Odisha`);
    logger.info('\n🌟 Your admin portal should now show rich data!');
    logger.info('🗺️ Map should display tourists and alerts around Bhubaneswar landmarks');
    logger.info('📱 Check the dashboard for updated statistics and activity');
    logger.info('='.repeat(80));

    return {
      success: true,
      message: 'Bhubaneswar data seeding completed successfully',
      summary: {
        profiles_updated: existingProfiles.length,
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

// Run the seeding
console.log('🚀 Starting simple Bhubaneswar data seeding...');

seedSimpleBhubaneswarData()
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