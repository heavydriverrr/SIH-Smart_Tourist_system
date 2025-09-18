import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

const router = express.Router();

// Temporary in-memory admin user for testing
const testAdmin = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'System Administrator',
  email: 'admin@smartwanderer.com',
  password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123456
  role: 'super_admin',
  is_active: true,
  created_at: new Date().toISOString()
};

// @route   POST api/test-auth/login
// @desc    Test admin login (bypasses Supabase)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check email
    if (email !== testAdmin.email) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, testAdmin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT token
    const payload = {
      id: testAdmin.id,
      email: testAdmin.email,
      role: testAdmin.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '24h'
    });

    logger.info(`Test admin login successful: ${email}`);

    res.json({
      success: true,
      token,
      admin: {
        id: testAdmin.id,
        email: testAdmin.email,
        name: testAdmin.name,
        role: testAdmin.role,
        created_at: testAdmin.created_at
      }
    });

  } catch (error) {
    logger.error('Test login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
});

// @route   POST api/test-auth/verify
// @desc    Verify test JWT token
// @access  Private
router.post('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');

    res.json({
      success: true,
      admin: {
        id: testAdmin.id,
        email: testAdmin.email,
        name: testAdmin.name,
        role: testAdmin.role
      }
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

export default router;