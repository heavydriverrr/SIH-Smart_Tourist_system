import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, admin } = useAdminAuth();

  // Debug logging
  console.log('🔐 ProtectedAdminRoute:', { isAuthenticated, loading, admin: admin?.email });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🚫 User not authenticated, redirecting to login');
    return <Navigate to="/admin/login" replace />;
  }

  console.log('✅ User authenticated, rendering admin content');
  return <>{children}</>;
};

export default ProtectedAdminRoute;







