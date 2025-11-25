import React, { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAdvancedOrders } from '../../hooks/useAdvancedOrders';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, CreditCard, Package, Check } from 'lucide-react';

interface CheckoutFlowProps {
  onComplete?: (orderResult: OrderResult) => void;
}

interface OrderResult {
  orderNumber: string;
  total: number;
  status: string;
  estimatedDelivery: string;
  orderId: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ onComplete }) => {
  const { cart, isEmpty } = useCart();
  const { createOrderFromCart, loading: orderLoading } = useAdvancedOrders();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    customerInfo: {
      name: '',
      email: '',
      phone: '',
    } as CustomerInfo,
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Colombia',
    } as ShippingAddress,
    paymentMethod: 'credit_card',
    notes: '',
    couponCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  // Redirect si no hay carrito
  useEffect(() => {
    if (isEmpty()) {
      navigate('/');
    }
  }, [isEmpty, navigate]);

  const steps = [
    { id: 1, title: 'Información Personal', icon: User },
    { id: 2, title: 'Dirección de Envío', icon: MapPin },
    { id: 3, title: 'Método de Pago', icon: CreditCard },
    { id: 4, title: 'Confirmación', icon: Package },
  ];

  // Validaciones
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.customerInfo.name.trim()) {
          newErrors['customerInfo.name'] = 'El nombre es requerido';
        }
        if (!formData.customerInfo.email.trim()) {
          newErrors['customerInfo.email'] = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.customerInfo.email)) {
          newErrors['customerInfo.email'] = 'Email inválido';
        }
        if (!formData.customerInfo.phone.trim()) {
          newErrors['customerInfo.phone'] = 'El teléfono es requerido';
        }
        break;

      case 2:
        if (!formData.shippingAddress.street.trim()) {
          newErrors['shippingAddress.street'] = 'La dirección es requerida';
        }
        if (!formData.shippingAddress.city.trim()) {
          newErrors['shippingAddress.city'] = 'La ciudad es requerida';
        }
        if (!formData.shippingAddress.state.trim()) {
          newErrors['shippingAddress.state'] = 'El departamento es requerido';
        }
        if (!formData.shippingAddress.zipCode.trim()) {
          newErrors['shippingAddress.zipCode'] = 'El código postal es requerido';
        }
        break;

      case 3:
        if (!formData.paymentMethod) {
          newErrors['paymentMethod'] = 'Selecciona un método de pago';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navegar pasos
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Procesar pedido
  const handleSubmitOrder = async () => {
    if (!cart || !validateStep(3)) return;

    try {
      const orderData = {
        cartId: cart.id,
        customerInfo: formData.customerInfo,
        shippingAddress: formData.shippingAddress,
        paymentMethod: formData.paymentMethod,
        couponCode: formData.couponCode || undefined,
        notes: formData.notes || undefined,
        source: 'WEB',
      };

      const result = await createOrderFromCart(orderData);
      setOrderResult(result);
      setCurrentStep(4);

      if (onComplete) {
        onComplete(result);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  // Manejar cambios en formulario
  const handleInputChange = (section: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));

    // Limpiar error cuando se corrige
    const errorKey = `${section}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const getFieldError = (section: string, field: string) => {
    return errors[`${section}.${field}`];
  };

  if (isEmpty()) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const IconComponent = step.icon;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isActive
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <IconComponent className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      isActive ? 'text-amber-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 transition-colors ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario Principal */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            {currentStep === 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Información Personal</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.customerInfo.name}
                      onChange={(e) => handleInputChange('customerInfo', 'name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        getFieldError('customerInfo', 'name') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Tu nombre completo"
                    />
                    {getFieldError('customerInfo', 'name') && (
                      <p className="text-red-500 text-sm mt-1">{getFieldError('customerInfo', 'name')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.customerInfo.email}
                      onChange={(e) => handleInputChange('customerInfo', 'email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        getFieldError('customerInfo', 'email') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="tu@email.com"
                    />
                    {getFieldError('customerInfo', 'email') && (
                      <p className="text-red-500 text-sm mt-1">{getFieldError('customerInfo', 'email')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={formData.customerInfo.phone}
                      onChange={(e) => handleInputChange('customerInfo', 'phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        getFieldError('customerInfo', 'phone') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+57 300 123 4567"
                    />
                    {getFieldError('customerInfo', 'phone') && (
                      <p className="text-red-500 text-sm mt-1">{getFieldError('customerInfo', 'phone')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Dirección de Envío</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.street}
                      onChange={(e) => handleInputChange('shippingAddress', 'street', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        getFieldError('shippingAddress', 'street') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Calle 123 # 45-67"
                    />
                    {getFieldError('shippingAddress', 'street') && (
                      <p className="text-red-500 text-sm mt-1">{getFieldError('shippingAddress', 'street')}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.city}
                        onChange={(e) => handleInputChange('shippingAddress', 'city', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          getFieldError('shippingAddress', 'city') ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Bogotá"
                      />
                      {getFieldError('shippingAddress', 'city') && (
                        <p className="text-red-500 text-sm mt-1">{getFieldError('shippingAddress', 'city')}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departamento *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.state}
                        onChange={(e) => handleInputChange('shippingAddress', 'state', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          getFieldError('shippingAddress', 'state') ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Cundinamarca"
                      />
                      {getFieldError('shippingAddress', 'state') && (
                        <p className="text-red-500 text-sm mt-1">{getFieldError('shippingAddress', 'state')}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Postal *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.zipCode}
                      onChange={(e) => handleInputChange('shippingAddress', 'zipCode', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        getFieldError('shippingAddress', 'zipCode') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="110111"
                    />
                    {getFieldError('shippingAddress', 'zipCode') && (
                      <p className="text-red-500 text-sm mt-1">{getFieldError('shippingAddress', 'zipCode')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Método de Pago</h3>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit_card"
                        checked={formData.paymentMethod === 'credit_card'}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="text-amber-600"
                      />
                      <div className="ml-3">
                        <div className="font-medium">Tarjeta de Crédito/Débito</div>
                        <div className="text-sm text-gray-500">Visa, MasterCard, American Express</div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={formData.paymentMethod === 'bank_transfer'}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="text-amber-600"
                      />
                      <div className="ml-3">
                        <div className="font-medium">Transferencia Bancaria</div>
                        <div className="text-sm text-gray-500">PSE - Débito desde tu cuenta</div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash_on_delivery"
                        checked={formData.paymentMethod === 'cash_on_delivery'}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="text-amber-600"
                      />
                      <div className="ml-3">
                        <div className="font-medium">Pago Contra Entrega</div>
                        <div className="text-sm text-gray-500">Paga en efectivo al recibir tu pedido</div>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas del Pedido (Opcional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      rows={3}
                      placeholder="Instrucciones especiales para la entrega..."
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                {orderResult ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                      ¡Pedido Confirmado!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Tu pedido #{orderResult.orderNumber} ha sido creado exitosamente
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Total: <span className="font-semibold">${orderResult.total.toLocaleString()}</span></div>
                        <div>Estado: <span className="font-semibold">{orderResult.status}</span></div>
                        <div>Entrega estimada: <span className="font-semibold">{new Date(orderResult.estimatedDelivery).toLocaleDateString()}</span></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => navigate(`/order-tracking/${orderResult.orderId}`)}
                        className="w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700"
                      >
                        Hacer Seguimiento
                      </button>
                      <button
                        onClick={() => navigate('/')}
                        className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50"
                      >
                        Seguir Comprando
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold mb-6">Confirmar Pedido</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Información de Contacto</h4>
                        <div className="text-sm text-gray-600">
                          <div>{formData.customerInfo.name}</div>
                          <div>{formData.customerInfo.email}</div>
                          <div>{formData.customerInfo.phone}</div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Dirección de Envío</h4>
                        <div className="text-sm text-gray-600">
                          <div>{formData.shippingAddress.street}</div>
                          <div>{formData.shippingAddress.city}, {formData.shippingAddress.state}</div>
                          <div>{formData.shippingAddress.zipCode}</div>
                          <div>{formData.shippingAddress.country}</div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Método de Pago</h4>
                        <div className="text-sm text-gray-600">
                          {formData.paymentMethod === 'credit_card' && 'Tarjeta de Crédito/Débito'}
                          {formData.paymentMethod === 'bank_transfer' && 'Transferencia Bancaria (PSE)'}
                          {formData.paymentMethod === 'cash_on_delivery' && 'Pago Contra Entrega'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep < 4 && (
              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                {currentStep < 3 ? (
                  <button
                    onClick={nextStep}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitOrder}
                    disabled={orderLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {orderLoading ? 'Procesando...' : 'Confirmar Pedido'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resumen del Pedido */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Resumen del Pedido</h3>
            
            {cart && (
              <>
                <div className="space-y-3 mb-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-gray-500">Cantidad: {item.quantity}</div>
                      </div>
                      <div className="font-medium">
                        ${item.subtotal.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${cart.subtotal.toLocaleString()}</span>
                  </div>
                  
                  {cart.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento</span>
                      <span>-${cart.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span>{cart.shippingAmount === 0 ? 'Gratis' : `$${cart.shippingAmount.toLocaleString()}`}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Impuestos</span>
                    <span>${cart.taxAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${cart.total.toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFlow;