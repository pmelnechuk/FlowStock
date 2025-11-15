import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, Role, UserStatus } from '../types';
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
        if (!session?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const { data: profile, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error("Error fetching user profile:", error);
            setUser(null);
            // The profile is now created by a DB trigger, so we don't need to handle its absence here.
            // If there's an error, it's likely a network issue or RLS misconfiguration.
          } else if (profile && profile.status === UserStatus.ACTIVO) {
            setUser(profile as User);
          } else {
            // Profile exists but is not active, or another error occurred.
            setUser(null);
          }
        } catch (e) {
          console.error("Critical error while fetching profile:", e);
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

  const signIn = useCallback(async (email: string, contrasena:string) => {
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
        await supabase.auth.signOut();
        console.error('Profile fetch failed after login:', profileError);
        return { error: 'No se pudo verificar el perfil. Contacte a un administrador.' };
    }

    if (profile.status !== UserStatus.ACTIVO) {
        await supabase.auth.signOut();
        return { error: 'Su cuenta no está activa. Contacte a un administrador.' };
    }

    setUser(profile as User);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.reload();
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};