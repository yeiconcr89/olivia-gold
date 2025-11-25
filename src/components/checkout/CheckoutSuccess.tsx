import React from 'react';
import { CheckCircle, Package, Truck, CreditCard, MapPin, Phone, Mail } from 'lucide-react';

interface CheckoutSuccessProps {
  order: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    total: number;
    paymentMethod: string;
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
      size?: string;
    }>;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    estimatedDelivery?: string;
    trackingNumber?: string;
  };
  onContinueShopping?: () => void;
}

const CheckoutSuccess: React.FC<CheckoutSuccessProps> = ({ 
  order, 
  onContinueShopping 
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getPaymentMethodName = (method: string) => {
    const methods: { [key: string]: string } = {
      'CASH_ON_DELIVERY': 'Pago Contra Entrega',
      'BANK_TRANSFER': 'Transferencia Bancaria',
      'CREDIT_CARD': 'Tarjeta de Crédito',
      'PSE': 'PSE',
      'NEQUI': 'Nequi',
      'DAVIPLATA': 'DaviPlata'
    };
    return methods[method] || method;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-elegant-900 mb-2">
          ¡Pedido Confirmado!
        </h1>
        <p className="text-elegant-600 text-lg">
          Gracias por tu compra. Hemos recibido tu pedido y lo procesaremos pronto.
        </p>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white rounded-xl shadow-elegant p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-elegant-900 flex items-center">
            <Package className="h-6 w-6 mr-2 text-gold-600" />
            Pedido #{order.id}
          </h2>
          <div className="text-right">
            <p className="text-sm text-elegant-600">Total</p>
            <p className="text-2xl font-bold text-gold-600">
              {formatPrice(order.total)}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="border-t border-elegant-200 pt-6 mb-6">
          <h3 className="font-semibold text-elegant-900 mb-4">Productos Ordenados</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-elegant-50 rounded-lg">
                <div>
                  <p className="font-medium text-elegant-900">{item.productName}</p>
                  <p className="text-sm text-elegant-600">
                    Cantidad: {item.quantity} {item.size && `• Talla: ${item.size}`}
                  </p>
                </div>
                <p className="font-semibold text-elegant-900">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Customer & Shipping Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-elegant-200 pt-6">
          {/* Customer Info */}
          <div>
            <h3 className="font-semibold text-elegant-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-gold-600" />
              Información de Contacto
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-elegant-700">
                <Mail className="h-4 w-4 mr-2 text-elegant-500" />
                {order.customerEmail}
              </div>
              <div className="flex items-center text-elegant-700">
                <Phone className="h-4 w-4 mr-2 text-elegant-500" />
                {order.customerPhone}
              </div>
              <div className="mt-3">
                <p className="text-elegant-600">Método de Pago:</p>
                <p className="font-medium text-elegant-900">
                  {getPaymentMethodName(order.paymentMethod)}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div>
            <h3 className="font-semibold text-elegant-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-gold-600" />
              Dirección de Envío
            </h3>
            <div className="text-sm text-elegant-700">
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
              <p>{order.shippingAddress.zipCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-center mb-4">
          <Truck className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-blue-900">Información de Entrega</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-800 font-medium mb-2">Tiempo de Entrega:</p>
            <p className="text-blue-700">
              {order.estimatedDelivery 
                ? `Estimado: ${new Date(order.estimatedDelivery).toLocaleDateString('es-ES')}`
                : '2-5 días hábiles'
              }
            </p>
          </div>
          
          {order.trackingNumber && (
            <div>
              <p className="text-blue-800 font-medium mb-2">Número de Seguimiento:</p>
              <p className="text-blue-700 font-mono">{order.trackingNumber}</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>📧 Confirmación por Email:</strong> Hemos enviado los detalles de tu pedido a {order.customerEmail}
          </p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-elegant-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-elegant-900 mb-4">¿Qué sigue?</h3>
        <div className="space-y-3 text-sm text-elegant-700">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-gold-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
            <div>
              <p className="font-medium">Procesamiento del Pedido</p>
              <p>Verificaremos tu pedido y prepararemos los productos para el envío.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 bg-gold-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
            <div>
              <p className="font-medium">Preparación y Envío</p>
              <p>Empacaremos cuidadosamente tus joyas y las enviaremos a tu dirección.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 bg-gold-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</div>
            <div>
              <p className="font-medium">Entrega</p>
              <p>Recibirás tu pedido en la dirección especificada dentro del tiempo estimado.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onContinueShopping}
          className="px-8 py-3 bg-gradient-gold text-elegant-900 rounded-lg hover:shadow-gold transition-all font-medium"
        >
          Continuar Comprando
        </button>
        
        <button
          onClick={() => window.print()}
          className="px-8 py-3 border border-elegant-300 text-elegant-700 rounded-lg hover:bg-elegant-50 transition-colors font-medium"
        >
          Imprimir Recibo
        </button>
      </div>

      {/* Contact Support */}
      <div className="text-center mt-8 p-4 bg-white rounded-xl shadow-elegant">
        <p className="text-elegant-600 text-sm mb-2">
          ¿Tienes preguntas sobre tu pedido?
        </p>
        <p className="text-elegant-900 font-medium">
          Contáctanos: <a href="mailto:soporte@oliviagold.com" className="text-gold-600 hover:text-gold-700">soporte@oliviagold.com</a>
          {' • '}
          <a href="https://wa.me/573001234567" className="text-gold-600 hover:text-gold-700">WhatsApp</a>
        </p>
      </div>
    </div>
  );
};

export default CheckoutSuccess;