import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockTourists = [
  {
    id: '1',
    user_id: 'user1',
    latitude: 26.1665,
    longitude: 91.7047,
    address: 'Near Kamakhya Temple, Guwahati',
    accuracy: 5,
    updated_at: new Date().toISOString(),
    tourist: {
      name: 'Raj Kumar',
      digital_id: 'GWT001',
      safety_score: 85,
      is_verified: true
    }
  },
  {
    id: '2',
    user_id: 'user2',
    latitude: 26.1844,
    longitude: 91.7458,
    address: 'Umananda Island, Guwahati',
    accuracy: 8,
    updated_at: new Date(Date.now() - 5 * 60000).toISOString(),
    tourist: {
      name: 'Priya Singh',
      digital_id: 'GWT002',
      safety_score: 92,
      is_verified: true
    }
  },
  {
    id: '3',
    user_id: 'user3',
    latitude: 26.1150,
    longitude: 91.8050,
    address: 'Near Forest Area, Guwahati',
    accuracy: 15,
    updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
    tourist: {
      name: 'Mike Johnson',
      digital_id: 'GWT003',
      safety_score: 45,
      is_verified: false
    }
  }
];

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@smartwanderer.com' && password === 'admin123456') {
    res.json({
      success: true,
      token: 'demo-token-' + Date.now(),
      admin: {
        id: 'admin-001',
        email: 'admin@smartwanderer.com',
        name: 'Demo Administrator',
        role: 'super_admin',
        created_at: new Date().toISOString()
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Verify admin token
app.get('/api/admin/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && token.startsWith('demo-token')) {
    res.json({
      success: true,
      admin: {
        id: 'admin-001',
        email: 'admin@smartwanderer.com',
        name: 'Demo Administrator',
        role: 'super_admin',
        created_at: new Date().toISOString()
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Get tourist locations
app.get('/api/admin/tourists/locations', (req, res) => {
  res.json({
    success: true,
    data: mockTourists
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Admin connected:', socket.id);

  // Simulate real-time location updates
  const locationUpdateInterval = setInterval(() => {
    const randomTourist = mockTourists[Math.floor(Math.random() * mockTourists.length)];
    const locationUpdate = {
      ...randomTourist,
      latitude: randomTourist.latitude + (Math.random() - 0.5) * 0.001,
      longitude: randomTourist.longitude + (Math.random() - 0.5) * 0.001,
      updated_at: new Date().toISOString()
    };
    
    socket.emit('location-update', locationUpdate);
  }, 10000); // Every 10 seconds

  socket.on('disconnect', () => {
    console.log('Admin disconnected:', socket.id);
    clearInterval(locationUpdateInterval);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Smart Wanderer Admin API is running',
    timestamp: new Date().toISOString()
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Smart Wanderer Admin API running on port ${PORT}`);
  console.log(`📍 Tourist locations endpoint: http://localhost:${PORT}/api/admin/tourists/locations`);
  console.log(`🔐 Admin login: http://localhost:${PORT}/api/admin/login`);
  console.log(`📡 Socket.IO ready for real-time updates`);
});