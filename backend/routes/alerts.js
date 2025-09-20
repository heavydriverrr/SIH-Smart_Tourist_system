import express from 'express';
import { query, body, validationResult } from 'express-validator';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateAdmin, requireAlertManager } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// @route   GET api/alerts
// @desc    Get all emergency alerts with filtering
// @access  Private (Admin)
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('offset').optional().isInt({ min: 0 }),
  query('status').optional().isIn(['active', 'acknowledged', 'resolved', 'false_alarm']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: errors.array()
    });
  }

  const { 
    limit = 100, 
    offset = 0, 
    status, 
    priority, 
    date_from, 
    date_to 
  } = req.query;

  try {
    let query = supabaseAdmin
      .from('emergency_alerts')
      .select(`
        *,
        profiles!inner (
          name,
          phone,
          digital_id,
          safety_score
        ),
        admin_users!left (
          name
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    const { data: alerts, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching alerts:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch alerts'
      });
    }

    res.json({
      success: true,
      data: alerts.map(alert => ({
        ...alert,
        tourist: alert.profiles,
        assigned_admin: alert.admin_users,
        profiles: undefined,
        admin_users: undefined
      })),
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    logger.error('Error in get alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// @route   GET api/alerts/stats
// @desc    Get alert statistics
// @access  Private (Admin)
router.get('/stats', asyncHandler(async (req, res) => {
  try {
    // Get overall stats
    const { data: totalAlerts, error: totalError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('id');

    const { data: activeAlerts, error: activeError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('id')
      .eq('status', 'active');

    const { data: resolvedToday, error: todayError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('id')
      .eq('status', 'resolved')
      .gte('created_at', new Date().toISOString().split('T')[0]);

    // Get alerts by priority
    const { data: priorityStats, error: priorityError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('priority')
      .eq('status', 'active');

    // Get recent trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: weeklyAlerts, error: weeklyError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('created_at, status')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (totalError || activeError || todayError || priorityError || weeklyError) {
      logger.error('Error fetching alert stats');
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch alert statistics'
      });
    }

    // Process priority stats
    const priorityCount = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    priorityStats?.forEach(alert => {
      if (alert.priority && priorityCount.hasOwnProperty(alert.priority)) {
        priorityCount[alert.priority]++;
      }
    });

    // Process weekly trends
    const weeklyTrends = {};
    weeklyAlerts?.forEach(alert => {
      const day = alert.created_at.split('T')[0];
      if (!weeklyTrends[day]) {
        weeklyTrends[day] = { total: 0, resolved: 0 };
      }
      weeklyTrends[day].total++;
      if (alert.status === 'resolved') {
        weeklyTrends[day].resolved++;
      }
    });

    res.json({
      success: true,
      data: {
        total_alerts: totalAlerts?.length || 0,
        active_alerts: activeAlerts?.length || 0,
        resolved_today: resolvedToday?.length || 0,
        priority_breakdown: priorityCount,
        weekly_trends: weeklyTrends,
        average_response_time: null // TODO: Calculate based on resolved alerts
      }
    });

  } catch (error) {
    logger.error('Error in get alert stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// @route   GET api/alerts/:id
// @desc    Get specific alert details
// @access  Private (Admin)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const { data: alert, error } = await supabaseAdmin
      .from('emergency_alerts')
      .select(`
        *,
        profiles!inner (
          name,
          phone,
          email,
          digital_id,
          safety_score,
          emergency_contact
        ),
        admin_users!left (
          name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error || !alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...alert,
        tourist: alert.profiles,
        assigned_admin: alert.admin_users,
        profiles: undefined,
        admin_users: undefined
      }
    });

  } catch (error) {
    logger.error('Error in get alert by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// @route   PUT api/alerts/:id/status
// @desc    Update alert status
// @access  Private (Admin with alert management permissions)
router.put('/:id/status', requireAlertManager, [
  body('status').isIn(['active', 'acknowledged', 'resolved', 'false_alarm']),
  body('notes').optional().isString().isLength({ max: 1000 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const { status, notes, priority } = req.body;

  try {
    // Check if alert exists
    const { data: existingAlert, error: fetchError } = await supabaseAdmin
      .from('emergency_alerts')
      .select('id, status, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingAlert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Update alert
    const updateData = {
      status,
      assigned_admin_id: req.admin.id
    };

    if (notes) {
      updateData.admin_notes = notes;
    }

    if (priority) {
      updateData.priority = priority;
    }

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: updatedAlert, error } = await supabaseAdmin
      .from('emergency_alerts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating alert status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update alert status'
      });
    }

    // Log the action
    logger.info(`Alert ${id} status updated to ${status} by admin ${req.admin.id}`);

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin-room').emit('alert-updated', {
      alert_id: id,
      status,
      updated_by: req.admin.name || req.admin.email,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: updatedAlert,
      message: `Alert status updated to ${status}`
    });

  } catch (error) {
    logger.error('Error in update alert status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// @route   POST api/alerts/test
// @desc    Create test alert (for development)
// @access  Private (Admin)
router.post('/test', [
  body('user_id').isUUID(),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('message').optional().isString().isLength({ max: 500 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: errors.array()
    });
  }

  const { user_id, latitude, longitude, message, priority } = req.body;

  try {
    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create test alert
    const { data: alert, error } = await supabaseAdmin
      .from('emergency_alerts')
      .insert({
        user_id,
        latitude,
        longitude,
        message: message || 'Test emergency alert',
        priority: priority || 'medium',
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating test alert:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create test alert'
      });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin-room').emit('new-alert', {
      alert,
      tourist: user
    });

    logger.info(`Test alert created by admin ${req.admin.id} for user ${user_id}`);

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Test alert created successfully'
    });

  } catch (error) {
    logger.error('Error in create test alert:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

export default router;