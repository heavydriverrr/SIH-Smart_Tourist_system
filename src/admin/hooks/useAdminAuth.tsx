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
          
          // Set admin immediately from stored data
          if (isMounted) {
            setAdmin(parsedAdmin);
          }
          
          // Try to verify token with timeout
          const verificationPromise = authAPI.verify();
          const timeoutPromise = new Promise((resolve) => 
            setTimeout(() => resolve({ success: false }), 3000)
          );
          
          const response = await Promise.race([verificationPromise, timeoutPromise]) as any;
          
          if (response.success) {
            if (isMounted) {
              setAdmin(response.admin || parsedAdmin);
              initializeSocket();
            }
          } else {
            // Token invalid or timeout, clear storage
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            if (isMounted) {
              setAdmin(null);
            }
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
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
    }, 4000);

    initAuth().finally(() => clearTimeout(loadingTimeout));
    
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting admin login...', { email });
      
      // Demo credentials bypass for development
      if (email === 'admin@smartwanderer.com' && password === 'admin123456') {
        const demoAdmin = {
          id: 'demo-admin-001',
          email: 'admin@smartwanderer.com',
          name: 'Demo Administrator',
          role: 'super_admin' as const,
          created_at: new Date().toISOString()
        };
        
        const demoToken = 'demo-token-' + Date.now();
        
        // Store auth data
        localStorage.setItem('admin_token', demoToken);
        localStorage.setItem('admin_user', JSON.stringify(demoAdmin));
        
        // Update state
        setAdmin(demoAdmin);
        
        console.log('✅ Demo admin login successful!');
        return;
      }
      
      // Try real API login
      const response = await authAPI.login(email, password);
      console.log('📥 Login response:', response);
      
      if (response.success) {
        const { token, admin: adminData } = response;
        
        // Store auth data
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify(adminData));
        
        // Update state
        setAdmin(adminData);
        
        // Initialize socket connection
        initializeSocket();
        console.log('✅ Admin login successful!');
      } else {
        console.error('❌ Login failed:', response.message);
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      if (error.message === 'Network Error' || error.code === 'ECONNREFUSED') {
        throw new Error('Backend server not available. Using demo credentials: admin@smartwanderer.com / admin123456');
      }
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
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







