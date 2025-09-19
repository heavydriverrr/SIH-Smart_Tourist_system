import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import LoginPage from '@/components/auth/LoginPage';
import TouristDashboard from '@/components/dashboard/TouristDashboard';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Index: Starting auth initialization');
    
    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('Index: Loading timeout reached, stopping loading');
      setLoading(false);
    }, 5000); // 5 second timeout
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Index: Auth state changed', event, !!session);
        clearTimeout(loadingTimeout);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            setUserProfile(profile);
          } catch (error) {
            console.error('Index: Error fetching profile', error);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session with error handling
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('Index: Initial session check', !!session);
        clearTimeout(loadingTimeout);
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Index: Error getting session', error);
        clearTimeout(loadingTimeout);
        setLoading(false);
      });

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (userData: any) => {
    // This is handled by the auth state change listener
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <img src="/trusttour-logo.svg" alt="TrustTour" className="h-16 w-16 mx-auto mb-4" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">TrustTour</h2>
          <p className="mt-2 text-gray-600">Loading your secure travel dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <TouristDashboard user={userProfile} onLogout={handleLogout} />;
};

export default Index;
