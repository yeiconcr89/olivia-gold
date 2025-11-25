import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG, apiRequest, createAuthHeaders } from '../config/api';

// ============================================================================
// TIPOS
// ============================================================================

export interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  lastUpdated: string;
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    subcategory: string;
    description: string;
    materials: string;
    dimensions: string;
    care: string;
    inStock: boolean;
    featured: boolean;
    rating: number;
    reviewCount: number;
    images: string[];
    tags: string[];
  };
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVED' | 'RELEASED';
  quantity: number;
  reason: string;
  createdAt: string;
  product: {
    name: string;
    category: string;
  };
}

export interface InventoryStats {
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  averageStock: number;
  topCategories: {
    category: string;
    quantity: number;
    value: number;
  }[];
}

interface UpdateInventoryData {
  quantity: number;
  reason: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVED' | 'RELEASED';
}

interface InventoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  category?: string;
  sortBy?: 'name' | 'quantity' | 'category' | 'lastUpdated';
  sortOrder?: 'asc' | 'desc';
}

interface MovementsQuery {
  page?: number;
  limit?: number;
  productId?: string;
  type?: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVED' | 'RELEASED';
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'type' | 'quantity';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useInventory = () => {
  const { token } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });

  // ==========================================================================
  // FUNCIONES DE API
  // ==========================================================================

  const fetchInventory = useCallback(async (query: InventoryQuery = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const data: any = await apiRequest(
        `${API_CONFIG.BASE_URL}/api/inventory?${params.toString()}`,
        {
          headers: createAuthHeaders(),
          timeout: 8000,
        }
      );

      setInventory(data.inventory || []);
      setPagination(data.pagination || {});
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar inventario';
      setError(errorMessage);
      console.error('Error fetching inventory:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInventoryStats = useCallback(async () => {
    try {
      const data: any = await apiRequest(
        `${API_CONFIG.BASE_URL}/api/inventory/stats/overview`,
        {
          headers: createAuthHeaders(),
          timeout: 8000,
        }
      );

      setStats(data);
      return data;
    } catch (err) {
      console.error('Error fetching inventory stats:', err);
      throw err;
    }
  }, []);

  const fetchInventoryByProduct = async (productId: string) => {
    setLoading(true);
    setError(null);

    try {
      const data: any = await apiRequest(
        `${API_CONFIG.BASE_URL}/api/inventory/${productId}`,
        {
          headers: createAuthHeaders(),
          timeout: 8000,
        }
      );

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar inventario del producto';
      setError(errorMessage);
      console.error('Error fetching product inventory:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateInventory = async (productId: string, updateData: UpdateInventoryData) => {
    setLoading(true);
    setError(null);

    try {
      const data: any = await apiRequest(
        `${API_CONFIG.BASE_URL}/api/inventory/${productId}`,
        {
          method: 'PUT',
          headers: createAuthHeaders(),
          body: JSON.stringify(updateData),
          timeout: 8000,
        }
      );
      
      // Actualizar el inventario local
      setInventory(prev => 
        prev.map(item => 
          item.productId === productId 
            ? { ...item, ...data, lastUpdated: new Date().toISOString() }
            : item
        )
      );

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar inventario';
      setError(errorMessage);
      console.error('Error updating inventory:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (query: MovementsQuery = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const data: any = await apiRequest(
        `${API_CONFIG.BASE_URL}/api/inventory/movements/history?${params.toString()}`,
        {
          headers: createAuthHeaders(),
          timeout: 8000,
        }
      );

      setMovements(data.movements || []);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar movimientos';
      setError(errorMessage);
      console.error('Error fetching movements:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funciones auxiliares
  const getProductInventory = (productId: string) => {
    return inventory.find(item => item.productId === productId);
  };

  const getLowStockProducts = (threshold: number = 5) => {
    return inventory.filter(item => item.quantity <= threshold && item.quantity > 0);
  };

  const getOutOfStockProducts = () => {
    return inventory.filter(item => item.quantity <= 0);
  };

  // ============================================================================
  // EFECTO INICIAL
  // ============================================================================

  useEffect(() => {
    if (token) {
      fetchInventory();
      fetchInventoryStats();
    }
  }, [token]); // Solo depender del token

  // ============================================================================
  // RETORNO DEL HOOK
  // ============================================================================

  return {
    // Estado
    inventory,
    movements,
    stats,
    loading,
    error,
    pagination,

    // Funciones
    fetchInventory,
    fetchInventoryStats,
    fetchInventoryByProduct,
    updateInventory,
    fetchMovements,

    // Utilidades
    getProductInventory,
    getLowStockProducts,
    getOutOfStockProducts,
    
    // Funciones de ayuda
    refetch: fetchInventory,
    clearError: () => setError(null),
  };
};

export default useInventory;