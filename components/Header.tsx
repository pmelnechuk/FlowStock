import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogoutIcon } from './icons';
// FIX: Changed react-router-dom import to fix module resolution error.
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Panel de Inventario</h1>
      </div>
      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="font-semibold text-gray-700">{user.nombre}</p>
              <p className="text-sm text-gray-500">{user.rol}</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              title="Cerrar sesión"
            >
              <LogoutIcon className="h-6 w-6" />
            </button>
          </div>
        ) : (
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            Iniciar Sesión
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
