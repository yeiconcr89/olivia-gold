import React, { createContext, useContext, ReactNode } from 'react';
import { useCsrf } from '../hooks/useCsrf';

interface CsrfContextType {
  token: string | null;
  loading: boolean;
  error: string | null;
  fetchCsrfToken: () => Promise<string | null>;
  addCsrfToHeaders: (headers?: Record<string, string>) => Record<string, string>;
  csrfFetch: (url: string, options?: RequestInit) => Promise<Response>;
  getCurrentToken: () => string | null;
}

const CsrfContext = createContext<CsrfContextType | undefined>(undefined);

interface CsrfProviderProps {
  children: ReactNode;
}

/**
 * Provider para manejo global de CSRF tokens
 */
export const CsrfProvider: React.FC<CsrfProviderProps> = ({ children }) => {
  const csrfMethods = useCsrf();

  return (
    <CsrfContext.Provider value={csrfMethods}>
      {children}
    </CsrfContext.Provider>
  );
};

/**
 * Hook para usar el contexto CSRF
 */
export const useCsrfContext = (): CsrfContextType => {
  const context = useContext(CsrfContext);
  if (context === undefined) {
    throw new Error('useCsrfContext must be used within a CsrfProvider');
  }
  return context;
};

/**
 * HOC para agregar protección CSRF a componentes
 */
export const withCsrfProtection = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const CsrfProtectedComponent = (props: P) => {
    const csrf = useCsrfContext();
    
    // Si hay error crítico de CSRF, mostrar mensaje
    if (csrf.error && process.env.NODE_ENV === 'production') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Error de Seguridad
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                No se pudo establecer una conexión segura. Por favor, recarga la página.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Recargar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };

  CsrfProtectedComponent.displayName = `withCsrfProtection(${Component.displayName || Component.name})`;
  
  return CsrfProtectedComponent;
};

export default CsrfContext;