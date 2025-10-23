import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '../types';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, contrasena: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user?.email) {
            // If there's a session, fetch our custom user profile
            const { data: profile, error } = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (error && error.code !== 'PGRST116') {
              console.error("Error fetching user profile:", error);
            }

            if (profile && profile.activo) {
              // Merge profile data with email from auth user
              const fullUser: User = { ...profile, email: session.user.email };
              setUser(fullUser);
            } else {
              // Profile not found, inactive, or fetch failed, so force logout
              await supabase.auth.signOut();
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } catch (e) {
          console.error("Critical error in onAuthStateChange:", e);
          // In case of a critical error, ensure user is logged out.
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, contrasena: string) => {
    // The component handles its own loading state. We just call the service.
    // The onAuthStateChange listener will automatically update the user state.
    const { error } = await supabaseService.auth.signIn(email, contrasena);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabaseService.auth.signOut();
    // The onAuthStateChange listener will handle setting user to null.
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};