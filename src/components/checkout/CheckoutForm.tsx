import React, { useState, useEffect } from 'react';
import { useCheckout } from '../../hooks/useCheckout';
import { useCart } from '../../hooks/useCart';
import { 
  CreditCard, 
  MapPin, 
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  ShoppingBag,
  Truck
} from 'lucide-react';

interface CheckoutFormProps {
  onSuccess?: (order: Order) => void;
  onCancel?: () => void;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  total: number;
  items: Array<{
    productId: string;
    quantity: number;
    size?: string;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    instructions?: string;
  };
  createdAt: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSuccess, onCancel }) => {
  const { cart, loading: cartLoading } = useCart();
  const { 
    loading: checkoutLoading, 
    error: checkoutError, 
    processCheckout, 
    validateCheckoutData,
    getOrderSummary,
    verifyProductAvailability,
    resetError
  } = useCheckout();

  const [currentStep, setCurrentStep] = useState(1);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    customerInfo: {
      name: '',
      email: '',
      phone: '',
      document: ''
    },
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Colombia',
      instructions: ''
    },
    paymentMethod: '' as 'CASH_ON_DELIVERY' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'PSE' | 'NEQUI' | 'DAVIPLATA' | '',
    notes: ''
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Verificar disponibilidad al cargar
  useEffect(() => {
    const checkAvailability = async () => {
      if (cart && cart.items.length > 0) {
        const result = await verifyProductAvailability();
        setAvailabilityChecked(true);
        if (!result.available) {
          setUnavailableItems(result.unavailableItems);
        }
      }
    };
    
    checkAvailability();
  }, [cart]);

  const handleInputChange = (section: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    if (checkoutError) {
      resetError();
    }
  };

  const handleNextStep = () => {
    const errors = validateCurrentStep();
    if (errors.length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      setValidationErrors(errors);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setValidationErrors([]);
  };

  const validateCurrentStep = (): string[] => {
    const errors: string[] = [];
    
    if (currentStep === 1) {
      if (!formData.customerInfo.name.trim()) errors.push('El nombre es requerido');
      if (!formData.customerInfo.email.trim()) errors.push('El email es requerido');
      if (!formData.customerInfo.phone.trim()) errors.push('El teléfono es requerido');
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.customerInfo.email && !emailRegex.test(formData.customerInfo.email)) {
        errors.push('El formato del email no es válido');
      }
    }
    
    if (currentStep === 2) {
      if (!formData.shippingAddress.street.trim()) errors.push('La dirección es requerida');
      if (!formData.shippingAddress.city.trim()) errors.push('La ciudad es requerida');
      if (!formData.shippingAddress.state.trim()) errors.push('El departamento es requerido');
      if (!formData.shippingAddress.zipCode.trim()) errors.push('El código postal es requerido');
    }
    
    if (currentStep === 3) {
      if (!formData.paymentMethod) errors.push('Selecciona un método de pago');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    const allErrors = validateCheckoutData(formData);
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      return;
    }

    const result = await processCheckout(formData);
    
    if (result.success && result.order) {
      onSuccess?.(result.order);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const orderSummary = getOrderSummary();

  if (cartLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        <span className="ml-3">Cargando carrito...</span>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center p-8">
        <ShoppingBag className="h-16 w-16 text-elegant-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-elegant-900 mb-2">Tu carrito está vacío</h3>
        <p className="text-elegant-600">Agrega algunos productos antes de proceder al checkout</p>
      </div>
    );
  }

  if (availabilityChecked && unavailableItems.length > 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
          <h3 className="text-lg font-medium text-red-800">Productos no disponibles</h3>
        </div>
        <p className="text-red-700 mb-4">
          Algunos productos en tu carrito ya no están disponibles. Por favor, actualiza tu carrito antes de continuar.
        </p>
        <ul className="list-disc list-inside text-red-600 mb-4">
          {unavailableItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
        <button
          onClick={onCancel}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Volver al carrito
        </button>
      </div>
    );
  }

  const steps = [
    { id: 1, name: 'Información Personal', icon: User },
    { id: 2, name: 'Dirección de Envío', icon: MapPin },
    { id: 3, name: 'Método de Pago', icon: CreditCard }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Checkout */}
        <div className="lg:col-span-2">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentStep === step.id 
                      ? 'bg-gradient-gold text-elegant-900' 
                      : currentStep > step.id 
                        ? 'bg-green-500 text-white'
                        : 'bg-elegant-200 text-elegant-600'
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep >= step.id ? 'text-elegant-900' : 'text-elegant-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-4 rounded-full ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-elegant-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error Messages */}
          {(validationErrors.length > 0 || checkoutError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <h4 className="text-red-800 font-medium">Por favor corrige los siguientes errores:</h4>
              </div>
              <ul className="list-disc list-inside text-red-700 text-sm">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {checkoutError && <li>{checkoutError}</li>}
              </ul>
            </div>
          )}

          {/* Step 1: Customer Information */}
          {currentStep === 1 && (
            <div className="bg-white rounded-xl shadow-elegant p-6">
              <h3 className="text-lg font-medium text-elegant-900 mb-6 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-elegant-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.customerInfo.name}
                    onChange={(e) => handleInputChange('customerInfo', 'name', e.target.value)}
                    className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="Tu nombre completo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-elegant-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.customerInfo.email}
                    onChange={(e) => handleInputChange('customerInfo', 'email', e.target.value)}
                    className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="tu@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-elegant-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.customerInfo.phone}
                    onChange={(e) => handleInputChange('customerInfo', 'phone', e.target.value)}
                    className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="+57 300 123 4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-elegant-700 mb-2">
                    Documento (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.customerInfo.document}
                    onChange={(e) => handleInputChange('customerInfo', 'document', e.target.value)}
                    className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="Cédula o NIT"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Shipping Address */}
          {currentStep === 2 && (
            <div className="bg-white rounded-xl shadow-elegant p-6">
              <h3 className="text-lg font-medium text-elegant-900 mb-6 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Dirección de Envío
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-elegant-700 mb-2">
                    Dirección Completa *
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress.street}
                    onChange={(e) => handleInputChange('shippingAddress', 'street', e.target.value)}
                    className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="Calle, carrera, número, apartamento"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-elegant-700 mb-2">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.city}
                      onChange={(e) => handleInputChange('shippingAddress', 'city', e.target.value)}
                      className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="Bogotá, Medellín, Cali..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-elegant-700 mb-2">
                      Departamento *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.state}
                      onChange={(e) => handleInputChange('shippingAddress', 'state', e.target.value)}
                      className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="Cundinamarca, Antioquia..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-elegant-700 mb-2">
                      Código Postal *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.zipCode}
                      onChange={(e) => handleInputChange('shippingAddress', 'zipCode', e.target.value)}
                      className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="110111"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-elegant-700 mb-2">
                      País
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.country}
                      onChange={(e) => handleInputChange('shippingAddress', 'country', e.target.value)}
                      className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 bg-elegant-50"
                      readOnly
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-elegant-700 mb-2">
                    Instrucciones de Entrega (Opcional)
                  </label>
                  <textarea
                    value={formData.shippingAddress.instructions}
                    onChange={(e) => handleInputChange('shippingAddress', 'instructions', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="Dejar con el portero, tocar el timbre, etc."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment Method */}
          {currentStep === 3 && (
            <div className="bg-white rounded-xl shadow-elegant p-6">
              <h3 className="text-lg font-medium text-elegant-900 mb-6 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Método de Pago
              </h3>
              
              <div className="space-y-4">
                {[
                  { id: 'CASH_ON_DELIVERY', name: 'Pago Contra Entrega', desc: 'Paga cuando recibas tu pedido' },
                  { id: 'BANK_TRANSFER', name: 'Transferencia Bancaria', desc: 'Transfiere a nuestra cuenta bancaria' },
                  { id: 'NEQUI', name: 'Nequi', desc: 'Pago rápido con Nequi' },
                  { id: 'DAVIPLATA', name: 'DaviPlata', desc: 'Pago con DaviPlata' }
                ].map((method) => (
                  <label key={method.id} className="flex items-center p-4 border border-elegant-300 rounded-lg cursor-pointer hover:border-gold-500 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={formData.paymentMethod === method.id}
                      onChange={(e) => handleInputChange('', 'paymentMethod', e.target.value)}
                      className="mr-4 text-gold-500 focus:ring-gold-500"
                    />
                    <div>
                      <div className="font-medium text-elegant-900">{method.name}</div>
                      <div className="text-sm text-elegant-600">{method.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-elegant-700 mb-2">
                  Notas Adicionales (Opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('', 'notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="Comentarios especiales sobre tu pedido..."
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-3 border border-elegant-300 text-elegant-700 rounded-lg hover:bg-elegant-50 transition-colors"
                >
                  Anterior
                </button>
              )}
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={onCancel}
                className="px-6 py-3 border border-elegant-300 text-elegant-700 rounded-lg hover:bg-elegant-50 transition-colors"
              >
                Cancelar
              </button>
              
              {currentStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-gradient-gold text-elegant-900 rounded-lg hover:shadow-gold transition-all font-medium"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={checkoutLoading}
                  className="px-6 py-3 bg-gradient-gold text-elegant-900 rounded-lg hover:shadow-gold transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirmar Pedido
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-elegant p-6 sticky top-6">
            <h3 className="text-lg font-medium text-elegant-900 mb-6">Resumen del Pedido</h3>
            
            {/* Items */}
            <div className="space-y-4 mb-6">
              {orderSummary?.items.map((item) => (
                <div key={`${item.productId}-${item.size || 'no-size'}`} className="flex items-center space-x-3">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-elegant-900 text-sm">{item.product.name}</p>
                    <p className="text-elegant-600 text-xs">
                      Cantidad: {item.quantity} {item.size && `• Talla: ${item.size}`}
                    </p>
                  </div>
                  <p className="font-medium text-elegant-900 text-sm">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="border-t border-elegant-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-elegant-600">Subtotal:</span>
                <span className="text-elegant-900">{formatPrice(orderSummary?.subtotal || 0)}</span>
              </div>
              
              {orderSummary?.discountAmount && orderSummary.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-elegant-600">Descuento:</span>
                  <span className="text-green-600">-{formatPrice(orderSummary.discountAmount)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-elegant-600">Envío:</span>
                <span className="text-elegant-900">
                  {orderSummary?.shippingAmount === 0 ? 'Gratis' : formatPrice(orderSummary?.shippingAmount || 0)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-elegant-600">IVA (19%):</span>
                <span className="text-elegant-900">{formatPrice(orderSummary?.taxAmount || 0)}</span>
              </div>
              
              <div className="flex justify-between text-lg font-bold border-t border-elegant-200 pt-2">
                <span className="text-elegant-900">Total:</span>
                <span className="text-gold-600">{formatPrice(orderSummary?.total || 0)}</span>
              </div>
            </div>
            
            {/* Shipping Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center text-blue-800 mb-2">
                <Truck className="h-5 w-5 mr-2" />
                <span className="font-medium">Información de Envío</span>
              </div>
              <p className="text-blue-700 text-sm">
                • Envío gratis en compras superiores a {formatPrice(150000)}<br/>
                • Tiempo de entrega: 2-5 días hábiles<br/>
                • Cobertura nacional
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;