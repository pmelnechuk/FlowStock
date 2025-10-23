import React, { useState, FormEvent, useEffect } from 'react';
// FIX: Changed react-router-dom import to fix module resolution error.
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { EyeIcon, EyeOffIcon } from '../components/icons';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase client automatically handles the session from the URL fragment.
    // We listen for the PASSWORD_RECOVERY event to confirm we are in the right state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setIsValidSession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    // The user is already authenticated at this point via the magic link.
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });
    setLoading(false);

    if (updateError) {
      setError(`Error al actualizar la contraseña: ${updateError.message}`);
    } else {
      setSuccess('¡Contraseña actualizada con éxito! Serás redirigido para iniciar sesión.');
      setTimeout(() => navigate('/login'), 4000);
    }
  };

  if (!isValidSession) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-900">Verificando enlace...</h2>
                <p className="mt-2 text-gray-600">
                    Este enlace puede haber expirado o ser inválido. Por favor, solicita un nuevo enlace si es necesario.
                </p>
            </div>
        </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Establecer Nueva Contraseña</h2>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Nueva Contraseña
            </label>
            <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 pr-10 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
            </div>
          </div>
           <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 pr-10 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
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
              className="w-full px-4 py-2 font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-primary-400"
            >
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
