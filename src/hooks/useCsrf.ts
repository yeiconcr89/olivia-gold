import { useState, useEffect, useCallback } from 'react';

interface CsrfState {
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface CsrfResponse {
  csrfToken: string;
  timestamp: number;
}

/**
 * Hook para manejar tokens CSRF
 */
export const useCsrf = () => {
  const [state, setState] = useState<CsrfState>({
    token: null,
    loading: false,
    error: null
  });

  /**
   * Obtener token CSRF del servidor
   */
  const fetchCsrfToken = useCallback(async (): Promise<string | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include', // Incluir cookies de sesión
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CsrfResponse = await response.json();
      
      setState({
        token: data.csrfToken,
        loading: false,
        error: null
      });

      return data.csrfToken;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error obteniendo token CSRF';
      setState({
        token: null,
        loading: false,
        error: errorMessage
      });
      
      console.error('Error fetching CSRF token:', error);
      return null;
    }
  }, []);

  /**
   * Obtener token desde cookie (fallback)
   */
  const getTokenFromCookie = useCallback((): string | null => {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf-token') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }, []);

  /**
   * Obtener token actual (de estado o cookie)
   */
  const getCurrentToken = useCallback((): string | null => {
    return state.token || getTokenFromCookie();
  }, [state.token, getTokenFromCookie]);

  /**
   * Agregar token CSRF a headers de request
   */
  const addCsrfToHeaders = useCallback((headers: Record<string, string> = {}): Record<string, string> => {
    const token = getCurrentToken();
    if (token) {
      return {
        ...headers,
        'x-csrf-token': token
      };
    }
    return headers;
  }, [getCurrentToken]);

  /**
   * Wrapper para fetch que incluye token CSRF automáticamente
   */
  const csrfFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = getCurrentToken();
    
    // Si no hay token y es un método que lo requiere, obtenerlo
    const method = options.method?.toUpperCase() || 'GET';
    const requiresToken = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    
    if (requiresToken && !token) {
      token = await fetchCsrfToken();
    }

    // Preparar headers con token CSRF
    const headers = new Headers(options.headers);
    if (token && requiresToken) {
      headers.set('x-csrf-token', token);
    }

    // Realizar request
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Incluir cookies de sesión
    });

    // Si falla por token inválido, intentar obtener nuevo token y reintentar
    if (response.status === 403 && requiresToken) {
      const newToken = await fetchCsrfToken();
      if (newToken) {
        headers.set('x-csrf-token', newToken);
        return fetch(url, {
          ...options,
          headers,
          credentials: 'include'
        });
      }
    }

    return response;
  }, [getCurrentToken, fetchCsrfToken]);

  /**
   * Obtener token al montar el componente
   */
  useEffect(() => {
    // Solo obtener token en producción o si está configurado
    if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
      fetchCsrfToken();
    }
  }, [fetchCsrfToken]);

  return {
    token: getCurrentToken(),
    loading: state.loading,
    error: state.error,
    fetchCsrfToken,
    addCsrfToHeaders,
    csrfFetch,
    getCurrentToken
  };
};

interface AxiosInstance {
  interceptors: {
    request: {
      use: (onFulfilled: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>, onRejected?: (error: unknown) => unknown) => void;
    };
  };
}

interface AxiosRequestConfig {
  method?: string;
  headers: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Wrapper de axios que incluye token CSRF
 */
export const createCsrfAxiosInterceptor = (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.request.use(
    async (config: AxiosRequestConfig) => {
      // Solo agregar token CSRF en métodos que lo requieren
      const requiresToken = !['get', 'head', 'options'].includes(config.method?.toLowerCase());
      
      if (requiresToken && process.env.NODE_ENV === 'production') {
        try {
          const response = await fetch('/api/csrf-token', {
            credentials: 'include'
          });
          if (response.ok) {
            const { csrfToken } = await response.json();
            config.headers['x-csrf-token'] = csrfToken;
          }
        } catch (error) {
          console.warn('Could not fetch CSRF token:', error);
        }
      }
      
      return config;
    },
    (error: unknown) => Promise.reject(error)
  );

  return axiosInstance;
};

export default useCsrf;