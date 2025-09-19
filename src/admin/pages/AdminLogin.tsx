import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../hooks/useAdminAuth';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated, loading: authLoading, admin } = useAdminAuth();
  const navigate = useNavigate();

  // Debug logging
  console.log('🚪 AdminLogin:', { isAuthenticated, authLoading, admin: admin?.email });
  
  // Monitor auth state changes
  useEffect(() => {
    console.log('📊 Auth state changed in AdminLogin:', { isAuthenticated, admin: admin?.email });
    if (isAuthenticated && admin) {
      console.log('🚀 Auth state detected, should redirect soon...');
    }
  }, [isAuthenticated, admin]);

  // Redirect if already authenticated
  if (authLoading) {
    console.log('⌛ Admin auth loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    console.log('✅ Admin already authenticated, redirecting to dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📋 Form submitted with:', { email });
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');
    console.log('🔑 Starting login process...');

    try {
      await login(email, password);
      console.log('✅ Login successful, waiting for auth state change');
      
      // Add a small delay to check if auth state is properly updated
      setTimeout(() => {
        console.log('🔄 Checking auth state after login delay...');
        console.log('Current isAuthenticated:', isAuthenticated);
      }, 200);
      
      // Don't manually navigate - let the auth state change trigger the redirect
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 flex items-center justify-center">
            <img src="/trusttour-logo.svg" alt="TrustTour" className="h-14 w-14" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">TrustTour Admin</CardTitle>
            <CardDescription>
              Sign in to access the administrative dashboard
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@trusttour.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>Default credentials (development):</p>
            <p className="font-mono text-xs mt-1">
              admin@smartwanderer.com / admin123456
            </p>
            <p className="text-xs mt-1 text-blue-600">
              Note: Using legacy credentials for demo
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;







