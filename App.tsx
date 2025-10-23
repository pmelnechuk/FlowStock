import React from 'react';
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
import { Role } from './types';
import { isSupabaseConfigured } from './lib/supabaseClient';

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


const AppRoutes: React.FC = () => {
    const { loading } = useAuth();
    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando...</div>
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="productos" element={
                    <ProtectedRoute roles={[Role.ADMIN]}>
                        <Products />
                    </ProtectedRoute>
                } />
                <Route path="movimientos" element={
                    <ProtectedRoute roles={[Role.ADMIN, Role.OPERARIO]}>
                        <Movements />
                    </ProtectedRoute>
                } />
                <Route path="usuarios" element={
                    <ProtectedRoute roles={[Role.ADMIN]}>
                        <Users />
                    </ProtectedRoute>
                } />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
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
