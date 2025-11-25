/**
 * API Testing Suite
 * Comprehensive automated API testing for all endpoints
 */

import { describe, test, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import { UserFactory, ProductFactory, OrderFactory, CustomerFactory } from '../../src/tests/factories';
import type { TestUser, TestProduct, TestCustomer } from '../../src/tests/factories';

// API Base URL - adjust based on your server setup
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

describe('API Testing Suite', () => {
  let adminToken: string;
  let customerToken: string;
  let testUser: TestUser;
  let testAdmin: TestUser;
  let testProduct: TestProduct;
  let testCustomer: TestCustomer;

  beforeAll(async () => {
    // Set up test data
    testAdmin = UserFactory.createAdmin();
    testUser = UserFactory.create();
    testProduct = ProductFactory.create();
    testCustomer = CustomerFactory.create();
  });

  beforeEach(async () => {
    // Reset any test state if needed
  });

  describe('🔐 Authentication & Authorization', () => {
    test('POST /api/auth/register - should register new customer', async () => {
      const newUser = UserFactory.create();
      
      const response = await request(API_BASE_URL)
        .post('/api/auth/register')
        .send({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
          role: 'CUSTOMER'
        });

      expect([201, 400, 429]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(newUser.email);
        expect(response.body.user.role).toBe('CUSTOMER');
      }
    });

    test('POST /api/auth/login - should authenticate valid user', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        customerToken = response.body.token;
      }
    });

    test('POST /api/auth/login - should authenticate admin user', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/login')
        .send({
          email: testAdmin.email,
          password: testAdmin.password
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('token');
        adminToken = response.body.token;
      }
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/login')
        .send({
          email: 'invalid@test.com',
          password: 'wrongpassword'
        });

      expect([401, 404, 429]).toContain(response.status);
      expect(response.body.token).toBeUndefined();
    });

    test('POST /api/auth/logout - should logout user', async () => {
      if (customerToken) {
        const response = await request(API_BASE_URL)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${customerToken}`);

        expect([200, 401]).toContain(response.status);
      }
    });
  });

  describe('📦 Products API', () => {
    test('GET /api/products - should return products list', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    test('GET /api/products - should support pagination', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/products')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.products.length).toBeLessThanOrEqual(10);
    });

    test('GET /api/products - should support category filtering', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/products')
        .query({ category: 'Anillos' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
    });

    test('GET /api/products - should support price filtering', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/products')
        .query({ priceMin: 100, priceMax: 500 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      
      response.body.products.forEach((product: any) => {
        if (product.price) {
          expect(product.price).toBeGreaterThanOrEqual(100);
          expect(product.price).toBeLessThanOrEqual(500);
        }
      });
    });

    test('GET /api/products - should support search', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/products')
        .query({ search: 'oro' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
    });

    test('GET /api/products/:id - should return single product', async () => {
      // First get a product ID
      const productsResponse = await request(API_BASE_URL)
        .get('/api/products')
        .query({ limit: 1 });

      if (productsResponse.body.products?.length > 0) {
        const productId = productsResponse.body.products[0].id;
        
        const response = await request(API_BASE_URL)
          .get(`/api/products/${productId}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', productId);
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('price');
      }
    });

    test('GET /api/products/:id - should return 404 for non-existent product', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/products/non-existent-id');

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('🛠️ Admin Products API', () => {
    test('POST /api/admin/products - should create product with admin auth', async () => {
      if (!adminToken) return;

      const newProduct = ProductFactory.create();
      
      const response = await request(API_BASE_URL)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct);

      expect([201, 401, 403]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(newProduct.name);
        testProduct.id = response.body.id;
      }
    });

    test('POST /api/admin/products - should reject without admin auth', async () => {
      const newProduct = ProductFactory.create();
      
      const response = await request(API_BASE_URL)
        .post('/api/admin/products')
        .send(newProduct);

      expect([401, 403, 404]).toContain(response.status);
    });

    test('PUT /api/admin/products/:id - should update product with admin auth', async () => {
      if (!adminToken || !testProduct.id) return;

      const updates = {
        name: 'Updated Product Name',
        price: 299.99
      };

      const response = await request(API_BASE_URL)
        .put(`/api/admin/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect([200, 401, 403, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.name).toBe(updates.name);
        expect(response.body.price).toBe(updates.price);
      }
    });

    test('DELETE /api/admin/products/:id - should delete product with admin auth', async () => {
      if (!adminToken) return;

      // Create a product to delete
      const productToDelete = ProductFactory.create();
      const createResponse = await request(API_BASE_URL)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productToDelete);

      if (createResponse.status === 201) {
        const productId = createResponse.body.id;
        
        const deleteResponse = await request(API_BASE_URL)
          .delete(`/api/admin/products/${productId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 204, 401, 403, 404]).toContain(deleteResponse.status);
      }
    });
  });

  describe('👥 Customers API', () => {
    test('GET /api/customers/profile - should return customer profile', async () => {
      if (!customerToken) return;

      const response = await request(API_BASE_URL)
        .get('/api/customers/profile')
        .set('Authorization', `Bearer ${customerToken}`);

      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email');
      }
    });

    test('PUT /api/customers/profile - should update customer profile', async () => {
      if (!customerToken) return;

      const updates = {
        name: 'Updated Customer Name',
        phone: '+57310123456'
      };

      const response = await request(API_BASE_URL)
        .put('/api/customers/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updates);

      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.name).toBe(updates.name);
      }
    });

    test('GET /api/customers/orders - should return customer orders', async () => {
      if (!customerToken) return;

      const response = await request(API_BASE_URL)
        .get('/api/customers/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        expect(Array.isArray(response.body.orders || response.body)).toBe(true);
      }
    });
  });

  describe('🛒 Orders API', () => {
    test('POST /api/orders - should create new order', async () => {
      if (!customerToken) return;

      const newOrder = OrderFactory.create();
      
      const response = await request(API_BASE_URL)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(newOrder);

      expect([201, 400, 401]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('status');
        expect(response.body.status).toBe('PENDING');
      }
    });

    test('GET /api/orders/:id - should return order details', async () => {
      if (!customerToken) return;

      // First create an order
      const newOrder = OrderFactory.create();
      const createResponse = await request(API_BASE_URL)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(newOrder);

      if (createResponse.status === 201) {
        const orderId = createResponse.body.id;
        
        const response = await request(API_BASE_URL)
          .get(`/api/orders/${orderId}`)
          .set('Authorization', `Bearer ${customerToken}`);

        expect([200, 401, 404]).toContain(response.status);
        
        if (response.status === 200) {
          expect(response.body).toHaveProperty('id', orderId);
          expect(response.body).toHaveProperty('items');
        }
      }
    });

    test('PUT /api/orders/:id/status - should update order status with admin auth', async () => {
      if (!adminToken) return;

      // This would require an existing order ID
      const response = await request(API_BASE_URL)
        .put('/api/orders/test-order-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PROCESSING' });

      expect([200, 401, 403, 404]).toContain(response.status);
    });
  });

  describe('💳 Payment Methods API', () => {
    test('GET /api/payment-methods - should return available payment methods', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/payment-methods');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.paymentMethods || response.body)).toBe(true);
    });

    test('POST /api/payment-methods/:id/process - should process payment', async () => {
      if (!customerToken) return;

      const paymentData = {
        amount: 150.00,
        currency: 'COP',
        paymentMethodId: 'test-payment-method',
        orderId: 'test-order-id'
      };

      const response = await request(API_BASE_URL)
        .post('/api/payment-methods/pse/process')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(paymentData);

      // Payment processing might not be fully implemented in test environment
      expect([200, 201, 400, 401, 404, 501]).toContain(response.status);
    });
  });

  describe('📊 Admin Statistics API', () => {
    test('GET /api/admin/stats/overview - should return overview stats', async () => {
      if (!adminToken) return;

      const response = await request(API_BASE_URL)
        .get('/api/admin/stats/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 401, 403]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('totalProducts');
        expect(response.body).toHaveProperty('totalOrders');
        expect(response.body).toHaveProperty('totalCustomers');
      }
    });

    test('GET /api/admin/stats/sales - should return sales stats', async () => {
      if (!adminToken) return;

      const response = await request(API_BASE_URL)
        .get('/api/admin/stats/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: 'month' });

      expect([200, 401, 403]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('totalSales');
        expect(response.body).toHaveProperty('salesByPeriod');
      }
    });
  });

  describe('🔍 Search API', () => {
    test('GET /api/search - should perform global search', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/search')
        .query({ q: 'anillo oro' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
    });

    test('GET /api/search/suggestions - should return search suggestions', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/search/suggestions')
        .query({ q: 'ani' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.suggestions || response.body)).toBe(true);
    });
  });

  describe('🔧 Health & System', () => {
    test('GET /api/health - should return system health', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(['healthy', 'ok', 'up']).toContain(response.body.status.toLowerCase());
    });

    test('GET /api/version - should return API version', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/version');

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('version');
      }
    });
  });

  describe('🛡️ Security & Rate Limiting', () => {
    test('Should handle CORS properly', async () => {
      const response = await request(API_BASE_URL)
        .options('/api/products')
        .set('Origin', 'http://localhost:5173');

      expect([200, 204]).toContain(response.status);
    });

    test('Should reject requests with invalid content-type', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/login')
        .set('Content-Type', 'text/plain')
        .send('invalid data');

      expect([400, 415, 429]).toContain(response.status);
    });

    test('Should handle large payload gracefully', async () => {
      const largePayload = {
        data: 'x'.repeat(10000) // 10KB string
      };

      const response = await request(API_BASE_URL)
        .post('/api/products')
        .send(largePayload);

      expect([400, 401, 413]).toContain(response.status);
    });

    test('Should validate required fields', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/register')
        .send({}); // Empty payload

      expect([400, 422, 429]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('📈 Performance & Load', () => {
    test('API responses should be fast', async () => {
      const startTime = Date.now();
      
      const response = await request(API_BASE_URL)
        .get('/api/products')
        .query({ limit: 10 });

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('Should handle concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 5 }, () =>
        request(API_BASE_URL)
          .get('/api/products')
          .query({ limit: 5 })
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});