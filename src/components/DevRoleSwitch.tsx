import React from 'react';
import { User, Shield, Eye, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG, apiRequest } from '../config/api';
import type { User as UserType } from '../types';

interface DevRoleSwitchProps {
  currentRole: 'admin' | 'client';
}

const DevRoleSwitch: React.FC<DevRoleSwitchProps> = ({ currentRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) return null;

  const switchToAdmin = () => {
    navigate('/admin');
  };

  const switchToClient = () => {
    navigate('/');
  };

  const quickAdminLogin = async () => {
    const adminEmail = import.meta.env.VITE_DEV_ADMIN_EMAIL || 'admin@joyceriaelegante.com';
    const adminPassword = import.meta.env.VITE_DEV_ADMIN_PASSWORD || 'admin123';
    
    try {
      // Hacer login real con el API
      const data = await apiRequest<{user: UserType, token: string}>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      
      // Usar la función login del contexto para guardar el estado
      await login(data.user, data.token, 'email');
      navigate('/admin');
    } catch (error: unknown) {
      console.error('Error en login rápido:', error);
      // Mostrar el error de forma visual
      const errorMessage = (error as Error & { response?: { data?: { error?: string } } }).response?.data?.error || 
                           (error as Error).message || 
                           'Credenciales incorrectas';
      alert(`Error de login: ${errorMessage}\n\nCredenciales usadas: ${adminEmail}\n\nVerifica que este usuario exista en tu base de datos o configura las variables VITE_DEV_ADMIN_EMAIL y VITE_DEV_ADMIN_PASSWORD`);
    }
  };

  const isOnAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-2 py-1 bg-orange-50 border border-orange-200 rounded-md">
        <Settings className="h-3 w-3 text-orange-600" />
        <div className="flex items-center gap-1 text-xs">
          {user ? (
            <>
              {currentRole === 'admin' ? (
                <>
                  <Shield className="h-3 w-3 text-red-600" />
                  <span className="text-red-700 font-medium">Admin</span>
                </>
              ) : (
                <>
                  <User className="h-3 w-3 text-blue-600" />
                  <span className="text-blue-700 font-medium">Cliente</span>
                </>
              )}
            </>
          ) : (
            <>
              <User className="h-3 w-3 text-gray-600" />
              <span className="text-gray-700 font-medium">Sin auth</span>
            </>
          )}
        </div>
        
        {/* Botón principal */}
        {!isOnAdminPage ? (
          <button
            onClick={user ? switchToAdmin : quickAdminLogin}
            className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
            title={user ? 'Ver panel de administración' : 'Login rápido como admin'}
          >
            <Shield className="h-3 w-3" />
            <span className="hidden sm:inline">{user ? 'Admin' : 'Login'}</span>
          </button>
        ) : (
          <button
            onClick={switchToClient}
            className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
            title="Ver sitio como cliente"
          >
            <Eye className="h-3 w-3" />
            <span className="hidden sm:inline">Cliente</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DevRoleSwitch;