import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { API_CONFIG, apiRequest, createAuthHeaders } from '../../config/api';

interface ConnectionStatus {
  api: 'loading' | 'success' | 'error';
  database: 'loading' | 'success' | 'error';
  payments: 'loading' | 'success' | 'error';
}

const PaymentsTestConnection: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    api: 'loading',
    database: 'loading',
    payments: 'loading',
  });
  const [error, setError] = useState<string | null>(null);

  const testConnections = async () => {
    try {
      // Test API connection
      try {
        await apiRequest(`${API_CONFIG.BASE_URL}/api/health`, { timeout: 5000 });
        setStatus(prev => ({ ...prev, api: 'success' }));
      } catch {
        setStatus(prev => ({ ...prev, api: 'error' }));
      }

      // Test database connection (through health endpoint)
      try {
        await apiRequest(`${API_CONFIG.BASE_URL}/api/health`, { timeout: 5000 });
        setStatus(prev => ({ ...prev, database: 'success' }));
      } catch {
        setStatus(prev => ({ ...prev, database: 'error' }));
      }

      // Test payments API (protected)
      try {
        await apiRequest(`${API_CONFIG.BASE_URL}/api/admin/payments/health`, {
          headers: createAuthHeaders(),
          timeout: 5000,
        });
        setStatus(prev => ({ ...prev, payments: 'success' }));
      } catch (err: unknown) {
        setStatus(prev => ({ ...prev, payments: 'error' }));
        let msg = 'Error connecting to payments API';
        if (err && typeof err === 'object' && 'response' in err) {
            const response = err.response as { data?: { message?: string; error?: string } };
            if (response.data) {
                msg = response.data.message || response.data.error || msg;
            }
        }
        setError(msg);
      }
    } catch (err) {
      console.error('Connection test error:', err);
      setStatus({
        api: 'error',
        database: 'error',
        payments: 'error',
      });
      setError(err instanceof Error ? err.message : 'Unknown connection error');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    testConnections();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'loading':
        return 'Conectando...';
      case 'success':
        return 'Conectado';
      case 'error':
        return 'Error';
      default:
        return 'Desconocido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading':
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const allConnected = Object.values(status).every(s => s === 'success');

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Estado de Conexiones
        </h3>
        <button
          onClick={testConnections}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          Probar Conexiones
        </button>
      </div>

      <div className="space-y-3">
        {/* API Connection */}
        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status.api)}
            <span className="font-medium text-gray-900">API Backend</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(status.api)}`}>
            {getStatusText(status.api)}
          </span>
        </div>

        {/* Database Connection */}
        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status.database)}
            <span className="font-medium text-gray-900">Base de Datos</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(status.database)}`}>
            {getStatusText(status.database)}
          </span>
        </div>

        {/* Payments API Connection */}
        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status.payments)}
            <span className="font-medium text-gray-900">API de Pagos</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(status.payments)}`}>
            {getStatusText(status.payments)}
          </span>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`mt-4 p-3 rounded-lg ${
        allConnected 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-center space-x-2">
          {allConnected ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          )}
          <span className={`font-medium ${
            allConnected ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {allConnected 
              ? '✅ Todas las conexiones están funcionando correctamente'
              : '⚠️ Algunas conexiones tienen problemas'
            }
          </span>
        </div>
      </div>

      {/* Error Details */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Error de Conexión:</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!allConnected && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Instrucciones:</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Asegúrate de que el backend esté corriendo en el puerto 3001</li>
                <li>• Verifica que la base de datos PostgreSQL esté activa</li>
                <li>• Ejecuta <code className="bg-blue-100 px-1 rounded">npm run db:seed:payments</code> para crear datos de prueba</li>
                <li>• Revisa las variables de entorno en el archivo .env</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsTestConnection;