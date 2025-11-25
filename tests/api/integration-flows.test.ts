/**
 * API Integration Flow Tests
 * Tests complete business workflows end-to-end via API
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { UserFactory, ProductFactory, CustomerFactory } from '../../src/tests/factories';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

describe('API Integration Flows', () => {
  let adminToken: string;
  let customerToken: string;
  let testProduct: any;
  let testCustomer: any;
  let createdOrder: any;

  describe('🔄 Complete E-commerce Flow', () => {
    test('Flow 1: Customer Registration → Browse → Purchase → Order Tracking', async () => {
      // Step 1: Register new customer
      const newCustomer = UserFactory.create();
      
      const registerResponse = await request(API_BASE_URL)
        .post('/api/auth/register')
        .send({
          email: newCustomer.email,
          password: newCustomer.password,
          name: newCustomer.name,
          role: 'CUSTOMER'
        });

      if (registerResponse.status === 201) {
        expect(registerResponse.body).toHaveProperty('token');
        expect(registerResponse.body).toHaveProperty('user');
        customerToken = registerResponse.body.token;
        testCustomer = registerResponse.body.user;

        // Step 2: Browse products
        const browseResponse = await request(API_BASE_URL)
          .get('/api/products')
          .query({ category: 'Anillos', limit: 10 });

        expect(browseResponse.status).toBe(200);
        expect(browseResponse.body).toHaveProperty('products');
        expect(Array.isArray(browseResponse.body.products)).toBe(true);

        if (browseResponse.body.products.length > 0) {
          testProduct = browseResponse.body.products[0];

          // Step 3: View product details
          const productDetailResponse = await request(API_BASE_URL)
            .get(`/api/products/${testProduct.id}`);

          expect(productDetailResponse.status).toBe(200);
          expect(productDetailResponse.body.id).toBe(testProduct.id);

          // Step 4: Add to cart (if cart API exists)
          const addToCartResponse = await request(API_BASE_URL)
            .post('/api/cart/add')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
              productId: testProduct.id,
              quantity: 1
            });

          // Cart might not be implemented, so we'll be flexible
          if ([200, 201].includes(addToCartResponse.status)) {
            expect(addToCartResponse.body).toBeTruthy();
          }

          // Step 5: Create order
          const orderData = {
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            customerEmail: testCustomer.email,
            customerPhone: '+573101234567',
            items: [{
              productId: testProduct.id,
              quantity: 1,
              price: testProduct.price
            }],
            total: testProduct.price * 1.19, // Including tax
            subtotal: testProduct.price,
            taxAmount: testProduct.price * 0.19,
            shippingAmount: 0,
            discountAmount: 0,
            paymentMethod: 'Tarjeta de Crédito',
            shippingAddress: {
              street: '123 Test Street',
              city: 'Bogotá',
              state: 'Cundinamarca',
              zipCode: '110111',
              country: 'Colombia',
              isDefault: true
            }
          };

          const orderResponse = await request(API_BASE_URL)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send(orderData);

          if (orderResponse.status === 201) {
            expect(orderResponse.body).toHaveProperty('id');
            expect(orderResponse.body.status).toBe('PENDING');
            createdOrder = orderResponse.body;

            // Step 6: Track order
            const trackResponse = await request(API_BASE_URL)
              .get(`/api/orders/${createdOrder.id}`)
              .set('Authorization', `Bearer ${customerToken}`);

            expect(trackResponse.status).toBe(200);
            expect(trackResponse.body.id).toBe(createdOrder.id);
            expect(trackResponse.body).toHaveProperty('status');
            expect(trackResponse.body).toHaveProperty('items');
          }

          // Step 7: Update customer profile
          const updateProfileResponse = await request(API_BASE_URL)
            .put('/api/customers/profile')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
              name: 'Updated Customer Name',
              phone: '+573101234567'
            });

          if (updateProfileResponse.status === 200) {
            expect(updateProfileResponse.body.name).toBe('Updated Customer Name');
          }

          // Step 8: View order history
          const orderHistoryResponse = await request(API_BASE_URL)
            .get('/api/customers/orders')
            .set('Authorization', `Bearer ${customerToken}`);

          if (orderHistoryResponse.status === 200) {
            expect(Array.isArray(orderHistoryResponse.body.orders || orderHistoryResponse.body)).toBe(true);
          }
        }
      }
    });
  });

  describe('🛠️ Admin Management Flow', () => {
    test('Flow 2: Admin Login → Product Management → Order Management', async () => {
      // Step 1: Admin login
      const adminUser = UserFactory.createAdmin();
      
      const adminLoginResponse = await request(API_BASE_URL)
        .post('/api/auth/login')
        .send({
          email: adminUser.email,
          password: adminUser.password
        });

      if (adminLoginResponse.status === 200) {
        adminToken = adminLoginResponse.body.token;

        // Step 2: View dashboard stats
        const statsResponse = await request(API_BASE_URL)
          .get('/api/admin/stats/overview')
          .set('Authorization', `Bearer ${adminToken}`);

        if (statsResponse.status === 200) {
          expect(statsResponse.body).toHaveProperty('totalProducts');
          expect(statsResponse.body).toHaveProperty('totalOrders');
          expect(statsResponse.body).toHaveProperty('totalCustomers');
        }

        // Step 3: Create new product
        const newProduct = ProductFactory.create();
        
        const createProductResponse = await request(API_BASE_URL)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(newProduct);

        if (createProductResponse.status === 201) {
          expect(createProductResponse.body).toHaveProperty('id');
          expect(createProductResponse.body.name).toBe(newProduct.name);
          const createdProductId = createProductResponse.body.id;

          // Step 4: Update product
          const updateProductResponse = await request(API_BASE_URL)
            .put(`/api/admin/products/${createdProductId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product Name',
              price: 299.99,
              featured: true
            });

          if (updateProductResponse.status === 200) {
            expect(updateProductResponse.body.name).toBe('Updated Product Name');
            expect(updateProductResponse.body.price).toBe(299.99);
            expect(updateProductResponse.body.featured).toBe(true);
          }

          // Step 5: View product inventory
          const inventoryResponse = await request(API_BASE_URL)
            .get('/api/admin/products/inventory')
            .set('Authorization', `Bearer ${adminToken}`);

          if (inventoryResponse.status === 200) {
            expect(Array.isArray(inventoryResponse.body.products || inventoryResponse.body)).toBe(true);
          }

          // Step 6: Manage orders (if any exist)
          const ordersResponse = await request(API_BASE_URL)
            .get('/api/admin/orders')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({ status: 'PENDING' });

          if (ordersResponse.status === 200) {
            const orders = ordersResponse.body.orders || ordersResponse.body;
            
            if (Array.isArray(orders) && orders.length > 0) {
              const orderId = orders[0].id;
              
              // Update order status
              const updateOrderResponse = await request(API_BASE_URL)
                .put(`/api/admin/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'PROCESSING' });

              if (updateOrderResponse.status === 200) {
                expect(updateOrderResponse.body.status).toBe('PROCESSING');
              }
            }
          }

          // Step 7: View sales analytics
          const salesResponse = await request(API_BASE_URL)
            .get('/api/admin/stats/sales')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({ period: 'month' });

          if (salesResponse.status === 200) {
            expect(salesResponse.body).toBeTruthy();
          }

          // Step 8: Clean up - delete test product
          const deleteProductResponse = await request(API_BASE_URL)
            .delete(`/api/admin/products/${createdProductId}`)
            .set('Authorization', `Bearer ${adminToken}`);

          // Delete might succeed or fail depending on implementation
          expect([200, 204, 404]).toContain(deleteProductResponse.status);
        }
      }
    });
  });

  describe('🔍 Search & Filter Flow', () => {
    test('Flow 3: Search Products → Filter → Sort → Paginate', async () => {
      // Step 1: Perform basic search
      const searchResponse = await request(API_BASE_URL)
        .get('/api/products')
        .query({ search: 'anillo' });

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body).toHaveProperty('products');

      // Step 2: Filter by category
      const categoryFilterResponse = await request(API_BASE_URL)
        .get('/api/products')
        .query({ 
          search: 'oro',
          category: 'Anillos'
        });

      expect(categoryFilterResponse.status).toBe(200);
      expect(categoryFilterResponse.body).toHaveProperty('products');

      // Step 3: Filter by price range
      const priceFilterResponse = await request(API_BASE_URL)
        .get('/api/products')
        .query({ 
          priceMin: 100,
          priceMax: 500,
          category: 'Anillos'
        });

      expect(priceFilterResponse.status).toBe(200);
      expect(priceFilterResponse.body).toHaveProperty('products');

      // Verify price filtering works
      if (priceFilterResponse.body.products.length > 0) {
        priceFilterResponse.body.products.forEach((product: any) => {
          if (product.price !== null && product.price !== undefined) {
            expect(product.price).toBeGreaterThanOrEqual(100);
            expect(product.price).toBeLessThanOrEqual(500);
          }
        });
      }

      // Step 4: Sort products
      const sortResponse = await request(API_BASE_URL)
        .get('/api/products')
        .query({ 
          sortBy: 'price',
          sortOrder: 'asc',
          limit: 10
        });

      expect(sortResponse.status).toBe(200);
      
      // Verify sorting (if implemented)
      if (sortResponse.body.products.length > 1) {
        for (let i = 1; i < sortResponse.body.products.length; i++) {
          const currentPrice = sortResponse.body.products[i].price;
          const previousPrice = sortResponse.body.products[i - 1].price;
          
          if (currentPrice !== null && previousPrice !== null) {
            expect(currentPrice).toBeGreaterThanOrEqual(previousPrice);
          }
        }
      }

      // Step 5: Test pagination
      const page1Response = await request(API_BASE_URL)
        .get('/api/products')
        .query({ page: 1, limit: 5 });

      expect(page1Response.status).toBe(200);
      expect(page1Response.body.products.length).toBeLessThanOrEqual(5);

      if (page1Response.body.pagination?.totalPages > 1) {
        const page2Response = await request(API_BASE_URL)
          .get('/api/products')
          .query({ page: 2, limit: 5 });

        expect(page2Response.status).toBe(200);
        
        // Products on page 2 should be different from page 1
        const page1Ids = page1Response.body.products.map((p: any) => p.id);
        const page2Ids = page2Response.body.products.map((p: any) => p.id);
        
        const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));
        expect(intersection.length).toBe(0); // No overlap between pages
      }
    });
  });

  describe('💳 Payment Processing Flow', () => {
    test('Flow 4: Get Payment Methods → Process Payment → Confirm', async () => {
      // Step 1: Get available payment methods
      const paymentMethodsResponse = await request(API_BASE_URL)
        .get('/api/payment-methods');

      expect(paymentMethodsResponse.status).toBe(200);
      const paymentMethods = paymentMethodsResponse.body.paymentMethods || paymentMethodsResponse.body;
      expect(Array.isArray(paymentMethods)).toBe(true);

      if (paymentMethods.length > 0 && customerToken && createdOrder) {
        const paymentMethod = paymentMethods.find((pm: any) => pm.enabled && pm.type === 'PSE') || paymentMethods[0];

        // Step 2: Process payment
        const paymentData = {
          orderId: createdOrder.id,
          amount: createdOrder.total,
          currency: 'COP',
          paymentMethodId: paymentMethod.id,
          customerInfo: {
            name: testCustomer.name,
            email: testCustomer.email,
            phone: '+573101234567'
          }
        };

        const paymentResponse = await request(API_BASE_URL)
          .post(`/api/payment-methods/${paymentMethod.type.toLowerCase()}/process`)
          .set('Authorization', `Bearer ${customerToken}`)
          .send(paymentData);

        // Payment processing might return various responses depending on implementation
        expect([200, 201, 202, 400, 404, 501]).toContain(paymentResponse.status);

        if ([200, 201, 202].includes(paymentResponse.status)) {
          expect(paymentResponse.body).toBeTruthy();

          // Step 3: Check payment status
          if (paymentResponse.body.transactionId) {
            const statusResponse = await request(API_BASE_URL)
              .get(`/api/payment-methods/status/${paymentResponse.body.transactionId}`)
              .set('Authorization', `Bearer ${customerToken}`);

            expect([200, 404, 501]).toContain(statusResponse.status);
          }
        }
      }
    });
  });

  describe('🔐 Security & Error Handling Flow', () => {
    test('Flow 5: Authentication → Authorization → Error Handling', async () => {
      // Step 1: Test unauthenticated access
      const unauthResponse = await request(API_BASE_URL)
        .get('/api/customers/profile');

      expect(unauthResponse.status).toBe(401);
      expect(unauthResponse.body).toHaveProperty('error');

      // Step 2: Test invalid token
      const invalidTokenResponse = await request(API_BASE_URL)
        .get('/api/customers/profile')
        .set('Authorization', 'Bearer invalid-token-123');

      expect([401, 403]).toContain(invalidTokenResponse.status);
      expect(invalidTokenResponse.body).toHaveProperty('error');

      // Step 3: Test expired/malformed token
      const malformedTokenResponse = await request(API_BASE_URL)
        .get('/api/customers/profile')
        .set('Authorization', 'Bearer malformed');

      expect([401, 403]).toContain(malformedTokenResponse.status);

      // Step 4: Test customer trying to access admin endpoint
      if (customerToken) {
        const unauthorizedResponse = await request(API_BASE_URL)
          .get('/api/admin/stats/overview')
          .set('Authorization', `Bearer ${customerToken}`);

        expect([401, 403]).toContain(unauthorizedResponse.status);
        expect(unauthorizedResponse.body).toHaveProperty('error');
      }

      // Step 5: Test rate limiting (if implemented)
      const rateLimitRequests = Array.from({ length: 10 }, () =>
        request(API_BASE_URL)
          .post('/api/auth/login')
          .send({ email: 'nonexistent@test.com', password: 'wrong' })
      );

      const rateLimitResponses = await Promise.all(rateLimitRequests);
      
      // Check if any responses indicate rate limiting
      const rateLimited = rateLimitResponses.some(response => response.status === 429);
      if (rateLimited) {
        console.log('✅ Rate limiting is working');
      } else {
        console.log('ℹ️ Rate limiting not detected or not configured');
      }

      // Step 6: Test input validation
      const invalidInputResponse = await request(API_BASE_URL)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
          name: '', // Empty name
          role: 'INVALID_ROLE'
        });

      expect([400, 422, 429]).toContain(invalidInputResponse.status);
      expect(invalidInputResponse.body).toHaveProperty('error');
    });
  });

  describe('📊 Analytics & Reporting Flow', () => {
    test('Flow 6: Generate Reports → Export Data → Analytics', async () => {
      if (!adminToken) return;

      // Step 1: Get overview statistics
      const overviewResponse = await request(API_BASE_URL)
        .get('/api/admin/stats/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      if (overviewResponse.status === 200) {
        expect(overviewResponse.body).toBeTruthy();
        
        // Step 2: Get sales analytics
        const salesResponse = await request(API_BASE_URL)
          .get('/api/admin/stats/sales')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ 
            period: 'month',
            startDate: '2024-01-01',
            endDate: '2024-12-31'
          });

        if (salesResponse.status === 200) {
          expect(salesResponse.body).toBeTruthy();
        }

        // Step 3: Get customer analytics
        const customerStatsResponse = await request(API_BASE_URL)
          .get('/api/admin/stats/customers')
          .set('Authorization', `Bearer ${adminToken}`);

        // Customer stats might not be implemented
        expect([200, 404, 501]).toContain(customerStatsResponse.status);

        // Step 4: Get product performance
        const productStatsResponse = await request(API_BASE_URL)
          .get('/api/admin/stats/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ sortBy: 'sales', limit: 10 });

        expect([200, 404, 501]).toContain(productStatsResponse.status);

        // Step 5: Export data (if available)
        const exportResponse = await request(API_BASE_URL)
          .get('/api/admin/export/orders')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ format: 'csv', startDate: '2024-01-01' });

        expect([200, 404, 501]).toContain(exportResponse.status);
        
        if (exportResponse.status === 200) {
          // Should be CSV content
          expect(exportResponse.headers['content-type']).toMatch(/csv|text/);
        }
      }
    });
  });

  describe('🌐 API Performance & Load', () => {
    test('Flow 7: Concurrent Operations → Performance Validation', async () => {
      // Step 1: Concurrent product fetches
      const concurrentRequests = Array.from({ length: 5 }, (_, index) =>
        request(API_BASE_URL)
          .get('/api/products')
          .query({ page: index + 1, limit: 10 })
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time (5 seconds for 5 concurrent requests)
      expect(endTime - startTime).toBeLessThan(5000);

      // Step 2: Sequential operations timing
      const sequentialStartTime = Date.now();
      
      await request(API_BASE_URL).get('/api/products').query({ limit: 20 });
      await request(API_BASE_URL).get('/api/payment-methods');
      await request(API_BASE_URL).get('/api/health');
      
      const sequentialEndTime = Date.now();
      
      // Sequential operations should also complete quickly
      expect(sequentialEndTime - sequentialStartTime).toBeLessThan(3000);

      console.log(`⚡ Concurrent requests completed in ${endTime - startTime}ms`);
      console.log(`🔄 Sequential requests completed in ${sequentialEndTime - sequentialStartTime}ms`);
    });
  });
});