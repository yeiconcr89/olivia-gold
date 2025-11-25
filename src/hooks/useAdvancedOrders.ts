import { useState } from 'react';
import { API_CONFIG, createAuthHeaders } from '../config/api';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface OrderCustomerInfo {
  name: string;
  email: string;
  phone: string;
}

interface OrderShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

interface CreateOrderFromCartData {
  cartId: string;
  customerInfo: OrderCustomerInfo;
  shippingAddress: OrderShippingAddress;
  paymentMethod: string;
  couponCode?: string;
  shippingMethodId?: string;
  notes?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

interface OrderResult {
  orderId: string;
  orderNumber: string;
  total: number;
  status: string;
  estimatedDelivery: Date;
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderTimeline {
  status: string;
  description: string;
  location?: string;
  timestamp: Date;
  estimatedArrival?: Date;
  actualArrival?: Date;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  orderDate: Date;
  estimatedDelivery?: Date;
  trackingNumber?: string;
  items: OrderItem[];
  shippingAddress: OrderShippingAddress;
  timeline: OrderTimeline[];
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  orderDate: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
}

interface OrdersResponse {
  orders: OrderSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useAdvancedOrders = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Crear pedido desde carrito
  const createOrderFromCart = async (orderData: CreateOrderFromCartData): Promise<OrderResult> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_CONFIG.ENDPOINTS.ORDERS.ADVANCED.CREATE_FROM_CART, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.order;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear pedido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener detalles de pedido
  const getOrderDetails = async (orderId: string): Promise<OrderDetails> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_CONFIG.ENDPOINTS.ORDERS.ADVANCED.GET(orderId), {
        headers: createAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.order;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener detalles del pedido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener tracking de pedido
  const getOrderTracking = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_CONFIG.ENDPOINTS.ORDERS.ADVANCED.TRACKING(orderId), {
        headers: createAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tracking;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener tracking';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener lista de pedidos
  const fetchOrders = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<OrdersResponse> => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${API_CONFIG.ENDPOINTS.ORDERS.ADVANCED.LIST}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await fetch(url, {
        headers: createAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setOrders(data.orders || []);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar pedidos';
      setError(errorMessage);
      console.error('Error fetching orders:', err);
      return { orders: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado de pedido (solo para administradores)
  const updateOrderStatus = async (
    orderId: string,
    statusData: {
      status?: string;
      paymentStatus?: string;
      trackingNumber?: string;
      estimatedDelivery?: string;
      notes?: string;
      location?: string;
      carrier?: string;
      trackingUrl?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_CONFIG.ENDPOINTS.ORDERS.ADVANCED.UPDATE_STATUS(orderId), {
        method: 'PUT',
        headers: createAuthHeaders(),
        body: JSON.stringify(statusData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Actualizar la lista local de pedidos
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: data.order.status, paymentStatus: data.order.paymentStatus }
          : order
      ));

      return data.order;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar pedido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener estadísticas de dashboard
  const getDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_CONFIG.ENDPOINTS.ORDERS.ADVANCED.STATS, {
        headers: createAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estado
    orders,
    loading,
    error,
    
    // Acciones
    createOrderFromCart,
    getOrderDetails,
    getOrderTracking,
    fetchOrders,
    updateOrderStatus,
    getDashboardStats,
  };
};