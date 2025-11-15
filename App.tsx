
import React, { useState, useEffect, useRef } from 'react';
// FIX: Changed react-router-dom import to fix module resolution error.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
import Layout, { ProtectedRoute } from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Movements from './pages/Movements';
import Users from './pages/Users';
import Recipes from './pages/Recipes';
import Welcome from './pages/Welcome';
import { Role } from './types';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';

const SupabaseSetup: React.FC = () => {
    const errorMessage = `
        Aún no has configurado tus credenciales de Supabase.
        <br/><br/>
        Por favor, sigue estos pasos:
        <ol style="list-style-type: decimal; margin-left: 2rem; text-align: left;">
            <li style="margin-bottom: 0.5rem;">Abre el archivo <code>lib/supabaseClient.ts</code> en el editor.</li>
            <li style="margin-bottom: 0.5rem;">Reemplaza los textos <code>"TU_SUPABASE_URL_AQUI"</code> y <code>"TU_SUPABASE_ANON_KEY_AQUI"</code> con tus credenciales reales de Supabase.</li>
            <li style="margin-bottom: 0.5rem;">Puedes encontrar estas credenciales en tu panel de Supabase, en la sección <strong>Project Settings > API</strong>.</li>
            <li>Guarda el archivo para aplicar los cambios.</li>
        </ol>
    `;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f9fafb',
            fontFamily: 'sans-serif',
        }}>
            <div style={{ 
                padding: '2rem', 
                backgroundColor: 'white', 
                border: '1px solid #fee2e2', 
                borderRadius: '8px', 
                maxWidth: '600px', 
                margin: '2rem auto',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>Acción Requerida: Configura Supabase</h1>
                <div style={{ marginTop: '1rem', textAlign: 'left', color: '#374151', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: errorMessage }} />
            </div>
        </div>
    );
};

const PrivateRoutes: React.FC = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/welcome" replace />;
  }
  return <Layout />;
};

const AppRoutes: React.FC = () => {
    const { loading, user, signOut } = useAuth();
    const [showReload, setShowReload] = useState(false);
    const isInitialVisibility = useRef(true);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                if (isInitialVisibility.current) {
                    isInitialVisibility.current = false;
                    return;
                }
                // When returning to the tab, sign out to clear session and trigger a reload.
                signOut();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [signOut]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (loading) {
            timer = setTimeout(() => {
                setShowReload(true);
            }, 8000); // Show button after 8 seconds
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [loading]);

    const handleReload = async () => {
      // Attempt to sign out to clear any lingering session data from storage.
      await supabase.auth.signOut();
      // Then, reload the page for a clean start.
      window.location.reload();
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-gray-600 bg-gray-50">
                <svg className="animate-spin h-12 w-12 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-lg">Cargando aplicación...</p>
                {showReload && (
                    <div className="text-center mt-6 animate-fade-in">
                        <p className="text-sm text-gray-500">Parece que está tardando más de lo normal.</p>
                        <button
                            onClick={handleReload}
                            className="mt-4 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300"
                        >
                            Recargar la página
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/welcome" element={!user ? <Welcome /> : <Navigate to="/" replace />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
            <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<PrivateRoutes />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="productos" element={
                    <ProtectedRoute roles={[Role.ADMIN, Role.SUPERVISOR]}>
                        <Products />
                    </ProtectedRoute>
                } />
                 <Route path="recetas" element={
                    <ProtectedRoute roles={[Role.ADMIN, Role.SUPERVISOR]}>
                        <Recipes />
                    </ProtectedRoute>
                } />
                <Route path="movimientos" element={
                    <ProtectedRoute roles={[Role.ADMIN, Role.OPERARIO, Role.SUPERVISOR]}>
                        <Movements />
                    </ProtectedRoute>
                } />
                <Route path="usuarios" element={
                    <ProtectedRoute roles={[Role.ADMIN]}>
                        <Users />
                    </ProtectedRoute>
                } />
            </Route>

            <Route path="*" element={<Navigate to={user ? "/" : "/welcome"} replace />} />
        </Routes>
    );
}

const App: React.FC = () => {
  if (!isSupabaseConfigured) {
    return <SupabaseSetup />;
  }

  return (
    <ThemeProvider>
        <AuthProvider>
            <HashRouter>
                <AppRoutes />
            </HashRouter>
        </AuthProvider>
    </ThemeProvider>
  );
};

export default App;