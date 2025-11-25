import React from 'react';
import { ShoppingCart, Tag, CreditCard, AlertCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  size?: string;
}

interface PaymentSummaryProps {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  total: number;
  currency?: string;
  className?: string;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  items,
  subtotal,
  shipping,
  tax,
  discount = 0,
  total,
  currency = 'COP',
  className = ''
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Resumen del Pedido
        </h3>
      </div>

      {/* Items */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-12 h-12 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </p>
              <p className="text-sm text-gray-600">
                Cantidad: {item.quantity}
                {item.size && ` • Talla: ${item.size}`}
              </p>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatCurrency(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Calculations */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 flex items-center">
              <Tag className="w-4 h-4 mr-1" />
              Descuento
            </span>
            <span className="text-green-600">-{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Envío</span>
          <span className="text-gray-900">
            {shipping === 0 ? 'Gratis' : formatCurrency(shipping)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">IVA (19%)</span>
          <span className="text-gray-900">{formatCurrency(tax)}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-3"></div>

        {/* Total */}
        <div className="flex justify-between">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span className="text-lg font-bold text-blue-600">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Información de Pago:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Pago procesado de forma segura</li>
              <li>• Confirmación inmediata por email</li>
              <li>• Soporte 24/7 disponible</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Minimum Amount Warning */}
      {total < 1000 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Monto Mínimo:</p>
              <p>El monto mínimo para procesar pagos es de {formatCurrency(1000)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Terms */}
      <div className="mt-6 text-xs text-gray-500">
        <p>
          Al continuar, aceptas nuestros{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Términos y Condiciones
          </a>{' '}
          y{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Política de Privacidad
          </a>
        </p>
      </div>
    </div>
  );
};

export default PaymentSummary;