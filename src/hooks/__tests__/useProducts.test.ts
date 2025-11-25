import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from '../useProducts';
import { mockProduct } from '../../utils/test-utils';

// Mock the API module
vi.mock('../../config/api', () => ({
  API_CONFIG: {
    ENDPOINTS: {
      PRODUCTS: {
        LIST: '/api/products'
      }
    }
  },
  apiRequest: vi.fn()
}));

import { apiRequest } from '../../config/api';
const mockApiRequest = apiRequest as ReturnType<typeof vi.fn>;

describe('useProducts Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Clear any cached data
    localStorage.removeItem('cachedProducts');
    localStorage.removeItem('productsCacheTimestamp');
  });

  it('should initialize with correct default state', () => {
    mockApiRequest.mockResolvedValueOnce({ products: [] });
    
    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should fetch products successfully', async () => {
    const mockProducts = [mockProduct];
    mockApiRequest.mockResolvedValueOnce({ products: mockProducts });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.error).toBe(null);
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to fetch products';
    mockApiRequest.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should use cached data when available and fresh', () => {
    const cachedProducts = [mockProduct];
    const cacheTime = Date.now().toString();
    
    localStorage.setItem('cachedProducts', JSON.stringify(cachedProducts));
    localStorage.setItem('productsCacheTimestamp', cacheTime);

    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual(cachedProducts);
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it('should refetch when cache is expired', async () => {
    const cachedProducts = [mockProduct];
    const expiredCacheTime = (Date.now() - 10 * 60 * 1000).toString(); // 10 minutes ago
    
    localStorage.setItem('cachedProducts', JSON.stringify(cachedProducts));
    localStorage.setItem('productsCacheTimestamp', expiredCacheTime);

    const freshProducts = [{ ...mockProduct, id: '2' }];
    mockApiRequest.mockResolvedValueOnce({ products: freshProducts });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(freshProducts);
    expect(mockApiRequest).toHaveBeenCalled();
  });

  describe('Product manipulation functions', () => {
    it('should add a product', async () => {
      mockApiRequest.mockResolvedValueOnce({ products: [] });
      
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newProduct = {
        name: 'New Product',
        price: 200000,
        category: 'anillos',
        subcategory: 'compromiso',
        images: ['image.jpg'],
        description: 'New description',
        materials: 'Gold',
        dimensions: '5cm',
        care: 'Handle with care',
        inStock: true,
        featured: false,
        rating: 0,
        reviewCount: 0,
        tags: ['new'],
      };

      result.current.addProduct(newProduct);

      expect(result.current.products).toHaveLength(1);
      expect(result.current.products[0]).toMatchObject(newProduct);
      expect(result.current.products[0].id).toBeDefined();
    });

    it('should update a product', async () => {
      const initialProducts = [mockProduct];
      mockApiRequest.mockResolvedValueOnce({ products: initialProducts });
      
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updates = { name: 'Updated Product', price: 300000 };
      result.current.updateProduct(mockProduct.id, updates);

      const updatedProduct = result.current.products.find(p => p.id === mockProduct.id);
      expect(updatedProduct?.name).toBe('Updated Product');
      expect(updatedProduct?.price).toBe(300000);
    });

    it('should delete a product', async () => {
      const initialProducts = [mockProduct];
      mockApiRequest.mockResolvedValueOnce({ products: initialProducts });
      
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.deleteProduct(mockProduct.id);

      expect(result.current.products).toHaveLength(0);
    });

    it('should get product by ID', async () => {
      const initialProducts = [mockProduct];
      mockApiRequest.mockResolvedValueOnce({ products: initialProducts });
      
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const foundProduct = result.current.getProductById(mockProduct.id);
      expect(foundProduct).toEqual(mockProduct);

      const notFound = result.current.getProductById('nonexistent');
      expect(notFound).toBeUndefined();
    });

    it('should filter products by category', async () => {
      const products = [
        mockProduct,
        { ...mockProduct, id: '2', category: 'anillos' }
      ];
      mockApiRequest.mockResolvedValueOnce({ products });
      
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const collaresProducts = result.current.getProductsByCategory('collares');
      expect(collaresProducts).toHaveLength(1);
      expect(collaresProducts[0].category).toBe('collares');

      const allProducts = result.current.getProductsByCategory('all');
      expect(allProducts).toHaveLength(2);
    });

    it('should search products by term', async () => {
      const products = [
        mockProduct,
        { ...mockProduct, id: '2', name: 'Another Product' }
      ];
      mockApiRequest.mockResolvedValueOnce({ products });
      
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const searchResults = result.current.searchProducts('Test');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe('Test Product');

      const noResults = result.current.searchProducts('nonexistent');
      expect(noResults).toHaveLength(0);
    });
  });
});