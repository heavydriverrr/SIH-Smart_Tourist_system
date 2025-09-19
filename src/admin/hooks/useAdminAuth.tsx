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
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!admin;

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      const token = localStorage.getItem('admin_token');
      const savedAdmin = localStorage.getItem('admin_user');

      if (token && savedAdmin) {
        try {
          const parsedAdmin = JSON.parse(savedAdmin);
          
          // Check if it's a demo token - if so, skip API verification
          if (token.startsWith('demo-token-')) {
            console.log('🎭 Using demo admin credentials');
            if (isMounted) {
              setAdmin(parsedAdmin);
              setLoading(false);
            }
            return;
          }
          
          // Set admin immediately from stored data
          if (isMounted) {
            setAdmin(parsedAdmin);
          }
          
          // Try to verify real token with timeout - but don't clear auth on failure
          try {
            const verificationPromise = authAPI.verify();
            const timeoutPromise = new Promise((resolve) => 
              setTimeout(() => resolve({ success: false }), 3000)
            );
            
            const response = await Promise.race([verificationPromise, timeoutPromise]) as any;
            
            if (response.success && isMounted) {
              setAdmin(response.admin || parsedAdmin);
              initializeSocket();
            }
            // Don't clear auth on verification failure - keep using stored data
          } catch (error) {
            console.warn('Token verification failed, keeping stored auth:', error);
            // Keep the stored admin data even if verification fails
          }
        } catch (error) {
          console.error('Failed to parse stored admin data:', error);
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          if (isMounted) {
            setAdmin(null);
          }
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    // Set timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 2000); // Reduced timeout

    initAuth().finally(() => clearTimeout(loadingTimeout));
    
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting admin login...', { email });
      console.log('🌐 Environment check:', {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        VITE_FALLBACK_TO_DEMO: import.meta.env.VITE_FALLBACK_TO_DEMO,
        NODE_ENV: import.meta.env.NODE_ENV,
        MODE: import.meta.env.MODE
      });
      
      // Demo credentials - always try this first for reliability
      if (email === 'admin@smartwanderer.com' && password === 'admin123456') {
        console.log('🎭 Setting up demo admin...');
        
        const demoAdmin = {
          id: 'demo-admin-001',
          email: 'admin@smartwanderer.com',
          name: 'Demo Administrator',
          role: 'super_admin' as const,
          created_at: new Date().toISOString()
        };
        
        const demoToken = 'demo-token-' + Date.now();
        
        console.log('💾 Storing demo admin data...', { demoAdmin, demoToken });
        
        // Store auth data first
        localStorage.setItem('admin_token', demoToken);
        localStorage.setItem('admin_user', JSON.stringify(demoAdmin));
        
        console.log('📞 Updating admin state...');
        
        // Use a functional update to ensure state is properly updated
        setAdmin(prevAdmin => {
          console.log('🔄 State updater called. Previous admin:', prevAdmin);
          console.log('🔄 Setting new admin:', demoAdmin);
          return demoAdmin;
        });
        
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







