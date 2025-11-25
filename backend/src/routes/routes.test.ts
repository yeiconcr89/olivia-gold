/**
 * Routes/Controllers Testing Suite
 * Integration tests for API routes and controllers
 */

import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  product: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  customer: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  $disconnect: jest.fn()
} as unknown as PrismaClient;

// Import routes (these would need to exist)
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import customerRoutes from './customer.routes';
import adminRoutes from './admin.routes';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

describe('🛣️ Routes/Controllers Testing Suite', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mount routes
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/orders', authMiddleware, orderRoutes);
    app.use('/api/customers', authMiddleware, customerRoutes);
    app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('🔐 Authentication Routes', () => {
    describe('POST /api/auth/register', () => {
      test('should register new user with valid data', async () => {
        const newUser = {
          email: 'newuser@test.com',
          password: 'TestPassword123!',
          name: 'New User',
          role: 'CUSTOMER'
        };

        const mockCreatedUser = {
          id: 'user-123',
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: new Date()
        };

        mockPrisma.user.findUnique.mockResolvedValue(null); // User doesn't exist
        mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

        const response = await request(app)
          .post('/api/auth/register')
          .send(newUser);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(newUser.email);
      });

      test('should reject registration with existing email', async () => {
        const existingUser = {
          email: 'existing@test.com',
          password: 'TestPassword123!',
          name: 'Existing User',
          role: 'CUSTOMER'
        };

        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'existing-user',
          email: existingUser.email
        });

        const response = await request(app)
          .post('/api/auth/register')
          .send(existingUser);

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('ya está registrado');
      });

      test('should reject registration with invalid data', async () => {
        const invalidUser = {
          email: 'invalid-email',
          password: '123', // Too weak
          name: '',
          role: 'INVALID_ROLE'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidUser);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });

      test('should handle database errors gracefully', async () => {
        const userData = {
          email: 'test@test.com',
          password: 'TestPassword123!',
          name: 'Test User',
          role: 'CUSTOMER'
        };

        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockRejectedValue(new Error('Database connection failed'));

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/auth/login', () => {
      test('should authenticate user with valid credentials', async () => {
        const loginData = {
          email: 'user@test.com',
          password: 'TestPassword123!'
        };

        const mockUser = {
          id: 'user-123',
          email: loginData.email,
          password: '$2a$10$hashedpassword', // Mock hashed password
          name: 'Test User',
          role: 'CUSTOMER'
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        // Mock bcrypt.compare to return true
        const bcrypt = require('bcryptjs');
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(loginData.email);
      });

      test('should reject login with incorrect credentials', async () => {
        const loginData = {
          email: 'user@test.com',
          password: 'WrongPassword123!'
        };

        mockPrisma.user.findUnique.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Credenciales inválidas');
      });

      test('should handle rate limiting for failed login attempts', async () => {
        const loginData = {
          email: 'user@test.com',
          password: 'WrongPassword'
        };

        mockPrisma.user.findUnique.mockResolvedValue(null);

        // Make multiple failed login attempts
        for (let i = 0; i < 5; i++) {
          await request(app)
            .post('/api/auth/login')
            .send(loginData);
        }

        // The 6th attempt should be rate limited
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        expect(response.status).toBe(429);
      });
    });

    describe('POST /api/auth/forgot-password', () => {
      test('should generate password reset token for valid email', async () => {
        const email = 'user@test.com';

        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'user-123',
          email: email
        });

        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('instrucciones');
      });

      test('should handle non-existent email gracefully', async () => {
        const email = 'nonexistent@test.com';

        mockPrisma.user.findUnique.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email });

        // Should return success even for non-existent email (security best practice)
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
      });
    });
  });

  describe('📦 Product Routes', () => {
    describe('GET /api/products', () => {
      test('should return paginated products list', async () => {
        const mockProducts = [
          {
            id: 'product-1',
            name: 'Anillo de Oro',
            price: 299.99,
            category: 'Anillos',
            inStock: true
          },
          {
            id: 'product-2',
            name: 'Collar de Plata',
            price: 199.99,
            category: 'Collares',
            inStock: true
          }
        ];

        mockPrisma.product.findMany.mockResolvedValue(mockProducts);

        const response = await request(app)
          .get('/api/products')
          .query({ page: 1, limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('products');
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.products).toHaveLength(2);
      });

      test('should filter products by category', async () => {
        const mockRings = [
          {
            id: 'ring-1',
            name: 'Anillo de Oro',
            price: 299.99,
            category: 'Anillos',
            inStock: true
          }
        ];

        mockPrisma.product.findMany.mockResolvedValue(mockRings);

        const response = await request(app)
          .get('/api/products')
          .query({ category: 'Anillos' });

        expect(response.status).toBe(200);
        expect(response.body.products).toHaveLength(1);
        expect(response.body.products[0].category).toBe('Anillos');
      });

      test('should filter products by price range', async () => {
        const mockProducts = [
          {
            id: 'product-1',
            name: 'Affordable Ring',
            price: 150.00,
            category: 'Anillos',
            inStock: true
          }
        ];

        mockPrisma.product.findMany.mockResolvedValue(mockProducts);

        const response = await request(app)
          .get('/api/products')
          .query({ priceMin: 100, priceMax: 200 });

        expect(response.status).toBe(200);
        expect(response.body.products[0].price).toBeGreaterThanOrEqual(100);
        expect(response.body.products[0].price).toBeLessThanOrEqual(200);
      });

      test('should search products by name', async () => {
        const mockProducts = [
          {
            id: 'product-1',
            name: 'Anillo de Oro Rosa',
            price: 299.99,
            category: 'Anillos',
            inStock: true
          }
        ];

        mockPrisma.product.findMany.mockResolvedValue(mockProducts);

        const response = await request(app)
          .get('/api/products')
          .query({ search: 'oro' });

        expect(response.status).toBe(200);
        expect(response.body.products[0].name.toLowerCase()).toContain('oro');
      });
    });

    describe('GET /api/products/:id', () => {
      test('should return single product by ID', async () => {
        const mockProduct = {
          id: 'product-123',
          name: 'Anillo Especial',
          price: 399.99,
          category: 'Anillos',
          description: 'Un anillo muy especial',
          inStock: true,
          images: ['image1.jpg'],
          tags: ['oro', 'elegante']
        };

        mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

        const response = await request(app)
          .get('/api/products/product-123');

        expect(response.status).toBe(200);
        expect(response.body.id).toBe('product-123');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('price');
        expect(response.body).toHaveProperty('description');
      });

      test('should return 404 for non-existent product', async () => {
        mockPrisma.product.findUnique.mockResolvedValue(null);

        const response = await request(app)
          .get('/api/products/non-existent-id');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Producto no encontrado');
      });
    });
  });

  describe('🛒 Order Routes (Protected)', () => {
    const mockToken = 'valid-jwt-token';
    const mockUser = {
      id: 'user-123',
      email: 'customer@test.com',
      role: 'CUSTOMER'
    };

    beforeEach(() => {
      // Mock JWT verification
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue(mockUser);
    });

    describe('POST /api/orders', () => {
      test('should create new order with valid data', async () => {
        const orderData = {
          items: [
            {
              productId: 'product-123',
              quantity: 2,
              price: 199.99
            }
          ],
          shippingAddress: {
            street: 'Calle 123',
            city: 'Bogotá',
            zipCode: '110111',
            country: 'Colombia'
          },
          paymentMethod: 'Tarjeta de Crédito',
          total: 399.98
        };

        const mockCreatedOrder = {
          id: 'order-123',
          customerId: mockUser.id,
          status: 'PENDING',
          ...orderData,
          createdAt: new Date()
        };

        mockPrisma.order.create.mockResolvedValue(mockCreatedOrder);

        const response = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${mockToken}`)
          .send(orderData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.status).toBe('PENDING');
        expect(response.body.customerId).toBe(mockUser.id);
      });

      test('should reject order creation without authentication', async () => {
        const orderData = {
          items: [{ productId: 'product-123', quantity: 1, price: 100 }]
        };

        const response = await request(app)
          .post('/api/orders')
          .send(orderData);

        expect(response.status).toBe(401);
      });

      test('should validate order data', async () => {
        const invalidOrderData = {
          items: [], // Empty items array
          total: -100 // Negative total
        };

        const response = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${mockToken}`)
          .send(invalidOrderData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/orders/:id', () => {
      test('should return order details for authenticated user', async () => {
        const mockOrder = {
          id: 'order-123',
          customerId: mockUser.id,
          status: 'PENDING',
          total: 299.99,
          items: [
            {
              id: 'item-1',
              productId: 'product-123',
              quantity: 1,
              price: 299.99
            }
          ]
        };

        mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

        const response = await request(app)
          .get('/api/orders/order-123')
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe('order-123');
        expect(response.body).toHaveProperty('items');
      });

      test('should prevent access to other users orders', async () => {
        const otherUserOrder = {
          id: 'order-456',
          customerId: 'other-user-id',
          status: 'PENDING'
        };

        mockPrisma.order.findUnique.mockResolvedValue(otherUserOrder);

        const response = await request(app)
          .get('/api/orders/order-456')
          .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('👑 Admin Routes (Protected)', () => {
    const mockAdminToken = 'valid-admin-jwt-token';
    const mockAdmin = {
      id: 'admin-123',
      email: 'admin@test.com',
      role: 'ADMIN'
    };

    beforeEach(() => {
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue(mockAdmin);
    });

    describe('POST /api/admin/products', () => {
      test('should create product with admin privileges', async () => {
        const productData = {
          name: 'New Premium Ring',
          price: 599.99,
          category: 'Anillos',
          description: 'A premium gold ring',
          inStock: true
        };

        const mockCreatedProduct = {
          id: 'product-new',
          ...productData,
          createdAt: new Date()
        };

        mockPrisma.product.create.mockResolvedValue(mockCreatedProduct);

        const response = await request(app)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${mockAdminToken}`)
          .send(productData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(productData.name);
      });

      test('should reject product creation for non-admin users', async () => {
        const customerToken = 'customer-token';
        const mockCustomer = {
          id: 'customer-123',
          email: 'customer@test.com',
          role: 'CUSTOMER'
        };

        const jwt = require('jsonwebtoken');
        jest.spyOn(jwt, 'verify').mockReturnValue(mockCustomer);

        const productData = {
          name: 'Unauthorized Product',
          price: 100,
          category: 'Anillos'
        };

        const response = await request(app)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${customerToken}`)
          .send(productData);

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/admin/stats/overview', () => {
      test('should return admin statistics', async () => {
        const mockStats = {
          totalProducts: 150,
          totalOrders: 1200,
          totalCustomers: 500,
          totalRevenue: 125000.50,
          pendingOrders: 25
        };

        // Mock multiple Prisma calls for stats
        mockPrisma.product.findMany.mockResolvedValue(new Array(150));
        mockPrisma.order.findMany.mockResolvedValue(new Array(1200));
        mockPrisma.user.findMany.mockResolvedValue(new Array(500));

        const response = await request(app)
          .get('/api/admin/stats/overview')
          .set('Authorization', `Bearer ${mockAdminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('totalProducts');
        expect(response.body).toHaveProperty('totalOrders');
        expect(response.body).toHaveProperty('totalCustomers');
      });
    });
  });

  describe('🔍 Error Handling', () => {
    test('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route');

      expect(response.status).toBe(404);
    });

    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .type('application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });

    test('should handle database connection errors', async () => {
      mockPrisma.product.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    test('should sanitize error messages in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockPrisma.product.findMany.mockRejectedValue(new Error('Detailed database error'));

      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error interno del servidor');
      expect(response.body.error).not.toContain('Detailed database error');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('🔒 Security Tests', () => {
    test('should reject requests with invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    test('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ search: "'; DROP TABLE products; --" });

      // Should not crash and should sanitize the input
      expect(response.status).not.toBe(500);
    });

    test('should prevent XSS attacks in input', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com<script>alert("xss")</script>',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousData);

      // Should either reject the input or sanitize it
      if (response.status === 201) {
        expect(response.body.user.name).not.toContain('<script>');
        expect(response.body.user.email).not.toContain('<script>');
      } else {
        expect(response.status).toBe(400);
      }
    });

    test('should set appropriate security headers', async () => {
      const response = await request(app)
        .get('/api/products');

      // Check for common security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('📊 Performance Tests', () => {
    test('should respond to health check quickly', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/health');

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(100); // Should respond within 100ms
    });

    test('should handle concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, () =>
        request(app).get('/api/products')
      );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});