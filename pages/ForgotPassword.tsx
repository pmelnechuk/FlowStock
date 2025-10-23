import React, { useState, FormEvent } from 'react';
// FIX: Changed react-router-dom import to fix module resolution error.
import { Link } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    
    const { error: resetError } = await supabaseService.auth.sendPasswordResetEmail(email.trim());

    if (resetError) {
      setError(resetError);
    } else {
      setMessage('Si existe una cuenta con este correo, recibirás un enlace para restablecer tu contraseña.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Restablecer Contraseña</h2>
        <p className="text-center text-gray-600">
          Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo Electrónico
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

          {message && <p className="text-sm text-green-600 text-center">{message}</p>}
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading || !!message}
              className="w-full px-4 py-2 font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400"
            >
              {loading ? 'Enviando...' : 'Enviar Instrucciones'}
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
          <Link to="/login" className="font-medium text-primary-600 hover:underline">
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
