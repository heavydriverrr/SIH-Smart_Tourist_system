import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const ADMIN_API_BASE_URL = import.meta.env.VITE_API_URL || 'https://smart-wanderer-backend.onrender.com';

// Create axios instance with default config
const adminApi = axios.create({
  baseURL: `${ADMIN_API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Authentication endpoints (real Supabase with fallback)
export const authAPI = {
  login: async (email: string, password: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://smart-wanderer-backend.onrender.com';
    const fallbackToDemo = import.meta.env.VITE_FALLBACK_TO_DEMO === 'true';
    
    console.log('🔗 AuthAPI using URL:', apiUrl);
    
    // Skip demo mode check - always try backend first
    if (apiUrl.includes('your-backend')) {
      console.log('🎭 Placeholder API URL detected, using demo mode only');
      throw new Error('Cannot connect to server. Please ensure the backend is running.');
    }
    
    try {
      console.log('🔗 Attempting API login to:', apiUrl);
      
      // Try API call with proper error handling
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      console.log('🔗 Auth response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Auth error:', errorData);
        
        // If backend returns 401/403, it's a credential issue, not connection
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid credentials');
        }
        
        // For other errors, might be backend issue - fallback if enabled
        if (fallbackToDemo) {
          console.log('🔄 Backend error, will fallback to demo if demo credentials used');
          throw new Error('Backend temporarily unavailable');
        }
        
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Backend auth success:', data.success);
      return data;
      
    } catch (error: any) {
      console.error('❌ Network/API error during login:', error);
      console.error('🔍 Full error object:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      // Handle different types of errors
      if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        console.log('🚫 Network error - backend may be sleeping or unavailable');
        if (fallbackToDemo) {
          throw new Error('Cannot connect to backend server. Using demo credentials: admin@smartwanderer.com / admin123456');
        }
        throw new Error('Cannot connect to server. Please ensure the backend is running.');
      }
      
      // Handle rate limit or server configuration errors
      if (error.message.includes('rate limit') || error.message.includes('ValidationError') || error.message.includes('trust proxy')) {
        console.log('🚫 Backend configuration error detected');
        if (fallbackToDemo) {
          throw new Error('Backend temporarily unavailable');
        }
        throw new Error('Backend server configuration error');
      }
      
      // Handle other network errors
      if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
        throw new Error('Network error - backend may be unavailable');
      }
      
      // Re-throw other errors
      throw error;
    }
  },

  logout: async () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    return { success: true, message: 'Logged out successfully' };
  },

  verify: async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      throw new Error('No token found');
    }
    
    const apiUrl = import.meta.env.VITE_API_URL || 'https://smart-wanderer-backend.onrender.com';
    const response = await fetch(`${apiUrl}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
};

// Tourist management endpoints
export const touristAPI = {
  getTourists: async (params?: {
    limit?: number;
    offset?: number;
    active_only?: boolean;
  }) => {
    try {
      const response = await adminApi.get('/tourists', { params });
      return response.data;
    } catch (error) {
      console.log('🔄 Using mock tourist data for demo');
      return { success: true, data: mockTouristLocations };
    }
  },

  getTourist: async (id: string) => {
    try {
      const response = await adminApi.get(`/tourists/${id}`);
      return response.data;
    } catch (error) {
      const tourist = mockTouristLocations.find(t => t.id === id);
      return { success: true, data: tourist };
    }
  },

  getLiveLocations: async () => {
    try {
      const response = await adminApi.get('/tourists/locations/live');
      return response.data;
    } catch (error) {
      console.log('🔄 Using mock location data for demo');
      return { success: true, data: mockTouristLocations };
    }
  },

  updateTouristLocation: async (
    id: string,
    location: {
      latitude: number;
      longitude: number;
      address?: string;
      accuracy?: number;
    }
  ) => {
    const response = await adminApi.post(`/tourists/${id}/location`, location);
    return response.data;
  },
};

// Alerts management endpoints
export const alertsAPI = {
  getAlerts: async (params?: {
    limit?: number;
    offset?: number;
    status?: string;
    priority?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    const response = await adminApi.get('/alerts', { params });
    return response.data;
  },

  getAlert: async (id: string) => {
    const response = await adminApi.get(`/alerts/${id}`);
    return response.data;
  },

  getAlertStats: async () => {
    try {
      const response = await adminApi.get('/alerts/stats');
      return response.data;
    } catch (error) {
      console.log('🔄 Using mock alert stats for demo');
      return { success: true, data: mockAlertStats };
    }
  },

  updateAlertStatus: async (
    id: string,
    update: {
      status: 'active' | 'acknowledged' | 'resolved' | 'false_alarm';
      notes?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }
  ) => {
    const response = await adminApi.put(`/alerts/${id}/status`, update);
    return response.data;
  },

  createTestAlert: async (alert: {
    user_id: string;
    latitude: number;
    longitude: number;
    message?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    const response = await adminApi.post('/alerts/test', alert);
    return response.data;
  },
};

// Import mock data
import { mockDashboardData, mockTouristLocations, mockAlertStats } from './mockAdminData';

// Admin dashboard endpoints
export const adminDashboardAPI = {
  getDashboardData: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('API failed');
      }
      
      return await response.json();
    } catch (error) {
      console.log('🔄 Using mock dashboard data for demo');
      return { success: true, data: mockDashboardData };
    }
  },

  getAdminUsers: async (params?: {
    limit?: number;
    offset?: number;
  }) => {
    const response = await adminApi.get('/admin/users', { params });
    return response.data;
  },

  getSystemStatus: async () => {
    const response = await adminApi.get('/admin/system-status');
    return response.data;
  },

  getActivityLog: async (params?: {
    limit?: number;
    offset?: number;
    type?: string;
  }) => {
    const response = await adminApi.get('/admin/activity-log', { params });
    return response.data;
  },
};

// Socket.IO client for real-time updates
let socket: Socket | null = null;

export const initializeSocket = () => {
  if (socket) {
    socket.disconnect();
  }

  const token = localStorage.getItem('admin_token');
  if (!token) return null;

  socket = io(ADMIN_API_BASE_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Admin socket connected:', socket?.id);
    const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
    socket?.emit('join-admin', adminUser);
  });

  socket.on('disconnect', () => {
    console.log('Admin socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Location update service for tourist app
export const locationAPI = {
  updateLocation: async (location: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  }) => {
    try {
      const response = await axios.post(`${ADMIN_API_BASE_URL}/api/tourists/location`, location);
      return response.data;
    } catch (error) {
      console.error('Failed to update location:', error);
      throw error;
    }
  },
};

export default adminApi;