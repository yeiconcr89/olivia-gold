import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Cloud, Settings, Database, HardDrive, Image, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { API_CONFIG, apiRequest, createAuthHeaders } from '../config/api';
import type { CloudinaryStats, CloudinaryUploadResponse } from '../types/cloudinary';

const CloudinarySettings: React.FC = () => {
  const [stats, setStats] = useState<CloudinaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const { token } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!token) {
      setError('No estás autenticado');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<CloudinaryStats>(API_CONFIG.ENDPOINTS.UPLOAD.STATS, {
        headers: createAuthHeaders(token),
        timeout: 8000,
      });
      
      if (!data.usage) {
        throw new Error('La configuración de Cloudinary no está establecida correctamente');
      }
      
      setStats(data);
    } catch (err: any) {
      let errorMessage = 'Error al cargar estadísticas de Cloudinary';
      
      if (err.response?.data?.error === 'Credenciales de Cloudinary no configuradas correctamente') {
        errorMessage = 'Las credenciales de Cloudinary no están configuradas. Por favor, configura las variables de entorno CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.';
      } else if (err.response?.data?.details) {
        errorMessage = `Error de Cloudinary: ${err.response.data.details}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Error al cargar estadísticas:', {
        error: err,
        response: err.response?.data,
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const testConnection = async () => {
    setTestResult(null);
    
    try {
      // Primero verificar si podemos obtener estadísticas básicas
      console.log('🔍 Probando conexión con Cloudinary...');
      
      // Intentar subir una pequeña imagen de prueba
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.fillText('Test', 35, 50);
      }
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setTestResult({
            success: false,
            message: 'No se pudo crear la imagen de prueba'
          });
          return;
        }
        
        const testFile = new File([blob], 'test-connection.png', { type: 'image/png' });
        const formData = new FormData();
        formData.append('file', testFile); // Usar 'file' como nombre del campo (debe coincidir con el backend)
        formData.append('folder', 'tests');
        
        try {
          console.log('📤 Subiendo imagen de prueba...');
          const data = await apiRequest<CloudinaryUploadResponse>(API_CONFIG.ENDPOINTS.UPLOAD.SINGLE, {
            method: 'POST',
            headers: createAuthHeaders(token || undefined),
            body: formData,
            timeout: 10000,
          });
          
          console.log('✅ Upload exitoso:', data);
          
          setTestResult({
            success: true,
            message: `✅ Conexión exitosa. Imagen subida: ${data.image.url.split('/').pop()}`
          });
          
          // Refrescar estadísticas después de un breve delay
          setTimeout(() => {
            console.log('🔄 Refrescando estadísticas...');
            fetchStats();
          }, 2000);
          
        } catch (e: any) {
          console.error('❌ Error en upload:', e);
          const errorMsg = e?.response?.data?.error || 
                          e?.response?.data?.message ||
                          (e instanceof Error ? e.message : 'Error al probar la conexión');
          
          setTestResult({
            success: false,
            message: `❌ ${errorMsg}`
          });
        }
        
      }, 'image/png');
      
    } catch (err) {
      console.error('❌ Error general:', err);
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error al probar la conexión'
      });
    }
  };

  const formatBytes = (bytes: number | undefined | null, showZero = true): string => {
    // Manejar valores undefined, null o NaN
    if (bytes === undefined || bytes === null || isNaN(bytes)) {
      return 'Datos no disponibles';
    }
    
    if (bytes < 0) {
      return 'Valor inválido';
    }
    
    if (bytes === 0) {
      return showZero ? '0 Bytes' : 'Sin uso registrado';
    }
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    // Verificar que el índice sea válido
    if (i < 0 || i >= sizes.length) {
      return 'Valor muy grande';
    }
    
    const value = bytes / Math.pow(k, i);
    return parseFloat(value.toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number | undefined | null): string => {
    // Manejar valores undefined, null o NaN
    if (num === undefined || num === null || isNaN(num)) {
      return 'No disponible';
    }
    
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-elegant p-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-elegant-600">Cargando configuración de Cloudinary...</p>
      </div>
    );
  }

  if (error) {
    const isConfigError = error.includes('credenciales') || error.includes('configuración');
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Error de configuración</h3>
          <p className="text-red-600 text-center">{error}</p>
        </div>
        
        {isConfigError && (
          <div className="bg-white rounded-lg p-6 mb-6">
            <h4 className="font-medium text-elegant-800 mb-3">Guía de configuración:</h4>
            <ol className="list-decimal list-inside space-y-2 text-elegant-600">
              <li>Crea una cuenta en <a href="https://cloudinary.com/users/register/free" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:underline">Cloudinary</a></li>
              <li>Ve al Dashboard y copia tus credenciales:</li>
              <ul className="list-disc list-inside ml-6 space-y-1 text-sm">
                <li>Cloud Name</li>
                <li>API Key</li>
                <li>API Secret</li>
              </ul>
              <li>Actualiza el archivo <code className="bg-elegant-100 px-2 py-1 rounded">.env</code> del backend con:</li>
              <pre className="bg-elegant-900 text-elegant-100 p-4 rounded-lg text-sm mt-2 overflow-auto">
                <code>{`CLOUDINARY_CLOUD_NAME="tu-cloud-name"
CLOUDINARY_API_KEY="tu-api-key"
CLOUDINARY_API_SECRET="tu-api-secret"`}</code>
              </pre>
              <li>Reinicia el servidor backend</li>
            </ol>
          </div>
        )}
        
        <div className="text-center">
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-elegant p-6">
        <div className="flex items-center mb-4">
          <Cloud className="h-8 w-8 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-blue-800">Configuración de Cloudinary</h2>
        </div>
        
        <p className="text-blue-700 mb-6">
          Cloudinary es el servicio utilizado para almacenar y gestionar todas las imágenes de productos y contenido del sitio.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="flex items-center text-lg font-medium text-elegant-800 mb-3">
              <Settings className="h-5 w-5 mr-2 text-blue-500" />
              Estado de la conexión
            </h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-green-700">Configuración cargada correctamente</span>
              </div>
              <p className="text-sm text-elegant-600">
                Cloud Name: {import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'No configurado'}
              </p>
            </div>
            
            <button
              onClick={testConnection}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Probar conexión
            </button>
            
            {testResult && (
              <div className={`mt-4 p-3 rounded-lg ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {testResult.success ? (
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{testResult.message}</span>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="flex items-center text-lg font-medium text-elegant-800 mb-3">
              <Database className="h-5 w-5 mr-2 text-blue-500" />
              Límites y restricciones
            </h3>
            
            <ul className="space-y-2 text-elegant-700">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Tamaño máximo: {stats?.limits?.maxFileSize || '5MB'}
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Formatos permitidos: {stats?.limits?.allowedFormats?.join(', ') || 'JPEG, PNG, WebP, GIF'}
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Máximo de archivos por subida: {stats?.limits?.maxFilesPerUpload || 10}
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {stats && (
        <div className="bg-white rounded-xl shadow-elegant p-6">
          <h3 className="flex items-center text-lg font-medium text-elegant-800 mb-6">
            <HardDrive className="h-6 w-6 mr-2 text-elegant-600" />
            Estadísticas de uso
          </h3>
          
          {/* Diagnóstico de datos */}
          {(!stats.usage?.storage && !stats.usage?.bandwidth) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800 mb-1">Datos de uso no disponibles</h4>
                  <p className="text-sm text-amber-700 mb-2">
                    Las estadísticas de almacenamiento y ancho de banda no están disponibles. Esto puede deberse a:
                  </p>
                  <ul className="text-sm text-amber-700 space-y-1 ml-4">
                    <li>• La API de Cloudinary no está configurada correctamente en el backend</li>
                    <li>• Las credenciales de Cloudinary son inválidas</li>
                    <li>• El plan de Cloudinary no incluye estadísticas de uso</li>
                    <li>• Es una cuenta nueva sin datos de uso aún</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-elegant-50 rounded-lg p-4">
              <p className="text-sm text-elegant-600 mb-1">Almacenamiento</p>
              <p className="text-2xl font-bold text-elegant-900">{formatBytes(stats.usage?.storage, false)}</p>
              {stats.usage?.storage === undefined && (
                <p className="text-xs text-amber-600 mt-1">⚠️ Configurar API de Cloudinary</p>
              )}
            </div>
            <div className="bg-elegant-50 rounded-lg p-4">
              <p className="text-sm text-elegant-600 mb-1">Ancho de banda</p>
              <p className="text-2xl font-bold text-elegant-900">{formatBytes(stats.usage?.bandwidth, false)}</p>
              {stats.usage?.bandwidth === undefined && (
                <p className="text-xs text-amber-600 mt-1">⚠️ Configurar API de Cloudinary</p>
              )}
            </div>
            <div className="bg-elegant-50 rounded-lg p-4">
              <p className="text-sm text-elegant-600 mb-1">Recursos</p>
              <p className="text-2xl font-bold text-elegant-900">{formatNumber(stats.usage?.resources)}</p>
              {(stats.usage?.resources === undefined || stats.usage?.resources === 0) && (
                <p className="text-xs text-blue-600 mt-1">ℹ️ {stats.usage?.resources === 0 ? 'Sin imágenes subidas' : 'Datos no disponibles'}</p>
              )}
            </div>
            <div className="bg-elegant-50 rounded-lg p-4">
              <p className="text-sm text-elegant-600 mb-1">Solicitudes</p>
              <p className="text-2xl font-bold text-elegant-900">{formatNumber(stats.usage?.requests)}</p>
              {(stats.usage?.requests === undefined || stats.usage?.requests === 0) && (
                <p className="text-xs text-blue-600 mt-1">ℹ️ {stats.usage?.requests === 0 ? 'Sin solicitudes registradas' : 'Datos no disponibles'}</p>
              )}
            </div>
          </div>
          
          <h4 className="flex items-center text-md font-medium text-elegant-800 mb-4">
            <Image className="h-5 w-5 mr-2 text-elegant-600" />
            Distribución por carpetas
          </h4>
          
          <div className="overflow-hidden bg-elegant-50 rounded-xl">
            <table className="min-w-full divide-y divide-elegant-200">
              <thead className="bg-elegant-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">
                    Carpeta
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">
                    Imágenes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-elegant-200">
                {stats.folders?.map((folder) => (
                  <tr key={folder.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-elegant-900">
                      {folder.name || 'Sin nombre'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-elegant-600">
                      {formatNumber(folder.count)}
                    </td>
                  </tr>
                )) || []}
                {(!stats.folders || stats.folders.length === 0) && (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-elegant-500">
                      No hay carpetas configuradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl shadow-elegant p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="h-6 w-6 text-amber-600 mr-3" />
          <h3 className="text-lg font-medium text-amber-800">Recomendaciones</h3>
        </div>
        
        <ul className="space-y-3 text-amber-700">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 mt-2"></span>
            <span>Optimiza las imágenes antes de subirlas para reducir el uso de almacenamiento y mejorar el rendimiento.</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 mt-2"></span>
            <span>Utiliza la transformación de imágenes de Cloudinary para generar miniaturas y versiones optimizadas.</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 mt-2"></span>
            <span>Organiza las imágenes en carpetas según su uso: productos, seo, banners, etc.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CloudinarySettings;