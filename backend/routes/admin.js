import express from 'express';
import { query, validationResult } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateAdmin, requireSuperAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// @route   GET api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin)
router.get('/dashboard', asyncHandler(async (req, res) => {
  try {
    // Get active tourists count
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 1); // Active in last hour

    const { data: activeTourists, error: touristError } = await supabaseAdmin
      .from('tourist_locations')
      .select('user_id')
      .gte('updated_at', cutoffTime.toISOString());

    const uniqueActiveTourists = new Set(activeTourists?.map(t => t.user_id) || []).size;

    // Get total tourists
    const { data: totalTourists, error: totalTouristsError } = await supabaseAdmin
      .from('profiles')
      .select('id');

    // Get active alerts
    const { data: activeAlerts, error: alertsError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get alerts resolved today
    const today = new Date().toISOString().split('T')[0];
    const { data: resolvedToday, error: resolvedError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('id')
      .eq('status', 'resolved')
      .gte('resolved_at', today);

    // Get recent activities (last 50 location updates)
    const { data: recentActivities, error: activitiesError } = await supabaseAdmin
      .from('tourist_locations')
      .select(`
        id,
        user_id,
        latitude,
        longitude,
        address,
        updated_at,
        profiles!inner (
          name,
          digital_id
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(50);

    // Check for errors
    if (touristError || totalTouristsError || alertsError || resolvedError || activitiesError) {
      logger.error('Error fetching dashboard data:', {
        touristError,
        totalTouristsError,
        alertsError,
        resolvedError,
        activitiesError
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data'
      });
    }

    // Calculate safety score average
    const { data: safetyScores, error: safetyError } = await supabaseAdmin
      .from('profiles')
      .select('safety_score')
      .not('safety_score', 'is', null);

    let averageSafetyScore = 0;
    if (!safetyError && safetyScores?.length > 0) {
      const totalScore = safetyScores.reduce((sum, profile) => sum + (profile.safety_score || 0), 0);
      averageSafetyScore = Math.round(totalScore / safetyScores.length);
    }

    res.json({
      success: true,
      data: {
        stats: {
          active_tourists: uniqueActiveTourists,
          total_tourists: totalTourists?.length || 0,
          active_alerts: activeAlerts?.length || 0,
          alerts_resolved_today: resolvedToday?.length || 0,
          average_safety_score: averageSafetyScore
        },
        active_alerts: activeAlerts || [],
        recent_activities: recentActivities?.map(activity => ({
          id: activity.id,
          type: 'location_update',
          user_id: activity.user_id,
          tourist_name: activity.profiles?.name,
          digital_id: activity.profiles?.digital_id,
          location: {
            latitude: activity.latitude,
            longitude: activity.longitude,
            address: activity.address
          },
          timestamp: activity.updated_at
        })) || []
      }
    });

  } catch (error) {
    logger.error('Error in admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// @route   GET api/admin/users
// @desc    Get admin users list
// @access  Private (Super Admin)
router.get('/users', requireSuperAdmin, [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: errors.array()
    });
  }

  const { limit = 50, offset = 0 } = req.query;

  try {
    const { data: admins, error, count } = await supabaseAdmin
      .from('admin_users')
      .select('id, name, email, role, is_active, created_at, last_login_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching admin users:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch admin users'
      });
    }

    res.json({
      success: true,
      data: admins,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    logger.error('Error in get admin users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// @route   GET api/admin/system-status
// @desc    Get system status and health metrics
// @access  Private (Admin)
router.get('/system-status', asyncHandler(async (req, res) => {
  try {
    const startTime = Date.now();

    // Test database connection
    const { error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    const dbLatency = Date.now() - startTime;
    const dbStatus = dbError ? 'error' : 'healthy';

    // Get recent error logs count
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // System metrics
    const systemInfo = {
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      cpu_usage: process.cpuUsage(),
      node_version: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development'
    };

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: dbStatus,
            latency: `${dbLatency}ms`,
            error: dbError?.message || null
          },
          api: {
            status: 'healthy',
            uptime: `${Math.floor(systemInfo.uptime)}s`
          }
        },
        system: {
          uptime: systemInfo.uptime,
          memory: {
            used: Math.round(systemInfo.memory_usage.heapUsed / 1024 / 1024),
            total: Math.round(systemInfo.memory_usage.heapTotal / 1024 / 1024)
          },
          environment: systemInfo.environment,
          node_version: systemInfo.node_version
        }
      }
    });

  } catch (error) {
    logger.error('Error in system status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system status',
      data: {
        status: 'error',
        timestamp: new Date().toISOString()
      }
    });
  }
}));

// @route   GET api/admin/activity-log
// @desc    Get system activity log
// @access  Private (Admin)
router.get('/activity-log', [
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('offset').optional().isInt({ min: 0 }),
  query('type').optional().isIn(['login', 'alert_update', 'location_update', 'system'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: errors.array()
    });
  }

  const { limit = 100, offset = 0, type } = req.query;

  try {
    // For now, we'll return recent activities from tourist locations and emergency alerts
    // In a full implementation, you'd have a dedicated activity log table

    let activities = [];

    // Get recent location updates
    const { data: locationUpdates, error: locationError } = await supabaseAdmin
      .from('tourist_locations')
      .select(`
        id,
        user_id,
        updated_at,
        profiles!inner (
          name,
          digital_id
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (!locationError && locationUpdates) {
      activities.push(...locationUpdates.map(update => ({
        id: `location_${update.id}`,
        type: 'location_update',
        description: `Location updated for tourist ${update.profiles?.name} (${update.profiles?.digital_id})`,
        user_id: update.user_id,
        timestamp: update.updated_at,
        metadata: {
          tourist_name: update.profiles?.name,
          digital_id: update.profiles?.digital_id
        }
      })));
    }

    // Get recent alert updates
    const { data: alertUpdates, error: alertError } = await supabaseAdmin
      .from('emergency_alerts')
      .select(`
        id,
        user_id,
        status,
        created_at,
        updated_at,
        profiles!inner (
          name,
          digital_id
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (!alertError && alertUpdates) {
      activities.push(...alertUpdates.map(alert => ({
        id: `alert_${alert.id}`,
        type: 'alert_update',
        description: `Emergency alert ${alert.status} for tourist ${alert.profiles?.name} (${alert.profiles?.digital_id})`,
        user_id: alert.user_id,
        timestamp: alert.updated_at || alert.created_at,
        metadata: {
          tourist_name: alert.profiles?.name,
          digital_id: alert.profiles?.digital_id,
          alert_status: alert.status
        }
      })));
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply type filter if specified
    if (type) {
      activities = activities.filter(activity => activity.type === type);
    }

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedActivities,
      pagination: {
        total: activities.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    logger.error('Error in activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

export default router;