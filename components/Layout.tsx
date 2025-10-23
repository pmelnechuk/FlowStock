import React from 'react';
// FIX: Changed react-router-dom import to fix module resolution error.
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../hooks/useAuth';

const Layout: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    // For visitor mode, we still show the layout but with limited sidebar links.
    // The main content is public (e.g. Dashboard).
    // Specific routes will handle their own protection.
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// A wrapper to protect routes that require authentication
export const ProtectedRoute: React.FC<{ children: React.ReactNode; roles: string[] }> = ({ children, roles }) => {
    const { user } = useAuth();
  
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (!roles.includes(user.rol)) {
        return <Navigate to="/" replace />;
    }
  
    return <>{children}</>;
};

export default Layout;
