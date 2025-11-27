import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { API_CONFIG, apiRequest } from '../config/api';
import GoogleLoginButton from './GoogleLoginButton';

interface GoogleUserInfo {
  token: string;
  email: string;
  name: string;
  googleId: string;
  picture: string;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ForgotPasswordModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await apiRequest(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setMessage('Si el email existe, se enviará un enlace de recuperación.');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-container max-w-md mx-auto mt-16 sm:mt-24 md:mt-32 animate-fade-in">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">Recuperar Contraseña</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {message && <div className="text-green-600 text-sm">{message}</div>}
            <div className="form-actions">
              <button type="submit" className="form-button form-button-primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
              <button type="button" className="form-button form-button-secondary" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const RegisterModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiRequest(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone: phone || undefined })
      });
      setSuccess('Registro exitoso. Revisa tu correo para verificar tu cuenta.');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-container max-w-md mx-auto mt-24 animate-fade-in">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">Crear Cuenta</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="form-label">Teléfono <span className="text-elegant-400 text-xs">(opcional)</span></label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <div className="form-actions">
              <button type="submit" className="form-button form-button-primary" disabled={loading || !!success}>
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
              <button type="button" className="form-button form-button-secondary" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ user: User, token: string }>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      await login(data.user, data.token, 'email');

      // Redirigir a admin si es admin/manager
      if (data.user.role === 'ADMIN' || data.user.role === 'MANAGER') {
        console.log('🎯 LoginModal - Admin user detected, redirecting to /admin');
        navigate('/admin');
      }

      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleResponse: GoogleUserInfo) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ user: User, token: string }>(API_CONFIG.ENDPOINTS.AUTH.GOOGLE_VERIFY, {
        method: 'POST',
        body: JSON.stringify({
          token: googleResponse.token,
          email: googleResponse.email,
          name: googleResponse.name,
          googleId: googleResponse.googleId
        })
      });

      await login(data.user, data.token, 'google');

      // Redirigir a admin si es admin/manager
      if (data.user.role === 'ADMIN' || data.user.role === 'MANAGER') {
        console.log('🎯 LoginModal - Admin user detected (Google), redirecting to /admin');
        navigate('/admin');
      }

      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Error en Google Login:', err);
      setError((err as Error).message || 'Error al autenticar con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error: string | Error) => {
    console.error('Error en Google Login:', error);
    setError('Error al autenticar con Google. Intenta de nuevo.');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        {/* Backdrop with blur */}
        <div className="fixed inset-0 bg-elegant-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

        {/* Modal Panel */}
        <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-4xl flex flex-col md:flex-row animate-fade-in">

            {/* Left Side - Lifestyle Image */}
            <div className="hidden md:block md:w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80"
                alt="Luxury Jewelry"
                className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
              />
              <div className="absolute bottom-8 left-8 right-8 z-20 text-white">
                <h3 className="font-serif text-3xl italic mb-2">Olivia Gold</h3>
                <p className="text-sm font-light text-white/90">Descubre la elegancia atemporal en cada detalle.</p>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full md:w-1/2 p-8 md:p-12 bg-white relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                onClick={onClose}
              >
                <span className="sr-only">Cerrar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-8">
                <h2 className="font-serif text-3xl text-elegant-900 mb-2">Bienvenido</h2>
                <p className="text-gray-500 text-sm">Ingresa a tu cuenta para continuar</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-colors bg-gray-50/50"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                    <button
                      type="button"
                      className="text-xs text-gold-600 hover:text-gold-700 font-medium transition-colors"
                      onClick={() => setShowForgot(true)}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-colors bg-gray-50/50"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-medium rounded-lg shadow-lg shadow-gold-500/30 transform transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Ingresando...
                    </span>
                  ) : 'Iniciar Sesión'}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">O continúa con</span>
                  </div>
                </div>

                <div className="w-full">
                  <GoogleLoginButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                  />
                </div>

                <div className="text-center mt-6">
                  <p className="text-sm text-gray-600">
                    ¿No tienes cuenta?{' '}
                    <button
                      type="button"
                      className="font-medium text-gold-600 hover:text-gold-700 transition-colors"
                      onClick={() => { setShowRegister(true); }}
                    >
                      Regístrate aquí
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <ForgotPasswordModal isOpen={showForgot} onClose={() => setShowForgot(false)} />
      <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} />
    </>
  );
};

export default LoginModal;