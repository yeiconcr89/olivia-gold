import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG, createAuthHeaders } from '../config/api';

// Estado global compartido para el carrito
let globalCartState: CartSummary | null = null;
let globalCartListeners: Array<(cart: CartSummary | null) => void> = [];

// Mapa de requests pendientes para prevenir duplicados
const pendingRequests = new Map<string, Promise<CartSummary>>();

const updateGlobalCart = (cart: CartSummary | null) => {
  // Solo actualizar si realmente cambió
  if (JSON.stringify(globalCartState) !== JSON.stringify(cart)) {
    globalCartState = cart;
    globalCartListeners.forEach(listener => listener(cart));
  }
};

const subscribeToGlobalCart = (listener: (cart: CartSummary | null) => void) => {
  globalCartListeners.push(listener);
  return () => {
    globalCartListeners = globalCartListeners.filter(l => l !== listener);
  };
};

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface CartProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  inStock: boolean;
  inventory?: {
    quantity: number;
    reservedQuantity: number;
  };
}

interface CartCustomization {
  text?: string;
  color?: string;
  material?: string;
  [key: string]: unknown;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  size?: string;
  customization?: CartCustomization;
  product: CartProduct;
  subtotal: number;
}

interface CartSummary {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  couponCode?: string;
  expiresAt: Date;
}

interface AddToCartData {
  productId: string;
  quantity: number;
  size?: string;
  customization?: CartCustomization;
}

interface UpdateCartItemData {
  quantity: number;
  size?: string;
  customization?: CartCustomization;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useCart = () => {
  const [cart, setCart] = useState<CartSummary | null>(globalCartState);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Suscribirse al estado global
  useEffect(() => {
    const unsubscribe = subscribeToGlobalCart(setCart);
    return unsubscribe;
  }, []);

  // Obtener identificadores de carrito
  const getCartIdentifiers = () => {
    const sessionId = localStorage.getItem('cartSessionId') || 
      Math.random().toString(36).substring(2, 15);
    
    if (!localStorage.getItem('cartSessionId')) {
      localStorage.setItem('cartSessionId', sessionId);
    }
    
    const guestEmail = localStorage.getItem('guestEmail');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🆔 getCartIdentifiers:', { sessionId, guestEmail });
    }
    return { sessionId, guestEmail };
  };

  // Obtener carrito actual
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { sessionId, guestEmail } = getCartIdentifiers();
      const queryParams = new URLSearchParams();
      
      if (sessionId) queryParams.append('sessionId', sessionId);
      if (guestEmail) queryParams.append('guestEmail', guestEmail);

      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.CART.GET}?${queryParams.toString()}`,
        {
          headers: createAuthHeaders(),
        }
      );

      if (!response.ok) {
        // Si es error 400, limpiar localStorage y crear nuevo carrito
        if (response.status === 400) {
          localStorage.removeItem('cartSessionId');
          localStorage.removeItem('guestEmail');
          // Reintentar con nuevo sessionId
          const { sessionId: newSessionId, guestEmail: newGuestEmail } = getCartIdentifiers();
          const newQueryParams = new URLSearchParams();
          if (newSessionId) newQueryParams.append('sessionId', newSessionId);
          if (newGuestEmail) newQueryParams.append('guestEmail', newGuestEmail);
          
          const retryResponse = await fetch(
            `${API_CONFIG.ENDPOINTS.CART.GET}?${newQueryParams.toString()}`,
            { headers: createAuthHeaders() }
          );
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            setCart(retryData.cart);
            return retryData.cart;
          }
        }
        
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ fetchCart response:', data);
      }
      updateGlobalCart(data.cart);
      return data.cart;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar carrito';
      setError(errorMessage);
      console.error('Error fetching cart:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Agregar item al carrito
  const addToCart = async (itemData: AddToCartData) => {
    // Crear una clave única para este request (sin timestamp para permitir deduplicación)
    const requestKey = `addToCart-${itemData.productId}-${itemData.quantity}-${itemData.size || 'no-size'}`;
    console.log('🛒 useCart addToCart llamado con:', itemData, 'requestKey:', requestKey);
    
    // Si ya hay un request pendiente para este mismo item, retornar la promesa existente
    if (pendingRequests.has(requestKey)) {
      console.log('⚠️ useCart addToCart: Request duplicado detectado, usando promesa existente');
      return pendingRequests.get(requestKey);
    }
    
    const requestPromise = (async () => {
      try {
        setLoading(true);
        setError(null);

        const { sessionId, guestEmail } = getCartIdentifiers();
        const queryParams = new URLSearchParams();
        
        if (sessionId) queryParams.append('sessionId', sessionId);
        if (guestEmail) queryParams.append('guestEmail', guestEmail);

        console.log('Enviando request al carrito:', {
          url: `${API_CONFIG.ENDPOINTS.CART.ADD}?${queryParams.toString()}`,
          data: itemData
        });

        const response = await fetch(
          `${API_CONFIG.ENDPOINTS.CART.ADD}?${queryParams.toString()}`,
          {
            method: 'POST',
            headers: {
              ...createAuthHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          console.error('Error response from server:', errorData);
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ useCart addToCart exitoso:', requestKey, 'cart items:', data.cart.itemCount);
        updateGlobalCart(data.cart);
        return data.cart;
      } catch (err) {
        console.error('❌ useCart addToCart error:', requestKey, err);
        const errorMessage = err instanceof Error ? err.message : 'Error al agregar al carrito';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
        // Limpiar el request pendiente después de un delay
        setTimeout(() => {
          pendingRequests.delete(requestKey);
        }, 1000);
      }
    })();
    
    // Guardar la promesa para deduplicación
    pendingRequests.set(requestKey, requestPromise);
    
    return requestPromise;
  };

  // Actualizar item del carrito
  const updateCartItem = async (itemId: string, updateData: UpdateCartItemData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.CART.UPDATE_ITEM(itemId)}`,
        {
          method: 'PUT',
          headers: createAuthHeaders(),
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      updateGlobalCart(data.cart);
      return data.cart;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar item';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar item del carrito
  const removeFromCart = async (itemId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.CART.REMOVE_ITEM(itemId)}`,
        {
          method: 'DELETE',
          headers: createAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      updateGlobalCart(data.cart);
      return data.cart;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar item';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Limpiar carrito completo
  const clearCart = async () => {
    try {
      if (!cart) return;

      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.CART.CLEAR(cart.id)}`,
        {
          method: 'DELETE',
          headers: createAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      updateGlobalCart(data.cart);
      return data.cart;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al limpiar carrito';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Aplicar cupón
  const applyCoupon = async (couponCode: string) => {
    try {
      if (!cart) return;

      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.CART.APPLY_COUPON(cart.id)}`,
        {
          method: 'POST',
          headers: createAuthHeaders(),
          body: JSON.stringify({ couponCode }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      // Refrescar carrito después de aplicar cupón
      await fetchCart();
      return data.coupon;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al aplicar cupón';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cambiar cantidad rápida
  const changeQuantity = async (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity === 0) {
        return await removeFromCart(itemId);
      } else if (newQuantity > 10) {
        throw new Error('No se pueden agregar más de 10 unidades del mismo producto');
      } else {
        return await updateCartItem(itemId, { quantity: newQuantity });
      }
    } catch (err) {
      // Convertir errores técnicos en mensajes amigables
      if (err instanceof Error) {
        if (err.message.includes('quantity: Number must be less than or equal to 10')) {
          throw new Error('Has alcanzado el límite máximo de 10 unidades por producto');
        } else if (err.message.includes('quantity: Number must be greater than or equal to 1')) {
          throw new Error('La cantidad mínima es 1 unidad');
        }
      }
      throw err;
    }
  };

  // Obtener cantidad total de items
  const getTotalItems = () => {
    return cart?.itemCount || 0;
  };

  // Obtener total del carrito
  const getTotal = () => {
    return cart?.total || 0;
  };

  // Obtener subtotal
  const getSubtotal = () => {
    return cart?.subtotal || 0;
  };

  // Verificar si el carrito está vacío
  const isEmpty = () => {
    return !cart || cart.items.length === 0;
  };

  // Refrescar carrito (limpiar cache y recargar)
  const refreshCart = async () => {
    localStorage.removeItem('cartSessionId');
    localStorage.removeItem('guestEmail');
    updateGlobalCart(null);
    await fetchCart();
  };

  // Cargar carrito inicial - solo si no hay estado global
  useEffect(() => {
    if (!globalCartState) {
      fetchCart();
    }
  }, []); // Sin dependencias para evitar loops

  // Refrescar carrito cuando la ventana obtiene el foco (para sincronizar con otros tabs)
  // TEMPORALMENTE DESHABILITADO para evitar loops
  // useEffect(() => {
  //   const handleFocus = () => {
  //     fetchCart();
  //   };

  //   window.addEventListener('focus', handleFocus);
  //   return () => window.removeEventListener('focus', handleFocus);
  // }, []);

  return {
    // Estado
    cart,
    loading,
    error,
    
    // Acciones
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyCoupon,
    changeQuantity,
    
    // Utilidades
    getTotalItems,
    getTotal,
    getSubtotal,
    isEmpty,
    refreshCart,
  };
};