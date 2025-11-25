import React, { useState } from 'react';
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
      const data = await apiRequest<{user: User, token: string}>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      await login(data.user, data.token, 'email');
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
      const data = await apiRequest<{user: User, token: string}>(API_CONFIG.ENDPOINTS.AUTH.GOOGLE_VERIFY, {
        method: 'POST',
        body: JSON.stringify({
          token: googleResponse.token,
          email: googleResponse.email,
          name: googleResponse.name,
          googleId: googleResponse.googleId
        })
      });
      
      await login(data.user, data.token, 'google');
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
      <div className="modal-overlay">
        <div className="modal-backdrop" onClick={onClose} />
        <div className="modal-container max-w-md mx-auto mt-12 sm:mt-24 animate-fade-in">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Iniciar Sesión</h2>
              <button className="modal-close text-2xl" onClick={onClose}>&times;</button>
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
              <div>
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              
              {/* Separador */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">O continúa con</span>
                </div>
              </div>

              {/* Google Login Button */}
              <div className="w-full">
                <GoogleLoginButton 
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2">
                <div className="flex flex-col gap-2 w-full sm:w-auto text-center sm:text-left">
                  <button type="button" className="text-gold-600 text-sm hover:underline" onClick={() => setShowForgot(true)}>
                    ¿Olvidaste tu contraseña?
                  </button>
                  <button type="button" className="text-gold-600 text-sm hover:underline" onClick={() => { setShowRegister(true); }}>
                    ¿No tienes cuenta? Regístrate
                  </button>
                </div>
                <div className="form-actions w-full sm:w-auto">
                  <button type="submit" className="form-button form-button-primary" disabled={loading}>
                    {loading ? 'Ingresando...' : 'Ingresar'}
                  </button>
                  <button type="button" className="form-button form-button-secondary" onClick={onClose}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ForgotPasswordModal isOpen={showForgot} onClose={() => setShowForgot(false)} />
      <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} />
    </>
  );
};

export default LoginModal;