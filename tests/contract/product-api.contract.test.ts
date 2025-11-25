/**
 * Pact Contract Tests - Product API
 * Consumer: Frontend React App
 * Provider: Backend API
 */

import { PactV3, MatchersV3, SpecificationVersion } from '@pact-foundation/pact';
import { describe, beforeEach, afterEach, test, expect } from 'vitest';
import axios from 'axios';

const { like, eachLike, term, regex } = MatchersV3;

// Create a Pact instance
const provider = new PactV3({
  consumer: 'olivia-gold-frontend',
  provider: 'olivia-gold-api',
  port: 1234, // Mock server port
  dir: './pacts',
  spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
  logLevel: 'info'
});

describe('Product API Contract Tests', () => {
  
  beforeEach(() => {
    provider.setup();
  });

  afterEach(async () => {
    await provider.finalize();
  });

  describe('GET /api/products', () => {
    test('should return a list of products', async () => {
      // Define the expected interaction
      const expectedProducts = eachLike(
        {
          id: like('prod-123'),
          name: like('Anillo de Oro Elegante'),
          description: like('Hermoso anillo de oro 18k con diseño elegante'),
          price: like(299.99),
          category: term({
            matcher: 'Anillos|Collares|Pulseras|Aretes|Conjuntos',
            generate: 'Anillos'
          }),
          subcategory: like('Oro'),
          materials: like('Oro 18k'),
          dimensions: like('Talla 7'),
          care: like('Limpiar con paño suave'),
          inStock: like(true),
          featured: like(false),
          images: eachLike({
            url: regex({
              matcher: '^https?://.*\\.(jpg|jpeg|png|webp)$',
              generate: 'https://example.com/product.jpg'
            }),
            altText: like('Producto de joyería'),
            isPrimary: like(true),
            order: like(0)
          }, { min: 1 }),
          tags: eachLike('elegante', { min: 1 }),
          createdAt: regex({
            matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}',
            generate: '2024-01-01T10:00:00'
          }),
          updatedAt: regex({
            matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}',
            generate: '2024-01-01T10:00:00'
          })
        },
        { min: 1, max: 20 }
      );

      // Set up the interaction
      provider
        .given('products exist in the system')
        .uponReceiving('a request for products')
        .withRequest({
          method: 'GET',
          path: '/api/products',
          query: {
            page: '1',
            limit: '20'
          },
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            products: expectedProducts,
            pagination: {
              page: like(1),
              limit: like(20),
              total: like(100),
              totalPages: like(5)
            }
          }
        });

      // Execute the test
      await provider.executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/products?page=1&limit=20`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('products');
        expect(response.data).toHaveProperty('pagination');
        expect(Array.isArray(response.data.products)).toBe(true);
        expect(response.data.products.length).toBeGreaterThan(0);
        
        // Validate product structure
        const product = response.data.products[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('inStock');
        expect(product.images).toBeInstanceOf(Array);
        expect(product.images.length).toBeGreaterThan(0);
      });
    });

    test('should handle filtering by category', async () => {
      const categoryProducts = eachLike({
        id: like('ring-123'),
        name: like('Anillo de Plata'),
        price: like(199.99),
        category: like('Anillos'),
        subcategory: like('Plata'),
        inStock: like(true),
        featured: like(false)
      }, { min: 1 });

      provider
        .given('ring products exist')
        .uponReceiving('a request for products filtered by category')
        .withRequest({
          method: 'GET',
          path: '/api/products',
          query: {
            category: 'Anillos',
            page: '1',
            limit: '10'
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            products: categoryProducts,
            pagination: {
              page: like(1),
              limit: like(10),
              total: like(25),
              totalPages: like(3)
            }
          }
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/products`, {
          params: { category: 'Anillos', page: 1, limit: 10 }
        });

        expect(response.status).toBe(200);
        expect(response.data.products).toBeInstanceOf(Array);
        response.data.products.forEach((product: any) => {
          expect(product.category).toBe('Anillos');
        });
      });
    });
  });

  describe('GET /api/products/:id', () => {
    test('should return a single product by ID', async () => {
      const productId = 'prod-123';
      
      provider
        .given(`product with id ${productId} exists`)
        .uponReceiving('a request for a specific product')
        .withRequest({
          method: 'GET',
          path: `/api/products/${productId}`,
          headers: {
            'Accept': 'application/json'
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: like(productId),
            name: like('Anillo de Oro Premium'),
            description: like('Anillo de oro 18k con diamantes'),
            price: like(599.99),
            originalPrice: like(699.99),
            category: like('Anillos'),
            subcategory: like('Oro'),
            materials: like('Oro 18k, Diamantes'),
            dimensions: like('Talla 7, Ancho 5mm'),
            care: like('Limpiar con paño suave, evitar químicos'),
            inStock: like(true),
            featured: like(true),
            images: eachLike({
              id: like('img-1'),
              url: like('https://example.com/ring1.jpg'),
              altText: like('Anillo de oro premium'),
              isPrimary: like(true),
              order: like(0)
            }, { min: 1 }),
            tags: eachLike('premium', { min: 1 }),
            inventory: {
              quantity: like(5),
              reserved: like(1),
              available: like(4)
            },
            createdAt: like('2024-01-01T10:00:00Z'),
            updatedAt: like('2024-01-01T10:00:00Z')
          }
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/products/${productId}`, {
          headers: { 'Accept': 'application/json' }
        });

        expect(response.status).toBe(200);
        expect(response.data.id).toBe(productId);
        expect(response.data).toHaveProperty('name');
        expect(response.data).toHaveProperty('price');
        expect(response.data).toHaveProperty('description');
        expect(response.data).toHaveProperty('inventory');
        expect(typeof response.data.price).toBe('number');
        expect(response.data.price).toBeGreaterThan(0);
      });
    });

    test('should return 404 for non-existent product', async () => {
      const nonExistentId = 'non-existent-product';

      provider
        .given('product does not exist')
        .uponReceiving('a request for a non-existent product')
        .withRequest({
          method: 'GET',
          path: `/api/products/${nonExistentId}`
        })
        .willRespondWith({
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: like('Product not found'),
            code: like('PRODUCT_NOT_FOUND'),
            message: like(`Product with id ${nonExistentId} was not found`)
          }
        });

      await provider.executeTest(async (mockServer) => {
        try {
          await axios.get(`${mockServer.url}/api/products/${nonExistentId}`);
        } catch (error: any) {
          expect(error.response.status).toBe(404);
          expect(error.response.data).toHaveProperty('error');
          expect(error.response.data.error).toBe('Product not found');
        }
      });
    });
  });

  describe('POST /api/products (Admin)', () => {
    test('should create a new product with valid admin token', async () => {
      const newProduct = {
        name: 'Nuevo Anillo de Plata',
        description: 'Anillo elegante de plata 925',
        price: 299.99,
        category: 'Anillos',
        subcategory: 'Plata',
        materials: 'Plata 925',
        dimensions: 'Talla ajustable',
        care: 'Limpiar con paño suave',
        inStock: true,
        featured: false,
        images: [
          {
            url: 'https://example.com/new-ring.jpg',
            altText: 'Nuevo anillo de plata',
            isPrimary: true,
            order: 0
          }
        ],
        tags: ['plata', 'elegante', 'ajustable']
      };

      provider
        .given('user is authenticated as admin')
        .uponReceiving('a request to create a new product')
        .withRequest({
          method: 'POST',
          path: '/api/products',
          headers: {
            'Authorization': regex({
              matcher: '^Bearer [A-Za-z0-9\\-\\._~\\+\\/]+=*$',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
            }),
            'Content-Type': 'application/json'
          },
          body: newProduct
        })
        .willRespondWith({
          status: 201,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: like('prod-456'),
            ...newProduct,
            createdAt: like('2024-01-01T10:00:00Z'),
            updatedAt: like('2024-01-01T10:00:00Z')
          }
        });

      await provider.executeTest(async (mockServer) => {
        const response = await axios.post(`${mockServer.url}/api/products`, newProduct, {
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data.name).toBe(newProduct.name);
        expect(response.data.price).toBe(newProduct.price);
        expect(response.data).toHaveProperty('createdAt');
      });
    });

    test('should reject creation without admin authorization', async () => {
      const newProduct = {
        name: 'Unauthorized Product',
        price: 100,
        category: 'Anillos'
      };

      provider
        .given('user is not authenticated')
        .uponReceiving('an unauthorized request to create a product')
        .withRequest({
          method: 'POST',
          path: '/api/products',
          headers: {
            'Content-Type': 'application/json'
          },
          body: newProduct
        })
        .willRespondWith({
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: like('Unauthorized'),
            message: like('Authentication required')
          }
        });

      await provider.executeTest(async (mockServer) => {
        try {
          await axios.post(`${mockServer.url}/api/products`, newProduct, {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error: any) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.error).toBe('Unauthorized');
        }
      });
    });
  });

  describe('Error Handling Contracts', () => {
    test('should handle server errors gracefully', async () => {
      provider
        .given('server is experiencing issues')
        .uponReceiving('a request when server has problems')
        .withRequest({
          method: 'GET',
          path: '/api/products'
        })
        .willRespondWith({
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: like('Internal Server Error'),
            message: like('An unexpected error occurred'),
            timestamp: like('2024-01-01T10:00:00Z')
          }
        });

      await provider.executeTest(async (mockServer) => {
        try {
          await axios.get(`${mockServer.url}/api/products`);
        } catch (error: any) {
          expect(error.response.status).toBe(500);
          expect(error.response.data).toHaveProperty('error');
          expect(error.response.data).toHaveProperty('timestamp');
        }
      });
    });

    test('should validate request parameters', async () => {
      provider
        .given('invalid query parameters provided')
        .uponReceiving('a request with invalid parameters')
        .withRequest({
          method: 'GET',
          path: '/api/products',
          query: {
            page: 'invalid',
            limit: '-1'
          }
        })
        .willRespondWith({
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: like('Bad Request'),
            message: like('Invalid query parameters'),
            details: {
              page: like('Page must be a positive number'),
              limit: like('Limit must be between 1 and 100')
            }
          }
        });

      await provider.executeTest(async (mockServer) => {
        try {
          await axios.get(`${mockServer.url}/api/products`, {
            params: { page: 'invalid', limit: '-1' }
          });
        } catch (error: any) {
          expect(error.response.status).toBe(400);
          expect(error.response.data.error).toBe('Bad Request');
          expect(error.response.data).toHaveProperty('details');
        }
      });
    });
  });
});