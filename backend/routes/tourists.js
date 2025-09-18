import express from 'express';
import { query, validationResult } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// @route   GET api/tourists
// @desc    Get all tourists with their latest locations
// @access  Private (Admin)
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('offset').optional().isInt({ min: 0 }),
  query('active_only').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: errors.array()
    });
  }

  const { limit = 100, offset = 0, active_only = true } = req.query;

  try {
    let query = supabaseAdmin
      .from('profiles')
      .select(`
        id,
        name,
        email,
        phone,
        digital_id,
        is_verified,
        safety_score,
        created_at,
        tourist_locations!inner (
          id,
          latitude,
          longitude,
          address,
          accuracy,
          updated_at
        )
      `)
      .order('updated_at', { foreignTable: 'tourist_locations', ascending: false });

    // Filter for active tourists (those with recent location updates)
    if (active_only === 'true' || active_only === true) {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 24); // Active in last 24 hours
      
      query = query.gte('tourist_locations.updated_at', cutoffTime.toISOString());
    }

    const { data: tourists, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching tourists:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch tourists'
      });
    }

    // Process data to get latest location for each tourist
    const processedTourists = tourists.map(tourist => ({
      ...tourist,
      latest_location: tourist.tourist_locations?.[0] || null,
      tourist_locations: undefined // Remove the raw locations array
    }));

    res.json({
      success: true,
      data: processedTourists,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    logger.error('Error in get tourists:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// @route   GET api/tourists/:id
// @desc    Get specific tourist details with location history
// @access  Private (Admin)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Get tourist profile
    const { data: tourist, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError || !tourist) {
      return res.status(404).json({
        success: false,
        message: 'Tourist not found'
      });
    }

    // Get location history (last 100 locations)
    const { data: locations, error: locationError } = await supabaseAdmin
      .from('tourist_locations')
      .select('*')
      .eq('user_id', id)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (locationError) {
      logger.error('Error fetching tourist locations:', locationError);
    }

    // Get emergency alerts for this tourist
    const { data: alerts, error: alertError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (alertError) {
      logger.error('Error fetching tourist alerts:', alertError);
    }

    res.json({
      success: true,
      data: {
        profile: tourist,
        locations: locations || [],
        alerts: alerts || []
      }
    });

  } catch (error) {
    logger.error('Error in get tourist by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// @route   GET api/tourists/locations/live
// @desc    Get live locations of all active tourists for map display
// @access  Private (Admin)
router.get('/locations/live', asyncHandler(async (req, res) => {
  try {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 30); // Active in last 30 minutes

    const { data: locations, error } = await supabaseAdmin
      .from('tourist_locations')
      .select(`
        id,
        user_id,
        latitude,
        longitude,
        address,
        accuracy,
        updated_at,
        profiles!inner (
          name,
          digital_id,
          safety_score,
          is_verified
        )
      `)
      .gte('updated_at', cutoffTime.toISOString())
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('Error fetching live locations:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch live locations'
      });
    }

    // Group by user_id to get only the latest location per tourist
    const latestLocations = {};
    locations.forEach(location => {
      if (!latestLocations[location.user_id]) {
        latestLocations[location.user_id] = {
          id: location.id,
          user_id: location.user_id,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          accuracy: location.accuracy,
          updated_at: location.updated_at,
          tourist: location.profiles
        };
      }
    });

    res.json({
      success: true,
      data: Object.values(latestLocations),
      count: Object.keys(latestLocations).length
    });

  } catch (error) {
    logger.error('Error in get live locations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// @route   POST api/tourists/:id/location
// @desc    Update tourist location (for testing purposes)
// @access  Private (Admin)
router.post('/:id/location', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude, address, accuracy } = req.body;

  try {
    // Verify tourist exists
    const { data: tourist, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (profileError || !tourist) {
      return res.status(404).json({
        success: false,
        message: 'Tourist not found'
      });
    }

    // Insert or update location
    const { data: location, error } = await supabaseAdmin
      .from('tourist_locations')
      .upsert({
        user_id: id,
        latitude,
        longitude,
        address,
        accuracy: accuracy || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Error updating tourist location:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update location'
      });
    }

    // Emit real-time update to admin dashboard
    const io = req.app.get('io');
    io.to('admin-room').emit('location-update', {
      user_id: id,
      location: location,
      tourist: tourist
    });

    res.json({
      success: true,
      data: location
    });

  } catch (error) {
    logger.error('Error in update tourist location:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

export default router;