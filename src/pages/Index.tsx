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
    let isMounted = true;
    
    // Shorter timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('Index: Loading timeout reached, stopping loading');
        setLoading(false);
      }
    }, 3000); // 3 second timeout
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Index: Auth state changed', event, !!session);
        clearTimeout(loadingTimeout);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Create a basic user profile if none exists
          let profile = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Tourist',
            phone: session.user.user_metadata?.phone || '',
            emergency_contact: session.user.user_metadata?.emergency_contact || '',
            created_at: session.user.created_at
          };
          
          // Try to fetch existing profile, but don't wait forever
          try {
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            const timeoutPromise = new Promise((resolve) => 
              setTimeout(() => resolve({ data: null }), 2000)
            );
            
            const result = await Promise.race([profilePromise, timeoutPromise]) as any;
            
            if (result?.data) {
              profile = { ...profile, ...result.data };
            }
          } catch (error) {
            console.error('Index: Error fetching profile (using defaults)', error);
          }
          
          if (isMounted) {
            setUserProfile(profile);
          }
        } else {
          if (isMounted) {
            setUserProfile(null);
          }
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // Check for existing session with faster timeout
    Promise.race([
      supabase.auth.getSession(),
      new Promise((resolve) => 
        setTimeout(() => resolve({ data: { session: null } }), 2000)
      )
    ])
      .then((result: any) => {
        if (!isMounted) return;
        
        const session = result?.data?.session;
        console.log('Index: Initial session check', !!session);
        clearTimeout(loadingTimeout);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        
        console.error('Index: Error getting session', error);
        clearTimeout(loadingTimeout);
        setLoading(false);
      });

    return () => {
      isMounted = false;
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

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Use user profile if available, otherwise create basic profile from user data
  const currentProfile = userProfile || {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Tourist',
    phone: user.user_metadata?.phone || '',
    emergency_contact: user.user_metadata?.emergency_contact || '',
    created_at: user.created_at
  };

  return <TouristDashboard user={currentProfile} onLogout={handleLogout} />;
};

export default Index;
