import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { API_CONFIG, apiRequest, createAuthHeaders } from '../config/api';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Cargar productos
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = createAuthHeaders();
      const data = await apiRequest<any>(API_CONFIG.ENDPOINTS.PRODUCTS.LIST, {
        headers,
      });

      // La API devuelve un objeto con productos, no directamente un array
      const rawProducts = Array.isArray(data) ? data : (data.products || []);
      
      // Validar y sanitizar los productos
      const validProducts = rawProducts.map((product: any) => ({
        id: product.id || '',
        name: product.name || '',
        price: Number(product.price) || 0,
        originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
        category: product.category || '',
        subcategory: product.subcategory || '',
        description: product.description || '',
        materials: product.materials || '',
        dimensions: product.dimensions || '',
        care: product.care || '',
        inStock: Boolean(product.inStock),
        featured: Boolean(product.featured),
        rating: Number(product.rating) || 0,
        reviewCount: Number(product.reviewCount) || 0,
        images: Array.isArray(product.images) ? product.images : [],
        tags: Array.isArray(product.tags) ? product.tags : [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }));

      setProducts(validProducts);
    } catch (err: any) {
      const message = err?.response?.data?.error || (err instanceof Error ? err.message : 'Error al cargar los productos');
      setError(message);
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar productos al iniciar el componente
  useEffect(() => {
    fetchProducts();
  }, []); // Solo al montar el componente

  // Añadir producto
  const addProduct = async (product: Omit<Product, 'id'>): Promise<Product | null> => {
    if (!token) {
      setError('No estás autenticado');
      return null;
    }

    setError(null);
    console.log('useProducts: Datos a enviar:', JSON.stringify(product, null, 2));

    try {
      const responseData = await apiRequest<any>(API_CONFIG.ENDPOINTS.PRODUCTS.CREATE, {
        method: 'POST',
        headers: {
          ...createAuthHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      const newProduct = responseData.product || responseData; // Manejar ambos formatos
      console.log('Nuevo producto agregado:', newProduct);
      setProducts(prev => {
        const updatedProducts = [...prev, newProduct];
        console.log('Lista de productos actualizada:', updatedProducts.length, 'productos');
        return updatedProducts;
      });
      return newProduct;
    } catch (err: any) {
      const message = err?.response?.data?.error || (err instanceof Error ? err.message : 'Error al añadir el producto');
      setError(message);
      console.error('Error al añadir producto:', err);
      return null;
    }
  };

  // Actualizar producto
  const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product | null> => {
    if (!token) {
      setError('No estás autenticado');
      return null;
    }

    setError(null);

    try {
      const responseData = await apiRequest<any>(API_CONFIG.ENDPOINTS.PRODUCTS.UPDATE(id), {
        method: 'PUT',
        headers: {
          ...createAuthHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const updatedProduct = responseData.product || responseData; // Manejar ambos formatos
      setProducts(prev => prev.map(p => (p.id === id ? updatedProduct : p)));
      return updatedProduct;
    } catch (err: any) {
      const message = err?.response?.data?.error || (err instanceof Error ? err.message : 'Error al actualizar el producto');
      setError(message);
      console.error('Error al actualizar producto:', err);
      return null;
    }
  };

  // Eliminar producto
  const deleteProduct = async (id: string): Promise<boolean> => {
    if (!token) {
      setError('No estás autenticado');
      return false;
    }

    setError(null);

    try {
      await apiRequest<any>(API_CONFIG.ENDPOINTS.PRODUCTS.DELETE(id), {
        method: 'DELETE',
        headers: {
          ...createAuthHeaders(token),
        },
      });

      setProducts(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err: any) {
      const message = err?.response?.data?.error || (err instanceof Error ? err.message : 'Error al eliminar el producto');
      setError(message);
      console.error('Error al eliminar producto:', err);
      return false;
    }
  };

  // Actualizar stock
  const updateStock = async (id: string, stock: number): Promise<boolean> => {
    const result = await updateProduct(id, { inStock: stock > 0 });
    return !!result;
  };

  // Destacar/quitar destacado
  const toggleFeatured = async (id: string, featured: boolean): Promise<boolean> => {
    const result = await updateProduct(id, { featured });
    return !!result;
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    toggleFeatured,
  };
};