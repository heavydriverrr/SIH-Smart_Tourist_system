import React, { useState } from 'react';
import LoginPage from '@/components/auth/LoginPage';
import TouristDashboard from '@/components/dashboard/TouristDashboard';

const Index = () => {
  const [user, setUser] = useState<any>(null);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <TouristDashboard user={user} onLogout={handleLogout} />;
};

export default Index;
