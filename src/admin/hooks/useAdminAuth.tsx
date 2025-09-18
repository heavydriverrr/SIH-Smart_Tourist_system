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
    const initAuth = async () => {
      const token = localStorage.getItem('admin_token');
      const savedAdmin = localStorage.getItem('admin_user');

      if (token && savedAdmin) {
        try {
          const parsedAdmin = JSON.parse(savedAdmin);
          // Verify token is still valid
          const response = await authAPI.verify();
          if (response.success) {
            setAdmin(response.admin || parsedAdmin);
            initializeSocket();
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting admin login...', { email });
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
      if (error.message === 'Network Error') {
        throw new Error('Cannot connect to server. Please ensure the backend is running on port 3001.');
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







