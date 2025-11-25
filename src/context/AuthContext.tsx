import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { API_CONFIG, apiRequest, createAuthHeaders } from '../config/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authMethod: 'email' | 'google' | null;
  login: (user: User, token: string, method?: 'email' | 'google') => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<'email' | 'google' | null>(null);

  const isAuthenticated = !!(user && token);

  const validateToken = async (): Promise<boolean> => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return false;

    try {
      const data = await apiRequest<{ user: User }>(API_CONFIG.ENDPOINTS.AUTH.VALIDATE, {
        method: 'GET',
        headers: createAuthHeaders(storedToken)
      });

      if (data.user) {
        setUser(data.user);
        setToken(storedToken);
        const storedMethod = localStorage.getItem('authMethod') as 'email' | 'google' | null;
        setAuthMethod(storedMethod);
        return true;
      }

      // Token inválido, limpiar estado
      await logout();
      return false;
    } catch (error) {
      console.error('Error validating token:', error);
      await logout();
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedMethod = localStorage.getItem('authMethod') as 'email' | 'google' | null;

        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);
            setAuthMethod(storedMethod);

            // Validar token directamente sin usar la función que causa bucles
            const data = await apiRequest<{ user: User }>(API_CONFIG.ENDPOINTS.AUTH.VALIDATE, {
              method: 'GET',
              headers: createAuthHeaders(storedToken)
            });

            if (!data.user) {
              // Si el token no es válido, limpiar todo
              setUser(null);
              setToken(null);
              setAuthMethod(null);
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('authMethod');
            }
          } catch (validationError) {
            // Token inválido, limpiar estado
            console.error('Token validation failed:', validationError);
            setUser(null);
            setToken(null);
            setAuthMethod(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('authMethod');
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        // Si hay un error, limpiamos el estado para evitar inconsistencias
        setUser(null);
        setToken(null);
        setAuthMethod(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('authMethod');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []); // Sin dependencias para evitar bucles

  const login = async (user: User, token: string, method: 'email' | 'google' = 'email'): Promise<void> => {
    try {
      setUser(user);
      setToken(token);
      setAuthMethod(method);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authMethod', method);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Si el usuario se autenticó con Google, cerrar sesión de Google también
      if (authMethod === 'google' && window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }

      // Limpiar estado local
      setUser(null);
      setToken(null);
      setAuthMethod(null);

      // Limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('authMethod');

      // Opcional: Notificar al servidor sobre el logout
      if (token) {
        try {
          await apiRequest(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
            method: 'POST',
            headers: createAuthHeaders(token)
          });
        } catch (error) {
          console.error('Error notifying server about logout:', error);
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Asegurar limpieza local incluso si hay errores
      setUser(null);
      setToken(null);
      setAuthMethod(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('authMethod');
    }
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
      const data = await apiRequest<{ user: User, token: string }>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role: 'CUSTOMER' })
      });

      setUser(data.user);
      setToken(data.token);
      setAuthMethod('email');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('authMethod', 'email');
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    authMethod,
    login,
    logout,
    register,
    validateToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};