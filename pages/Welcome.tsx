import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Welcome: React.FC = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-2xl mx-auto text-center p-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Bienvenido a <span className="text-primary-600">FlowStock</span>
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Por favor, inicia sesión para continuar o regístrate si aún no tienes una cuenta.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3 text-lg font-semibold text-white bg-primary-600 rounded-lg shadow-md hover:bg-primary-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Iniciar Sesión
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3 text-lg font-semibold text-primary-600 bg-white border-2 border-primary-600 rounded-lg shadow-md hover:bg-primary-50 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Registrarse
          </Link>
        </div>
      </div>
      <footer className="absolute bottom-4 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} FlowStock. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Welcome;