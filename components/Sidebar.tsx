import React from 'react';
// FIX: Changed react-router-dom import to fix module resolution error.
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';
import { DashboardIcon, ProductsIcon, MovementsIcon, UsersIcon, RecipeBookIcon } from './icons';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-2 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-primary-500 text-white'
        : 'text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <aside className="w-64 flex-shrink-0 bg-white p-4 border-r border-gray-200">
      <div className="flex items-center mb-8">
        <span className="text-2xl font-bold text-primary-600">Konstruya</span>
      </div>
      <nav className="space-y-2">
        <NavLink to="/" className={navLinkClasses}>
          <DashboardIcon className="h-5 w-5 mr-3" />
          Dashboard
        </NavLink>
        
        {(user?.rol === Role.ADMIN) && (
          <NavLink to="/productos" className={navLinkClasses}>
            <ProductsIcon className="h-5 w-5 mr-3" />
            Productos
          </NavLink>
        )}
        
        <NavLink to="/recetas" className={navLinkClasses}>
            <RecipeBookIcon className="h-5 w-5 mr-3" />
            Recetas
        </NavLink>

        {(user?.rol === Role.ADMIN || user?.rol === Role.OPERARIO) && (
          <NavLink to="/movimientos" className={navLinkClasses}>
            <MovementsIcon className="h-5 w-5 mr-3" />
            Movimientos
          </NavLink>
        )}

        {user?.rol === Role.ADMIN && (
          <NavLink to="/usuarios" className={navLinkClasses}>
            <UsersIcon className="h-5 w-5 mr-3" />
            Usuarios
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;