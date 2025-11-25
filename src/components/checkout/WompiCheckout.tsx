
import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { apiRequest, createAuthHeaders } from '../../config/api';

interface WompiCheckoutProps {
  orderId: string;
  amount: number;
}

const WompiCheckout: React.FC<WompiCheckoutProps> = ({ orderId, amount }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWompiCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<any>('/api/wompi/create-checkout-data', {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({ orderId }),
      });

      const checkoutData = response.data;

      // Crear formulario para redireccionar a Wompi Web Checkout
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = 'https://checkout.wompi.co/p/';

      const fields: Record<string, string> = {
        'public-key': checkoutData.publicKey,
        'currency': checkoutData.currency,
        'amount-in-cents': checkoutData.amountInCents,
        'reference': checkoutData.reference,
        'redirect-url': checkoutData.redirectUrl,
        'signature:integrity': checkoutData.signature,
      };

      for (const key in fields) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Finalizar Pago</h3>
        <div className="flex items-center space-x-2">
          <img 
            src="https://wompi.com/assets/wompi-logo.png" 
            alt="Wompi" 
            className="h-6"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Total a pagar:</span>
          <span className="text-2xl font-bold text-blue-600">{formatAmount(amount)}</span>
        </div>
      </div>

      <button
        onClick={handleWompiCheckout}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        <CreditCard className="w-5 h-5" />
        <span>{loading ? 'Procesando...' : 'Pagar con Wompi'}</span>
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Pago seguro procesado por Wompi</p>
        <p>Acepta tarjetas de crédito, débito, PSE, Nequi y más</p>
      </div>
    </div>
  );
};

export default WompiCheckout;
