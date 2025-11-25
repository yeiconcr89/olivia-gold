import { describe, it, expect, vi, beforeEach } from 'vitest';
import { API_CONFIG, createAuthHeaders, apiRequest } from '../api';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('API_CONFIG', () => {
    it('should have correct base URL from environment', () => {
      expect(API_CONFIG.BASE_URL).toBeDefined();
      expect(typeof API_CONFIG.BASE_URL).toBe('string');
    });

    it('should have all required endpoints', () => {
      expect(API_CONFIG.ENDPOINTS.AUTH.LOGIN).toBeDefined();
      expect(API_CONFIG.ENDPOINTS.AUTH.REGISTER).toBeDefined();
      expect(API_CONFIG.ENDPOINTS.PRODUCTS.LIST).toBeDefined();
      expect(API_CONFIG.ENDPOINTS.CUSTOMERS.LIST).toBeDefined();
    });

    it('should have correct default headers', () => {
      expect(API_CONFIG.DEFAULT_HEADERS).toEqual({
        'Content-Type': 'application/json',
      });
    });
  });

  describe('createAuthHeaders', () => {
    it('should create headers without token', () => {
      const headers = createAuthHeaders();
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Authorization']).toBeUndefined();
    });

    it('should create headers with provided token', () => {
      const token = 'test-token';
      const headers = createAuthHeaders(token);
      expect(headers['Authorization']).toBe(`Bearer ${token}`);
    });

    it('should use token from localStorage when no token provided', () => {
      const token = 'stored-token';
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(token);
      
      const headers = createAuthHeaders();
      expect(headers['Authorization']).toBe(`Bearer ${token}`);
    });
  });

  describe('apiRequest', () => {
    const mockFetch = fetch as ReturnType<typeof vi.fn>;

    it('should make successful API request', async () => {
      const mockData = { success: true, data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await apiRequest('/test-endpoint');
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith('/test-endpoint', expect.objectContaining({
        headers: expect.objectContaining(API_CONFIG.DEFAULT_HEADERS),
      }));
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API Error';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: errorMessage }),
      } as Response);

      await expect(apiRequest('/test-endpoint')).rejects.toMatchObject({
        status: 400,
        response: { data: { error: errorMessage } }
      });
    });

    it('should handle network errors', async () => {
      const networkError = new TypeError('Network error');
      networkError.message = 'Network error';
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(apiRequest('/test-endpoint')).rejects.toMatchObject({
        status: 0,
        statusText: 'Network Error'
      });
    });

    it('should handle timeout', async () => {
      // Mock AbortError
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(apiRequest('/test-endpoint')).rejects.toMatchObject({
        status: 408,
        statusText: 'Request Timeout'
      });
    });

    it('should merge custom headers', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const customHeaders = { 'Custom-Header': 'value' };
      await apiRequest('/test-endpoint', { headers: customHeaders });

      expect(mockFetch).toHaveBeenCalledWith('/test-endpoint', expect.objectContaining({
        headers: expect.objectContaining({
          ...API_CONFIG.DEFAULT_HEADERS,
          ...customHeaders,
        }),
      }));
    });
  });
});

// Test endpoint construction
describe('Endpoint construction', () => {
  it('should construct product endpoints correctly', () => {
    const productId = '123';
    expect(API_CONFIG.ENDPOINTS.PRODUCTS.UPDATE(productId)).toBe(
      `${API_CONFIG.BASE_URL}/api/products/${productId}`
    );
    expect(API_CONFIG.ENDPOINTS.PRODUCTS.DELETE(productId)).toBe(
      `${API_CONFIG.BASE_URL}/api/products/${productId}`
    );
  });

  it('should construct customer endpoints correctly', () => {
    const customerId = '456';
    expect(API_CONFIG.ENDPOINTS.CUSTOMERS.UPDATE(customerId)).toBe(
      `${API_CONFIG.BASE_URL}/api/customers/${customerId}`
    );
  });

  it('should construct review endpoints correctly', () => {
    const reviewId = '789';
    expect(API_CONFIG.ENDPOINTS.REVIEWS.APPROVE(reviewId)).toBe(
      `${API_CONFIG.BASE_URL}/api/reviews/${reviewId}/approve`
    );
    expect(API_CONFIG.ENDPOINTS.REVIEWS.REJECT(reviewId)).toBe(
      `${API_CONFIG.BASE_URL}/api/reviews/${reviewId}/reject`
    );
  });
});