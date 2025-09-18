import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, MapPin, Users, AlertTriangle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (userData: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    emergencyContact: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    const userData = {
      id: '1',
      name: formData.name || 'Tourist User',
      email: formData.email,
      phone: formData.phone,
      safetyScore: 85,
      digitalId: 'TID-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      isVerified: true,
    };
    onLogin(userData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-10 w-10 text-primary-foreground" />
            <h1 className="text-3xl font-bold text-primary-foreground">SmartShield</h1>
          </div>
          <p className="text-primary-foreground/80 text-lg">
            Your Digital Safety Companion
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="text-primary-foreground/90">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Live Tracking</p>
          </div>
          <div className="text-primary-foreground/90">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">SOS Alerts</p>
          </div>
          <div className="text-primary-foreground/90">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Emergency Contacts</p>
          </div>
        </div>

        {/* Login/Register Form */}
        <Card className="shadow-card bg-gradient-card border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? 'Welcome Back' : 'Join SmartShield'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Sign in to access your safety dashboard' 
                : 'Create your digital tourist ID'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required={!isLogin}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      name="emergencyContact"
                      type="tel"
                      placeholder="Emergency contact number"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      required={!isLogin}
                    />
                  </div>
                </>
              )}

              <Button type="submit" variant="hero" size="lg" className="w-full">
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center text-primary-foreground/70 text-xs">
          <p>Protected by blockchain technology & end-to-end encryption</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;