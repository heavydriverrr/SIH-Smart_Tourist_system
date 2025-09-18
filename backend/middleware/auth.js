import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';
import logger from '../config/logger.js';

// Verify JWT token and authenticate admin
export const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify admin exists in database
    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('id', decoded.id)
      .single();

    if (error || !admin) {
      logger.warn(`Invalid admin token attempt: ${decoded.id}`);
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }

    if (!admin.is_active) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Account is deactivated'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Access denied',
      message: 'Invalid token'
    });
  }
};

// Check if admin has specific role
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to check if admin is super admin
export const requireSuperAdmin = requireRole(['super_admin']);

// Middleware to check if admin can manage alerts
export const requireAlertManager = requireRole(['super_admin', 'alert_manager', 'operator']);

export default {
  authenticateAdmin,
  requireRole,
  requireSuperAdmin,
  requireAlertManager
};