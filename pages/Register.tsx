import React, { useState, FormEvent } from 'react';
// FIX: Changed react-router-dom import to fix module resolution error.
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabaseService } from '../services/supabaseService';
import { EyeIcon, EyeOffIcon } from '../components/icons';

const Register: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (trimmedPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabaseService.auth.signUp(
        nombre.trim(), 
        usuario.trim(), 
        trimmedPassword, 
        email.trim()
    );
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
    } else {
      setSuccess('¡Cuenta creada! Un administrador revisará tu solicitud y la activará pronto.');
      setTimeout(() => navigate('/login'), 4000); // Redirect to login after 4 seconds
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Crear cuenta en <span className="text-primary-600">Konstruya</span>
        </h2>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
           <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre completo
            </label>
             <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="usuario" className="block text-sm font-medium text-gray-700">
              Nombre de Usuario
            </label>
             <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
           <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
             <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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
           <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar Contraseña
            </label>
            <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2 pr-10 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                 <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                    {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          {success && <p className="text-sm text-green-600 text-center">{success}</p>}
          
          <div>
            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full px-4 py-2 font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
            <p className="text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:underline">
                    Inicia sesión
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
