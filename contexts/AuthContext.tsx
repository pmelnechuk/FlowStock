import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '../types';
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

  // This listener handles session restoration on page load and background changes.
  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user?.id) {
            const { data: profile, error } = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', session.user.id)
              .single();

            // Happy path: Profile found and active
            if (profile && profile.activo) {
              setUser({ ...profile, email: session.user.email as string });
            } 
            // Edge case: Profile found but inactive. Log them out.
            else if (profile && !profile.activo) {
              await supabase.auth.signOut();
              setUser(null);
            }
            // Error case: Profile not found or other DB error.
            // We sign out here to clear the corrupt session from storage,
            // preventing the app from getting stuck on a reload loop.
            else {
              if (error && error.code !== 'PGRST116') {
                 console.error("Error fetching user profile, signing out to clear session:", error);
              }
              await supabase.auth.signOut(); // Force sign out
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } catch (e) {
          console.error("Critical error in onAuthStateChange, signing out:", e);
          await supabase.auth.signOut(); // Force sign out on critical error
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // This function handles the user-initiated sign-in action.
  // It provides immediate feedback to the login form by awaiting the full process.
  const signIn = useCallback(async (email: string, contrasena: string) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: contrasena,
    });

    if (authError || !authData.user) {
        return { error: 'Correo o contraseña incorrectos. Por favor, verifique sus datos.' };
    }

    const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (profileError || !profile) {
        await supabase.auth.signOut(); // Clean up the partial session
        console.error('Profile fetch failed after login:', profileError);
        return { error: 'No se pudo verificar el perfil. Contacte a un administrador.' };
    }

    if (!profile.activo) {
        await supabase.auth.signOut(); // Clean up the session
        return { error: 'Su cuenta no está activa. Contacte a un administrador.' };
    }

    // Success: set user state and return no error
    const fullUser: User = { ...profile, email: authData.user.email as string };
    setUser(fullUser);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will also set user to null,
    // but setting it here provides a faster UI update.
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
