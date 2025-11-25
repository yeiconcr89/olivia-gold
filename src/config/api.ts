/**
 * API Configuration
 * Centraliza todas las URLs y configuraciones de API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: `${API_BASE_URL}/api/auth/login`,
      REGISTER: `${API_BASE_URL}/api/auth/register`,
      LOGOUT: `${API_BASE_URL}/api/auth/logout`,
      VALIDATE: `${API_BASE_URL}/api/auth/validate`,
      FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
      RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
      GOOGLE_VERIFY: `${API_BASE_URL}/api/auth/google/verify`,
    },
    // Product endpoints
    PRODUCTS: {
      LIST: `${API_BASE_URL}/api/products`,
      CREATE: `${API_BASE_URL}/api/products`,
      UPDATE: (id: string) => `${API_BASE_URL}/api/products/${id}`,
      DELETE: (id: string) => `${API_BASE_URL}/api/products/${id}`,
    },
    // Customer endpoints
    CUSTOMERS: {
      LIST: `${API_BASE_URL}/api/customers`,
      CREATE: `${API_BASE_URL}/api/customers`,
      UPDATE: (id: string) => `${API_BASE_URL}/api/customers/${id}`,
      DELETE: (id: string) => `${API_BASE_URL}/api/customers/${id}`,
    },
    // Order endpoints
    ORDERS: {
      LIST: `${API_BASE_URL}/api/orders`,
      CREATE: `${API_BASE_URL}/api/orders`,
      GET: (id: string) => `${API_BASE_URL}/api/orders/${id}`,
      UPDATE: (id: string) => `${API_BASE_URL}/api/orders/${id}`,
      DELETE: (id: string) => `${API_BASE_URL}/api/orders/${id}`,
      UPDATE_STATUS: (id: string) => `${API_BASE_URL}/api/orders/${id}/status`,
      STATS: `${API_BASE_URL}/api/orders/stats/overview`,
      // Advanced orders
      ADVANCED: {
        LIST: `${API_BASE_URL}/api/orders/advanced`,
        CREATE_FROM_CART: `${API_BASE_URL}/api/orders/advanced/create-from-cart`,
        GET: (id: string) => `${API_BASE_URL}/api/orders/advanced/${id}`,
        UPDATE_STATUS: (id: string) => `${API_BASE_URL}/api/orders/advanced/${id}/status`,
        TRACKING: (id: string) => `${API_BASE_URL}/api/orders/advanced/tracking/${id}`,
        STATS: `${API_BASE_URL}/api/orders/advanced/stats/dashboard`,
      },
    },
    // Cart endpoints
    CART: {
      GET: `${API_BASE_URL}/api/cart`,
      ADD: `${API_BASE_URL}/api/cart/add`,
      UPDATE_ITEM: (itemId: string) => `${API_BASE_URL}/api/cart/items/${itemId}`,
      REMOVE_ITEM: (itemId: string) => `${API_BASE_URL}/api/cart/items/${itemId}`,
      CLEAR: (cartId: string) => `${API_BASE_URL}/api/cart/${cartId}/clear`,
      APPLY_COUPON: (cartId: string) => `${API_BASE_URL}/api/cart/${cartId}/coupon`,
      VERIFY_AVAILABILITY: `${API_BASE_URL}/api/cart/verify-availability`,
      CLEANUP: `${API_BASE_URL}/api/cart/cleanup`,
    },
    // Review endpoints
    REVIEWS: {
      LIST: `${API_BASE_URL}/api/reviews`,
      CREATE: `${API_BASE_URL}/api/reviews`,
      APPROVE: (id: string) => `${API_BASE_URL}/api/reviews/${id}/approve`,
      REJECT: (id: string) => `${API_BASE_URL}/api/reviews/${id}/reject`,
    },
    // SEO endpoints
    SEO: {
      LIST: `${API_BASE_URL}/api/seo`,
      UPDATE: (id: string) => `${API_BASE_URL}/api/seo/${id}`,
    },
    // Upload endpoints
    UPLOAD: {
      SINGLE: `${API_BASE_URL}/api/upload/single`,
      MULTIPLE: `${API_BASE_URL}/api/upload/multiple`,
      STATS: `${API_BASE_URL}/api/upload/stats`,
      GALLERY: `${API_BASE_URL}/api/upload/gallery`,
      DELETE: (publicId: string) => `${API_BASE_URL}/api/upload/${encodeURIComponent(publicId)}`,
      IMAGE: `${API_BASE_URL}/api/upload/image`,
    },
  },
  // Request configuration
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  // Timeout settings
  TIMEOUT: 10000, // 10 seconds
} as const;

/**
 * Helper function to create authenticated headers
 */
export const createAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = { ...API_CONFIG.DEFAULT_HEADERS };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Try to get token from localStorage
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
  }
  
  return headers;
};

/**
 * Helper function to create API requests with consistent error handling
 */
export const apiRequest = async <T = unknown>(
  url: string,
  options: (RequestInit & { timeout?: number }) = {}
): Promise<T> => {
  try {
    const { timeout, ...fetchOptions } = options as RequestInit & { timeout?: number };
    const timeoutMs = typeof timeout === 'number' ? timeout : API_CONFIG.TIMEOUT;

    const headers = {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...(fetchOptions.headers || {}),
    } as Record<string, string>;

    // Si el cuerpo es FormData, no establecer Content-Type para permitir que el navegador gestione el boundary
    if (typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw {
          status: response.status,
          statusText: response.statusText,
          response: { data: errorData },
        };
      }

      return await response.json();
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw {
          status: 408,
          statusText: 'Request Timeout',
          response: { data: { error: 'La solicitud ha excedido el tiempo de espera' } },
        };
      }
      if (fetchError instanceof TypeError && String(fetchError.message || '').includes('Network')) {
        throw {
          status: 0,
          statusText: 'Network Error',
          response: { data: { error: 'Error de conexión. Por favor, verifica tu conexión a internet' } },
        };
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export default API_CONFIG;