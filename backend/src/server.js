import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import routes
import authRoutes from '../routes/auth.js';
import testAuthRoutes from '../routes/test-auth.js';
import adminRoutes from '../routes/admin.js';
import touristRoutes from '../routes/tourists.js';
import alertRoutes from '../routes/alerts.js';

// Import middleware
import { errorHandler } from '../middleware/errorHandler.js';
import { requestLogger } from '../middleware/requestLogger.js';

// Import utilities
import logger from '../config/logger.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:8080",
      process.env.ADMIN_FRONTEND_URL || "http://localhost:3000"
    ],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration for browser compatibility
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:8080",
      "http://localhost:8081", 
      "http://localhost:3000",
      "http://127.0.0.1:8080",
      "http://127.0.0.1:8081",
      // Production frontends
      process.env.FRONTEND_URL,
      process.env.ADMIN_FRONTEND_URL,
      /https:\/\/.*\.vercel\.app$/,
      /https:\/\/.*\.netlify\.app$/,
      /https:\/\/.*\.pages\.dev$/
    ].filter(Boolean);
    
    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      // Allow all origins in development, strict in production
      callback(null, process.env.NODE_ENV !== 'production');
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use(requestLogger);

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test endpoint for CORS
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/test-auth', testAuthRoutes); // Temporary test auth route
app.use('/api/admin', adminRoutes);
app.use('/api/tourists', touristRoutes);
app.use('/api/alerts', alertRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Admin client connected: ${socket.id}`);

  // Join admin room for real-time updates
  socket.on('join-admin', (adminData) => {
    socket.join('admin-room');
    logger.info(`Admin ${adminData.id} joined admin room`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`Admin client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware (should be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Smart Wanderer Admin Server running on port ${PORT}`);
  logger.info(`📊 Admin Dashboard: http://localhost:${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;