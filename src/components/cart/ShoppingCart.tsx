import { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { API_CONFIG, apiRequest } from '../../config/api';
import { Order } from '../../types';
import { ShoppingBag, X, Plus, Minus, Trash2, Tag, ShoppingCart as CartIcon, ArrowLeft, User, Phone, Mail, MapPin } from 'lucide-react';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

// Componente Tooltip
const Tooltip: React.FC<{ message: string; show: boolean }> = ({ message, show }) => {
  if (!show) return null;
  return (
    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-tooltip-fade">
      <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
        {message}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
      </div>
    </div>
  );
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
  isOpen,
  onClose,
  onCheckout
}) => {
  const {
    cart,
    loading,
    error,
    changeQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    getTotalItems,
    isEmpty,
    refreshCart
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [quantityError, setQuantityError] = useState<string | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      await applyCoupon(couponCode.trim());
      setCouponCode('');
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : 'Error al aplicar cupón');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    try {
      setQuantityError(null);
      await changeQuantity(itemId, newQuantity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cambiar la cantidad';
      setQuantityError(message);
      setTimeout(() => setQuantityError(null), 3000);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'El nombre completo es obligatorio';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'El teléfono es obligatorio';
    } else if (!/^[0-9]{10,15}$/.test(formData.phone)) {
      errors.phone = 'Ingresa un número de teléfono válido';
    }

    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Ingresa un correo electrónico válido';
    }

    if (!formData.address.trim()) {
      errors.address = 'La dirección es obligatoria';
    }

    if (!formData.city.trim()) {
      errors.city = 'La ciudad es obligatoria';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const createOrder = async (): Promise<Order> => {
    if (!cart) throw new Error('El carrito está vacío');

    try {
      const orderData = {
        customerName: formData.fullName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        total: cart.total,
        paymentMethod: 'WHATSAPP',
        paymentStatus: 'PENDING',
        items: cart.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          size: item.size || undefined
        })),
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          state: 'N/A',
          zipCode: 'N/A',
          country: 'Colombia'
        },
        notes: formData.notes || undefined
      };

      // Usar apiRequest y la configuración centralizada para asegurar la URL correcta en producción
      const response = await apiRequest<{ message: string; order: Order }>(API_CONFIG.ENDPOINTS.ORDERS.CREATE, {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      return response.order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const generateWhatsAppMessage = async () => {
    if (!cart) return '';

    let order;
    try {
      order = await createOrder();
    } catch (error) {
      alert('Error al procesar el pedido. Por favor intenta de nuevo.');
      return '';
    }

    const itemsText = cart.items.map(item =>
      `• ${item.product.name}\n  (${item.quantity} x ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.product.price)})`
    ).join('\n\n');

    const total = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(cart.total);

    return `*¡Hola! Te comparto los detalles de mi pedido:*

📦 *Número de Pedido:* ${order.orderNumber}

*Productos:*
${itemsText}

💰 *Resumen:*
*Subtotal:* ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(cart.subtotal)}
${cart.discountAmount > 0 ? `*Descuento:* -${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(cart.discountAmount)}\n` : ''}*Envío:* ${cart.shippingAmount === 0 ? 'Gratis' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(cart.shippingAmount)}
*Total:* ${total}

📋 *Mis datos de contacto:*
👤 *Nombre:* ${formData.fullName}
📱 *Teléfono:* ${formData.phone}
📧 *Email:* ${formData.email}
📍 *Dirección:* ${formData.address}, ${formData.city}
📝 *Notas:* ${formData.notes || 'Ninguna'}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const phoneNumber = '573153420703'; // Número principal de pedidos
        const message = encodeURIComponent(await generateWhatsAppMessage());
        if (message) {
          window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
          await clearCart();
          onClose();
        }
      } catch (error) {
        console.error('Error al procesar el pedido:', error);
        alert('Error al procesar el pedido. Por favor intenta de nuevo.');
      }
    }
  };

  const handleCheckout = () => {
    setShowCustomerForm(true);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Cart Panel */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-xl z-50 transform transition-transform overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center space-x-2">
            <CartIcon className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Carrito ({getTotalItems()})
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshCart}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              title="Refrescar carrito"
            >
              🔄 Sync
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : isEmpty() ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tu carrito está vacío
                </h3>
                <p className="text-gray-500 mb-4">
                  Agrega algunos productos para continuar
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Seguir Comprando
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex space-x-4 bg-gray-50 p-4 rounded-lg">
                    <img
                      src={item.product.images[0] || '/placeholder-product.jpg'}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(item.product.price)}
                      </p>
                      {item.size && (
                        <p className="text-sm text-gray-500">
                          Talla: {item.size}
                        </p>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-100 disabled:opacity-50"
                            disabled={loading || item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-100 disabled:opacity-50"
                            disabled={loading || item.quantity >= 10}
                            title={item.quantity >= 10 ? "Máximo 10 unidades por producto" : ""}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="border-t p-4 bg-white shrink-0">
                <form onSubmit={handleApplyCoupon} className="mb-4">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Código de cupón"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        disabled={couponLoading}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {couponLoading ? 'Aplicando...' : 'Aplicar'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-600 mt-2">{couponError}</p>
                  )}
                </form>

                {/* Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(cart?.subtotal || 0)}</span>
                  </div>

                  {cart && cart.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento</span>
                      <span>-{new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(cart.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    <span>
                      {cart?.shippingAmount === 0 ? 'Gratis' : new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(cart?.shippingAmount || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Impuestos</span>
                    <span>{new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(cart?.taxAmount || 0)}</span>
                  </div>

                  <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(cart?.total || 0)}</span>
                  </div>
                </div>
              </div>

              {showCustomerForm ? (
                <div className="border-t p-6">
                  <button
                    onClick={() => setShowCustomerForm(false)}
                    className="flex items-center text-amber-600 mb-4 hover:text-amber-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Volver al carrito
                  </button>

                  <h3 className="text-lg font-semibold mb-4">Datos de contacto</h3>
                  <p className="text-sm text-gray-600 mb-6">Por favor completa tus datos para procesar tu pedido</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre completo <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className={`pl-10 w-full px-3 py-2 border ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500`}
                          placeholder="Tu nombre completo"
                        />
                      </div>
                      {formErrors.fullName && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`pl-10 w-full px-3 py-2 border ${formErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500`}
                            placeholder="Ej: 3001234567"
                          />
                        </div>
                        {formErrors.phone && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Correo electrónico <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`pl-10 w-full px-3 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500`}
                            placeholder="tucorreo@ejemplo.com"
                          />
                        </div>
                        {formErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                          Ciudad <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border ${formErrors.city ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500`}
                          placeholder="Tu ciudad"
                        />
                        {formErrors.city && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                          Dirección <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className={`pl-10 w-full px-3 py-2 border ${formErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500`}
                            placeholder="Tu dirección completa"
                          />
                        </div>
                        {formErrors.address && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notas adicionales (opcional)
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Instrucciones especiales para la entrega, detalles del pedido, etc."
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                          <path d="M17.498 14.382a.5.5 0 0 1 .5.5v2.5a.5.5 0 0 1-.5.5h-2.5a.5.5 0 0 1-.5-.5v-2.5a.5.5 0 0 1 .5-.5h2.5zm-3.5-12.5a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-2.5a.5.5 0 0 1-.5-.5v-15a.5.5 0 0 1 .5-.5h2.5zm-5 3a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H6.5a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5h2.5z" />
                        </svg>
                        <span>Continuar a WhatsApp</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="border-t p-4 bg-white shrink-0 space-y-3">
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    disabled={loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.498 14.382a.5.5 0 0 1 .5.5v2.5a.5.5 0 0 1-.5.5h-2.5a.5.5 0 0 1-.5-.5v-2.5a.5.5 0 0 1 .5-.5h2.5zm-3.5-12.5a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-2.5a.5.5 0 0 1-.5-.5v-15a.5.5 0 0 1 .5-.5h2.5zm-5 3a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H6.5a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5h2.5z" />
                    </svg>
                    <span>Completar pedido</span>
                  </button>

                  <div className="flex space-x-3">
                    <button
                      onClick={onClose}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Seguir Comprando
                    </button>

                    <button
                      onClick={() => clearCart()}
                      className="flex-1 border border-red-300 text-red-600 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
                      disabled={loading}
                    >
                      Limpiar Carrito
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ShoppingCart;