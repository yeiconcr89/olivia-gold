import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { API_CONFIG, apiRequest } from '../config/api';
import GoogleLoginButton from './GoogleLoginButton';
import { Eye, EyeOff, ArrowLeft, X } from 'lucide-react';

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

type AuthView = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // State
  const [view, setView] = useState<AuthView>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setError('');
    setSuccessMessage('');
    setLoading(false);
    setShowPassword(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setView('LOGIN');
      resetForm();
    }, 300);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ user: User, token: string }>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      await login(data.user, data.token, 'email');

      if (data.user.role === 'ADMIN' || data.user.role === 'MANAGER') {
        navigate('/admin');
      }

      handleClose();
      onSuccess?.();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiRequest(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone: phone || undefined })
      });
      setSuccessMessage('Registro exitoso. Por favor inicia sesión.');
      setTimeout(() => {
        setView('LOGIN');
        setSuccessMessage('Tu cuenta ha sido creada. Inicia sesión para continuar.');
        setPassword('');
      }, 2000);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiRequest(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setSuccessMessage('Si el email existe, recibirás un enlace de recuperación.');
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

      if (data.user.role === 'ADMIN' || data.user.role === 'MANAGER') {
        navigate('/admin');
      }

      handleClose();
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Error en Google Login:', err);
      setError((err as Error).message || 'Error al autenticar con Google');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-elegant-900/60 backdrop-blur-sm transition-opacity" onClick={handleClose} />

      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-4xl flex flex-col md:flex-row animate-fade-in">

          {/* Left Side - Abstract Gold Texture */}
          <div className="hidden md:block md:w-5/12 relative overflow-hidden bg-elegant-900">
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&q=80"
              alt="Gold Texture"
              className="h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 flex flex-col justify-between p-12 z-20 text-white">
              <div>
                <h3 className="font-serif text-4xl italic mb-4">Olivia Gold</h3>
                <div className="w-12 h-1 bg-gold-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-lg font-light text-white/90 italic leading-relaxed">
                  "La joyería no es solo un accesorio, es una expresión de quién eres."
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Dynamic Form */}
          <div className="w-full md:w-7/12 p-8 md:p-12 bg-white relative flex flex-col justify-center min-h-[600px]">
            <button
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 z-10"
              onClick={handleClose}
            >
              <X className="h-6 w-6" />
            </button>

            {/* Back Button for non-login views */}
            {view !== 'LOGIN' && (
              <button
                className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 flex items-center gap-2 text-sm font-medium"
                onClick={() => {
                  setView('LOGIN');
                  setError('');
                  setSuccessMessage('');
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
            )}

            <div className="max-w-sm mx-auto w-full">
              <div className="text-center mb-8">
                <h2 className="font-serif text-3xl text-elegant-900 mb-2">
                  {view === 'LOGIN' && 'Bienvenido'}
                  {view === 'REGISTER' && 'Crear Cuenta'}
                  {view === 'FORGOT_PASSWORD' && 'Recuperar Acceso'}
                </h2>
                <p className="text-gray-500 text-sm">
                  {view === 'LOGIN' && 'Ingresa a tu cuenta para continuar'}
                  {view === 'REGISTER' && 'Únete a nuestra comunidad exclusiva'}
                  {view === 'FORGOT_PASSWORD' && 'Ingresa tu email para restablecer tu contraseña'}
                </p>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-100 text-green-700 text-sm flex items-center animate-fade-in">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center animate-fade-in">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* LOGIN FORM */}
              {view === 'LOGIN' && (
                <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-colors bg-gray-50/50"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                      <button
                        type="button"
                        className="text-xs text-gold-600 hover:text-gold-700 font-medium transition-colors"
                        onClick={() => setView('FORGOT_PASSWORD')}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-colors bg-gray-50/50 pr-10"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-medium rounded-lg shadow-lg shadow-gold-500/30 transform transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                    disabled={loading}
                  >
                    {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                  </button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">O continúa con</span>
                    </div>
                  </div>

                  <GoogleLoginButton
                    onSuccess={handleGoogleSuccess}
                    onError={(err) => setError('Error con Google Login')}
                  />

                  <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                      ¿No tienes cuenta?{' '}
                      <button
                        type="button"
                        className="font-medium text-gold-600 hover:text-gold-700 transition-colors"
                        onClick={() => setView('REGISTER')}
                      >
                        Regístrate aquí
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* REGISTER FORM */}
              {view === 'REGISTER' && (
                <form onSubmit={handleRegister} className="space-y-5 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-colors bg-gray-50/50"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-colors bg-gray-50/50"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-colors bg-gray-50/50 pr-10"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-gray-400 text-xs font-normal">(Opcional)</span></label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-colors bg-gray-50/50"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+57 300 123 4567"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-medium rounded-lg shadow-lg shadow-gold-500/30 transform transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                    disabled={loading}
                  >
                    {loading ? 'Registrando...' : 'Crear Cuenta'}
                  </button>

                  <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                      ¿Ya tienes cuenta?{' '}
                      <button
                        type="button"
                        className="font-medium text-gold-600 hover:text-gold-700 transition-colors"
                        onClick={() => setView('LOGIN')}
                      >
                        Inicia Sesión
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* FORGOT PASSWORD FORM */}
              {view === 'FORGOT_PASSWORD' && (
                <form onSubmit={handleForgotPassword} className="space-y-5 animate-fade-in">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-50 mb-4">
                      <svg className="w-8 h-8 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 16.236a1 1 0 01-.17.265l-2.573 2.573a1.1 0 01-1.656-1.549l.828-.828a1 1 0 011.414 0 1 1 0 001.414-1.414l-.828-.828a1 1 0 011.414-1.414l.828-.828a1 1 0 011.414-1.414l1.414-1.414a1 1 0 01.265-.17z" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Registrado</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-colors bg-gray-50/50"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="tu@email.com"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-medium rounded-lg shadow-lg shadow-gold-500/30 transform transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                  </button>

                  <div className="text-center mt-6">
                    <button
                      type="button"
                      className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                      onClick={() => setView('LOGIN')}
                    >
                      Volver al inicio de sesión
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;