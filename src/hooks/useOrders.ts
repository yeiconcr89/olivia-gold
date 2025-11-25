import { useState, useEffect } from 'react';
import { API_CONFIG, createAuthHeaders } from '../config/api';

// Tipos actualizados para coincidir con el backend
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  size?: string;
}

interface ShippingAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CustomerInfo {
  id: string;
  name: string;
  status: string;
}

interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerInfo?: CustomerInfo;
  items: OrderItem[];
  itemsCount: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  shippingAddress?: ShippingAddress;
  orderDate: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateOrderData {
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    productId: string;
    quantity: number;
    size?: string;
  }>;
  paymentMethod: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  notes?: string;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  recentOrders: Array<{
    id: string;
    customerName: string;
    total: number;
    status: string;
    orderDate: string;
  }>;
}


export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);

  // Fetch orders from backend
  const fetchOrders = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    try {
      console.log('🔄 useOrders fetchOrders iniciando con params:', params);
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
      
      const url = `${API_CONFIG.ENDPOINTS.ORDERS.LIST}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('🔄 useOrders URL:', url);
      
      const headers = createAuthHeaders();
      console.log('🔄 useOrders headers:', headers);
      
      const response = await fetch(url, {
        headers: headers,
      });
      
      console.log('🔄 useOrders response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ useOrders response error:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ useOrders fetchOrders response:', data);
      setOrders(data.orders || []);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar pedidos';
      setError(errorMessage);
      console.error('❌ useOrders Error fetching orders:', err);
      return { orders: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    } finally {
      setLoading(false);
    }
  };

  // Fetch order statistics
  const fetchOrderStats = async () => {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.ORDERS.STATS, {
        headers: createAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data);
      return data;
    } catch (err) {
      console.error('Error fetching order stats:', err);
      return null;
    }
  };

  // Load initial data
  useEffect(() => {
    console.log('🔄 useOrders: Cargando pedidos iniciales...');
    const loadInitialData = async () => {
      await fetchOrders({ page: 1, limit: 20 });
      await fetchOrderStats();
    };
    loadInitialData();
  }, []); // Solo una vez al montar

  // Debug: Log cuando cambian los orders
  useEffect(() => {
    console.log('🔄 useOrders: Orders actualizados:', orders.length, orders);
  }, [orders]);

  // Create new order
  const addOrder = async (orderData: CreateOrderData) => {
    try {
      setError(null);
      
      const response = await fetch(API_CONFIG.ENDPOINTS.ORDERS.CREATE, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add new order to the beginning of the list
      setOrders(prev => [data.order, ...prev]);
      
      // Refresh stats
      fetchOrderStats();
      
      return data.order;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear pedido';
      setError(errorMessage);
      throw err;
    }
  };

  // Update order status
  const updateOrder = async (orderId: string, updates: {
    status?: Order['status'];
    paymentStatus?: Order['paymentStatus'];
    trackingNumber?: string;
    estimatedDelivery?: string;
    notes?: string;
  }) => {
    try {
      setError(null);
      
      const response = await fetch(API_CONFIG.ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
        method: 'PUT',
        headers: createAuthHeaders(),
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update order in the list
      setOrders(prev => prev.map(order => 
        order.id === orderId ? data.order : order
      ));
      
      // Refresh stats if status changed
      if (updates.status) {
        fetchOrderStats();
      }
      
      return data.order;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar pedido';
      setError(errorMessage);
      throw err;
    }
  };

  // Delete/Cancel order
  const deleteOrder = async (orderId: string) => {
    try {
      setError(null);
      
      const response = await fetch(API_CONFIG.ENDPOINTS.ORDERS.DELETE(orderId), {
        method: 'DELETE',
        headers: createAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      // Remove order from the list
      setOrders(prev => prev.filter(order => order.id !== orderId));
      
      // Refresh stats
      fetchOrderStats();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cancelar pedido';
      setError(errorMessage);
      throw err;
    }
  };

  // Get order by ID
  const getOrderById = async (orderId: string) => {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.ORDERS.GET(orderId), {
        headers: createAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching order:', err);
      throw err;
    }
  };

  // Refresh orders
  const refreshOrders = () => {
    fetchOrders({ page: 1, limit: 20 });
    fetchOrderStats();
  };

  return {
    orders,
    loading,
    error,
    stats,
    addOrder,
    updateOrder,
    deleteOrder,
    getOrderById,
    fetchOrders,
    fetchOrderStats,
    refreshOrders
  };
};