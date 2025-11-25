import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import usePayments from '../../hooks/usePayments';

interface PaymentStatusProps {
  className?: string;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({ className = '' }) => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const { verifyPayment, loading } = usePayments();
  
  const [status, setStatus] = useState<{
    state: 'loading' | 'success' | 'failed' | 'pending' | 'error';
    message: string;
    transactionId?: string;
    orderId?: string;
    amount?: number;
    gateway?: string;
  }>({
    state: 'loading',
    message: 'Verificando el estado del pago...'
  });

  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const checkPaymentStatus = async () => {
    if (!transactionId) return;

    try {
      const result = await verifyPayment(transactionId);
      
      switch (result.status) {
        case 'approved':
          setStatus({
            state: 'success',
            message: 'Tu pago ha sido procesado exitosamente',
            transactionId: result.transactionId
          });
          break;
          
        case 'rejected':
        case 'failed':
          setStatus({
            state: 'failed',
            message: result.message || 'El pago fue rechazado',
            transactionId: result.transactionId
          });
          break;
          
        case 'pending':
          setStatus({
            state: 'pending',
            message: 'Tu pago está siendo procesado',
            transactionId: result.transactionId
          });
          
          // Retry after 3 seconds if still pending
          if (retryCount < maxRetries) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              checkPaymentStatus();
            }, 3000);
          }
          break;
          
        default:
          setStatus({
            state: 'error',
            message: 'No se pudo verificar el estado del pago'
          });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus({
        state: 'error',
        message: 'Error al verificar el estado del pago'
      });
    }
  };

  useEffect(() => {
    if (transactionId) {
      checkPaymentStatus();
    }
  }, [transactionId]);

  const handleRetry = () => {
    setRetryCount(0);
    setStatus({
      state: 'loading',
      message: 'Verificando el estado del pago...'
    });
    checkPaymentStatus();
  };

  const handleBackToShop = () => {
    navigate('/');
  };

  const handleViewOrder = () => {
    if (status.orderId) {
      navigate(`/orders/${status.orderId}`);
    } else {
      navigate('/orders');
    }
  };

  const getStatusIcon = () => {
    switch (status.state) {
      case 'loading':
        return <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-16 h-16 text-red-500" />;
      default:
        return <AlertCircle className="w-16 h-16 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status.state) {
      case 'success':
        return 'text-green-600';
      case 'failed':
      case 'error':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      case 'loading':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusTitle = () => {
    switch (status.state) {
      case 'loading':
        return 'Verificando Pago...';
      case 'success':
        return '¡Pago Exitoso!';
      case 'failed':
        return 'Pago Rechazado';
      case 'pending':
        return 'Pago Pendiente';
      case 'error':
        return 'Error de Verificación';
      default:
        return 'Estado Desconocido';
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
      <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
        {/* Status Icon */}
        <div className="mb-6">
          {getStatusIcon()}
        </div>

        {/* Status Title */}
        <h2 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {getStatusTitle()}
        </h2>

        {/* Status Message */}
        <p className="text-gray-600 mb-6">
          {status.message}
        </p>

        {/* Transaction ID */}
        {status.transactionId && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">ID de Transacción:</p>
            <p className="text-sm font-mono text-gray-800 break-all">
              {status.transactionId}
            </p>
          </div>
        )}

        {/* Pending State - Show retry info */}
        {status.state === 'pending' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-yellow-800">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Verificando... ({retryCount + 1}/{maxRetries + 1})
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              Este proceso puede tomar unos minutos
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {status.state === 'success' && (
            <>
              <button
                onClick={handleViewOrder}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Ver Pedido
              </button>
              <button
                onClick={handleBackToShop}
                className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Continuar Comprando
              </button>
            </>
          )}

          {(status.state === 'failed' || status.state === 'error') && (
            <>
              <button
                onClick={handleRetry}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Verificando...
                  </div>
                ) : (
                  'Verificar Nuevamente'
                )}
              </button>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Intentar Otro Método
              </button>
              <button
                onClick={handleBackToShop}
                className="w-full text-gray-600 py-2 px-4 rounded-lg hover:text-gray-800 transition-colors"
              >
                Volver a la Tienda
              </button>
            </>
          )}

          {status.state === 'pending' && retryCount >= maxRetries && (
            <>
              <button
                onClick={handleRetry}
                disabled={loading}
                className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Verificar Manualmente
              </button>
              <button
                onClick={handleBackToShop}
                className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Volver a la Tienda
              </button>
            </>
          )}

          {status.state === 'loading' && (
            <div className="text-sm text-gray-500">
              Por favor espera mientras verificamos tu pago...
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            ¿Necesitas ayuda?{' '}
            <a href="/support" className="text-blue-600 hover:underline">
              Contacta soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;