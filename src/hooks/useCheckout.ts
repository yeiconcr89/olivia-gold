import { useState } from 'react';
import { useCart } from './useCart';
import { API_CONFIG, createAuthHeaders } from '../config/api';

// Tipos para el checkout
interface CheckoutData {
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    document?: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    instructions?: string;
  };
  paymentMethod: 'CASH_ON_DELIVERY' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'PSE' | 'NEQUI' | 'DAVIPLATA';
  notes?: string;
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

interface CheckoutResult {
  success: boolean;
  order?: Order;
  error?: string;
  paymentUrl?: string; // Para pagos online
}

export const useCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { cart, clearCart } = useCart();

  // Procesar checkout - convertir carrito en pedido
  const processCheckout = async (checkoutData: CheckoutData): Promise<CheckoutResult> => {
    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        error: 'El carrito está vacío'
      };
    }

    setLoading(true);
    setError(null);

    try {
      // Preparar datos del pedido
      const orderData = {
        customerName: checkoutData.customerInfo.name,
        customerEmail: checkoutData.customerInfo.email,
        customerPhone: checkoutData.customerInfo.phone,
        customerDocument: checkoutData.customerInfo.document,
        items: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          price: item.product.price
        })),
        paymentMethod: checkoutData.paymentMethod,
        shippingAddress: checkoutData.shippingAddress,
        notes: checkoutData.notes,
        cartId: cart.id, // Para vincular el carrito con el pedido
        subtotal: cart.subtotal,
        taxAmount: cart.taxAmount,
        shippingAmount: cart.shippingAmount,
        discountAmount: cart.discountAmount,
        total: cart.total,
        couponCode: cart.couponCode
      };

      console.log('🛒 Procesando checkout con datos:', orderData);
      console.log('🛒 Cart data:', cart);

      // Crear pedido en el backend
      const response = await fetch(API_CONFIG.ENDPOINTS.ORDERS.CREATE, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Pedido creado exitosamente:', result);

      // Limpiar carrito después de crear el pedido exitosamente
      await clearCart();

      return {
        success: true,
        order: result.order,
        paymentUrl: result.paymentUrl // Si hay URL de pago
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar el pedido';
      setError(errorMessage);
      console.error('Error en checkout:', err);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Validar datos del checkout
  const validateCheckoutData = (data: CheckoutData): string[] => {
    const errors: string[] = [];

    // Validar información del cliente
    if (!data.customerInfo.name.trim()) {
      errors.push('El nombre es requerido');
    }
    if (!data.customerInfo.email.trim()) {
      errors.push('El email es requerido');
    }
    if (!data.customerInfo.phone.trim()) {
      errors.push('El teléfono es requerido');
    }

    // Validar dirección de envío
    if (!data.shippingAddress.street.trim()) {
      errors.push('La dirección es requerida');
    }
    if (!data.shippingAddress.city.trim()) {
      errors.push('La ciudad es requerida');
    }
    if (!data.shippingAddress.state.trim()) {
      errors.push('El departamento es requerido');
    }
    if (!data.shippingAddress.zipCode.trim()) {
      errors.push('El código postal es requerido');
    }

    // Validar método de pago
    if (!data.paymentMethod) {
      errors.push('Selecciona un método de pago');
    }

    return errors;
  };

  // Calcular resumen del pedido
  const getOrderSummary = () => {
    if (!cart) return null;

    return {
      items: cart.items,
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      taxAmount: cart.taxAmount,
      shippingAmount: cart.shippingAmount,
      discountAmount: cart.discountAmount,
      total: cart.total,
      couponCode: cart.couponCode
    };
  };

  // Verificar disponibilidad de productos antes del checkout
  const verifyProductAvailability = async (): Promise<{ available: boolean; unavailableItems: string[] }> => {
    if (!cart || cart.items.length === 0) {
      return { available: false, unavailableItems: [] };
    }

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.CART.VERIFY_AVAILABILITY, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({
          cartId: cart.id,
          items: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Error al verificar disponibilidad');
      }

      const result = await response.json();
      return {
        available: result.available,
        unavailableItems: result.unavailableItems || []
      };

    } catch (err) {
      console.error('Error verificando disponibilidad:', err);
      return { available: false, unavailableItems: [] };
    }
  };

  return {
    loading,
    error,
    processCheckout,
    validateCheckoutData,
    getOrderSummary,
    verifyProductAvailability,
    resetError: () => setError(null)
  };
};