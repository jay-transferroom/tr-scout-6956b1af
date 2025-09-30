
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, Profile } from '@/types/auth';
import { fetchUserProfile } from '@/services/profileService';
import { ensureDefaultPermissions } from '@/services/permissionService';
import { signUpUser, signInUser, signOutUser, resetPassword } from '@/services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('AuthProvider: Rendering');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const profileData = await fetchUserProfile(userId);
    
    if (profileData) {
      setProfile(profileData);
      
      // Initialize default permissions for recruitment role if they don't exist
      if (profileData.role === 'recruitment') {
        await ensureDefaultPermissions(userId);
      }
      
      return profileData;
    }
    return null;
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile with club information
          setTimeout(async () => {
            await fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session);
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    session,
    loading,
    signUp: signUpUser,
    signIn: signInUser,
    signOut: signOutUser,
    resetPassword,
    refreshProfile,
  };

  console.log('AuthProvider: Providing context with value:', { user: !!user, profile: !!profile, loading });
  
  // Don't render children until initial auth check is complete
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Provide a safe fallback during initialization/HMR to avoid crashes
    return {
      user: null,
      profile: null,
      session: null,
      loading: true,
      signUp: async () => ({ error: new Error('Auth not ready') }),
      signIn: async () => ({ error: new Error('Auth not ready') }),
      signOut: async () => {},
      resetPassword: async () => ({ error: new Error('Auth not ready') }),
      refreshProfile: async () => {},
    } as AuthContextType;
  }
  return context;
}
