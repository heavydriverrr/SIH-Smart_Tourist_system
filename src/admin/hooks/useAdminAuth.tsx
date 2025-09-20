import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, initializeSocket, disconnectSocket } from '@/services/adminApi';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'alert_manager' | 'operator';
  created_at: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  connectionStatus: 'demo' | 'backend' | 'unknown';
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'demo' | 'backend' | 'unknown'>('unknown');

  const isAuthenticated = !!admin;

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      console.log('🔄 Initializing auth state...');
      const token = localStorage.getItem('admin_token');
      const savedAdmin = localStorage.getItem('admin_user');
      
      console.log('💾 Auth data check:', { 
        hasToken: !!token, 
        hasSavedAdmin: !!savedAdmin,
        tokenType: token?.startsWith('demo-token-') ? 'demo' : 'real'
      });

      if (token && savedAdmin) {
        try {
          const parsedAdmin = JSON.parse(savedAdmin);
          
          // Always set the admin immediately to prevent race conditions
          if (isMounted) {
            console.log('📞 Setting admin from stored data:', parsedAdmin.email);
            setAdmin(parsedAdmin);
          }
          
          // Check if it's a demo token - if so, skip API verification
          if (token.startsWith('demo-token-')) {
            console.log('🎭 Using demo admin credentials - no verification needed');
            if (isMounted) {
              setConnectionStatus('demo');
              setLoading(false);
            }
            return;
          }
          
          // For real tokens, try verification but don't clear auth on failure
          try {
            console.log('🔐 Attempting to verify real token...');
            const verificationPromise = authAPI.verify();
            const timeoutPromise = new Promise((resolve) => 
              setTimeout(() => resolve({ success: false }), 3000)
            );
            
            const response = await Promise.race([verificationPromise, timeoutPromise]) as any;
            
            if (response.success && isMounted) {
              console.log('✅ Token verification successful');
              setAdmin(response.admin || parsedAdmin);
              setConnectionStatus('backend');
              initializeSocket();
            } else {
              console.log('⚠️ Token verification failed, but keeping stored auth');
              setConnectionStatus('demo');
              // Don't clear auth - keep using stored data
            }
          } catch (error) {
            console.warn('⚠️ Token verification error, keeping stored auth:', error);
            // Keep the stored admin data even if verification fails
          }
        } catch (error) {
          console.error('❌ Failed to parse stored admin data:', error);
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          if (isMounted) {
            setAdmin(null);
          }
        }
      } else {
        console.log('🚫 No stored auth data found');
      }
      
      if (isMounted) {
        setLoading(false);
        console.log('✅ Auth initialization complete');
      }
    };

    // Set timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('⏰ Auth initialization timeout reached');
        setLoading(false);
      }
    }, 1000); // Reduced timeout to prevent delays

    initAuth().finally(() => {
      clearTimeout(loadingTimeout);
    });
    
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting admin login...', { email });
      console.log('🌐 Full Environment Debug:', {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        VITE_WS_URL: import.meta.env.VITE_WS_URL,
        VITE_FALLBACK_TO_DEMO: import.meta.env.VITE_FALLBACK_TO_DEMO,
        VITE_MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? 'SET' : 'NOT_SET',
        NODE_ENV: import.meta.env.NODE_ENV,
        MODE: import.meta.env.MODE,
        BASE_URL: import.meta.env.BASE_URL,
        PROD: import.meta.env.PROD,
        DEV: import.meta.env.DEV
      });
      
      console.log('🗺️ All available environment variables:');
      console.log(Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
      
      // Always try backend first if we have credentials, regardless of API URL visibility
      const apiUrl = import.meta.env.VITE_API_URL;
      console.log('🔍 API URL check:', { apiUrl, hasApiUrl: !!apiUrl });
      
      // For admin credentials, ALWAYS try backend first
      if (email === 'admin@smartwanderer.com' && password === 'admin123456') {
        console.log('🎭 Admin credentials detected - prioritizing backend connection');
        
        // Force backend attempt even if API URL seems missing
        const backendUrl = apiUrl || 'https://smart-wanderer-backend.onrender.com';
        console.log('🌐 Attempting backend authentication with URL:', backendUrl);
        
        try {
          // Direct API call with explicit URL
          const response = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ email, password })
          });
          
          console.log('🔗 Direct backend response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend API error:', errorText);
            throw new Error(`Backend API failed: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('📥 Backend login response:', data);
          
          if (data.success) {
            const { token, admin: adminData } = data;
            
            console.log('💾 Storing backend admin data...');
            localStorage.setItem('admin_token', token);
            localStorage.setItem('admin_user', JSON.stringify(adminData));
            
            setAdmin(prevAdmin => {
              console.log('🔄 Backend auth state update:', adminData);
              return adminData;
            });
            
            setConnectionStatus('backend');
            initializeSocket();
            console.log('✅ Backend admin login successful!');
            return;
          } else {
            throw new Error('Backend returned success: false');
          }
          
        } catch (backendError: any) {
          console.warn('⚠️ Backend authentication failed:', backendError);
          console.warn('🔍 Backend error details:', {
            message: backendError.message,
            stack: backendError.stack
          });
        }
        
        // Fallback to demo mode
        console.log('🎭 Setting up demo admin fallback...');
        
        const demoAdmin = {
          id: 'demo-admin-001',
          email: 'admin@smartwanderer.com',
          name: 'Demo Administrator',
          role: 'super_admin' as const,
          created_at: new Date().toISOString()
        };
        
        const demoToken = 'demo-token-' + Date.now();
        
        console.log('💾 Storing demo admin data...', { demoAdmin, demoToken });
        
        localStorage.setItem('admin_token', demoToken);
        localStorage.setItem('admin_user', JSON.stringify(demoAdmin));
        
        setAdmin(prevAdmin => {
          console.log('🔄 Demo state updater called. Previous admin:', prevAdmin?.email);
          console.log('🔄 Setting new demo admin:', demoAdmin.email);
          return demoAdmin;
        });
        
        setConnectionStatus('demo');
        console.log('✅ Demo admin login successful! State update initiated.');
        return;
      }
      
      // For any other credentials, try API login but fallback gracefully
      try {
        console.log('🌐 Attempting backend API login...');
        const response = await authAPI.login(email, password);
        console.log('📥 Backend login response:', response);
        
        if (response.success) {
          const { token, admin: adminData } = response;
          
          console.log('💾 Storing backend admin data...');
          // Store auth data
          localStorage.setItem('admin_token', token);
          localStorage.setItem('admin_user', JSON.stringify(adminData));
          
          // Update state
          setAdmin(prevAdmin => {
            console.log('🔄 Backend auth state update:', adminData);
            return adminData;
          });
          
          // Initialize socket connection
          initializeSocket();
          console.log('✅ Backend admin login successful!');
          return;
        }
      } catch (apiError: any) {
        console.warn('⚠️ API login failed:', apiError);
        console.warn('🔍 API Error details:', {
          name: apiError.name,
          message: apiError.message,
          stack: apiError.stack
        });
        
        // Check if this is a network/server error vs authentication error
        const isServerError = 
          apiError.message.includes('Cannot connect to server') || 
          apiError.message.includes('fetch') ||
          apiError.message.includes('Backend temporarily unavailable') ||
          apiError.message.includes('TypeError') ||
          apiError.name === 'TypeError' ||
          apiError.code === 'NETWORK_ERROR';
          
        if (isServerError) {
          console.log('🚫 Server connection issue detected');
          throw new Error('Backend server not available. Please use demo credentials: admin@smartwanderer.com / admin123456');
        }
        
        // If it's not a server error, it's likely an authentication error
        console.log('🔐 Authentication error (not server issue)');
        throw new Error('Invalid credentials. Please use demo credentials: admin@smartwanderer.com / admin123456');
      }
      
      // If we get here, the credentials were invalid
      throw new Error('Invalid credentials. Use demo credentials: admin@smartwanderer.com / admin123456');
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and storage
      setAdmin(null);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      
      // Disconnect socket
      disconnectSocket();
    }
  };

  const value: AdminAuthContextType = {
    admin,
    loading,
    login,
    logout,
    isAuthenticated,
    connectionStatus,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export default useAdminAuth;







