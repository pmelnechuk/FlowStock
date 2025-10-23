import React, { useState, FormEvent } from 'react';
// FIX: Changed react-router-dom import to fix module resolution error.
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlertTriangleIcon, EyeIcon, EyeOffIcon } from '../components/icons';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password.trim());
    setLoading(false);
    if (signInError) {
      setError(signInError);
    } else {
      navigate('/');
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Bienvenido a <span className="text-primary-600">Konstruya</span>
        </h2>
        <p className="text-center text-gray-600">
          Inicia sesión para continuar.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
           <div>
            <label htmlFor="email-input" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
             <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="text-sm">
                    <Link to="/forgot-password" className="font-medium text-primary-600 hover:underline">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
            </div>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full px-3 py-2 pr-10 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start p-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200" role="alert">
              <AlertTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              <div>
                {error}
              </div>
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
            <p className="text-gray-600">
                ¿No tienes una cuenta?{' '}
                <Link to="/register" className="font-medium text-primary-600 hover:underline">
                    Regístrate
                </Link>
            </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
