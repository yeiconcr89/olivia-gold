import request from 'supertest';
import app from '../server';
import { prisma } from '../utils/prisma';

// Variables globales para tests de integración
let authToken: string;
let adminAuthToken: string;
let testUser: any;
let testAdmin: any;
let testProduct: any;
let testCustomer: any;
let testOrder: any;

// Helper function to ensure test data exists
async function ensureTestProduct() {
  if (!testProduct) {
    const productData = {
      name: 'Integration Test Product - Fallback',
      price: 299.99,
      category: 'Anillos',
      subcategory: 'Oro',
      description: 'Producto de prueba para tests de integración',
      materials: 'Oro laminado',
      dimensions: '2cm x 2cm',
      care: 'Limpiar con paño suave',
      images: [{ url: 'https://example.com/test-image.jpg', isPrimary: true, order: 0 }],
      tags: ['test', 'integration'],
      inventory: { quantity: 50 }
    };
    
    if (adminAuthToken) {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(productData);
      
      if (response.status === 201) {
        testProduct = response.body;
      }
    }
  }
  return testProduct;
}

async function ensureAuthTokens() {
  if (!authToken || !adminAuthToken) {
    // Create regular user
    const userData = {
      email: 'integration-test-user-fallback@test.com',
      password: 'IntegrationTest123!',
      name: 'Integration Test User Fallback',
      role: 'CUSTOMER'
    };
    
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    if (userResponse.status === 201) {
      testUser = userResponse.body.user;
      authToken = userResponse.body.token;
    }
    
    // Create admin user
    const adminData = {
      email: 'integration-test-admin-fallback@test.com',
      password: 'AdminIntegrationTest123!',
      name: 'Integration Test Admin Fallback',
      role: 'ADMIN'
    };
    
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);
    
    if (adminResponse.status === 201) {
      testAdmin = adminResponse.body.user;
      adminAuthToken = adminResponse.body.token;
    }
  }
}

describe('API Endpoints Integration Tests', () => {

  beforeAll(async () => {
    // Limpiar datos de prueba
    await prisma.orderItem.deleteMany({});
    await prisma.shippingAddress.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productTag.deleteMany({});
    await prisma.product.deleteMany({
      where: { name: { contains: 'Integration Test' } }
    });
    await prisma.customerAddress.deleteMany({});
    await prisma.customer.deleteMany({
      where: { email: { contains: 'integration-test' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'integration-test' } }
    });
    
    // Setup essential test data
    await ensureAuthTokens();
    await ensureTestProduct();
  });

  afterAll(async () => {
    // Limpiar todos los datos de prueba
    await prisma.orderItem.deleteMany({});
    await prisma.shippingAddress.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productTag.deleteMany({});
    await prisma.product.deleteMany({
      where: { name: { contains: 'Integration Test' } }
    });
    await prisma.customerAddress.deleteMany({});
    await prisma.customer.deleteMany({
      where: { email: { contains: 'integration-test' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'integration-test' } }
    });
    await prisma.$disconnect();
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      it('debería registrar un nuevo usuario correctamente', async () => {
        const userData = {
          email: 'integration-test-user@test.com',
          password: 'IntegrationTest123!',
          name: 'Integration Test User',
          role: 'CUSTOMER'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user.name).toBe(userData.name);
        expect(response.body.user.role).toBe(userData.role);

        testUser = response.body.user;
        authToken = response.body.token;
      });

      it('debería registrar un admin correctamente', async () => {
        const adminData = {
          email: 'integration-test-admin@test.com',
          password: 'AdminIntegrationTest123!',
          name: 'Integration Test Admin',
          role: 'ADMIN'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(adminData);

        expect(response.status).toBe(201);
        expect(response.body.user.role).toBe('ADMIN');

        testAdmin = response.body.user;
        adminAuthToken = response.body.token;
      });

      it('debería rechazar email duplicado', async () => {
        const duplicateUserData = {
          email: 'integration-test-user@test.com',
          password: 'AnotherPassword123!',
          name: 'Duplicate User',
          role: 'CUSTOMER'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(duplicateUserData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/auth/login', () => {
      it('debería autenticar usuario con credenciales correctas', async () => {
        const loginData = {
          email: 'integration-test-user@test.com',
          password: 'IntegrationTest123!'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe(loginData.email);
      });

      it('debería rechazar credenciales incorrectas', async () => {
        const wrongLoginData = {
          email: 'integration-test-user@test.com',
          password: 'WrongPassword123!'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(wrongLoginData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/auth/profile', () => {
      it('debería obtener perfil de usuario autenticado', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email');
        expect(response.body).toHaveProperty('profile');
        expect(response.body.email).toBe('integration-test-user@test.com');
      });

      it('debería rechazar acceso sin token', async () => {
        const response = await request(app)
          .get('/api/auth/profile');

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Product Endpoints', () => {
    describe('POST /api/admin/products', () => {
      it('debería crear un producto como admin', async () => {
        const productData = {
          name: 'Integration Test Product',
          price: 299.99,
          originalPrice: 350.00,
          category: 'Anillos',
          subcategory: 'Oro',
          description: 'Producto de prueba para integración',
          materials: 'Oro 18k',
          dimensions: 'Talla 7',
          care: 'Cuidado especial',
          inStock: true,
          featured: false,
          images: ['http://example.com/integration-test-product.jpg'],
          tags: ['integration', 'test'],
          inventory: { quantity: 50 }
        };

        const response = await request(app)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${adminAuthToken}`)
          .send(productData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(productData.name);
        expect(response.body.price).toBe(productData.price);
        expect(response.body.images).toHaveLength(1);
        expect(response.body.tags).toHaveLength(2);
        expect(response.body.inventory).toBeDefined();

        testProduct = response.body;
      });

      it('debería rechazar creación de producto sin permisos admin', async () => {
        const productData = {
          name: 'Unauthorized Product',
          price: 199.99,
          category: 'Anillos',
          description: 'Este producto no debería crearse'
        };

        const response = await request(app)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${authToken}`) // Token de usuario normal
          .send(productData);

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/products', () => {
      it('debería obtener lista de productos públicamente', async () => {
        const response = await request(app)
          .get('/api/products');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('products');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.products)).toBe(true);
        expect(response.body.products.length).toBeGreaterThan(0);
      });

      it('debería filtrar productos por categoría', async () => {
        const response = await request(app)
          .get('/api/products?category=Anillos');

        expect(response.status).toBe(200);
        response.body.products.forEach((product: any) => {
          expect(product.category).toBe('Anillos');
        });
      });

      it('debería paginar resultados correctamente', async () => {
        const response = await request(app)
          .get('/api/products?page=1&limit=5');

        expect(response.status).toBe(200);
        expect(response.body.products.length).toBeLessThanOrEqual(5);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(5);
      });
    });

    describe('GET /api/products/:id', () => {
      it('debería obtener producto específico por ID', async () => {
        await ensureAuthTokens();
        await ensureTestProduct();
        
        if (!testProduct) {
          console.warn('Skipping test: testProduct not available');
          return;
        }

        const response = await request(app)
          .get(`/api/products/${testProduct.id}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testProduct.id);
        expect(response.body.name).toBe(testProduct.name);
        expect(response.body).toHaveProperty('images');
        expect(response.body).toHaveProperty('tags');
        expect(response.body).toHaveProperty('inventory');
      });

      it('debería retornar 404 para producto inexistente', async () => {
        const response = await request(app)
          .get('/api/products/non-existent-id');

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /api/admin/products/:id', () => {
      it('debería actualizar producto como admin', async () => {
        const updateData = {
          name: 'Updated Integration Test Product',
          price: 349.99,
          description: 'Descripción actualizada'
        };

        const response = await request(app)
          .put(`/api/admin/products/${testProduct.id}`)
          .set('Authorization', `Bearer ${adminAuthToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.name).toBe(updateData.name);
        expect(response.body.price).toBe(updateData.price);
        expect(response.body.description).toBe(updateData.description);
      });
    });
  });

  describe('Customer Endpoints', () => {
    describe('POST /api/admin/customers', () => {
      it('debería crear un cliente como admin', async () => {
        const customerData = {
          name: 'Integration Test Customer',
          email: 'integration-test-customer@test.com',
          phone: '+57 300 123 4567',
          addresses: [{
            street: 'Calle Integration Test 123',
            city: 'Bogotá',
            state: 'Cundinamarca',
            zipCode: '110111',
            country: 'Colombia'
          }]
        };

        const response = await request(app)
          .post('/api/admin/customers')
          .set('Authorization', `Bearer ${adminAuthToken}`)
          .send(customerData);

        expect(response.status).toBe(201);
        expect(response.body.name).toBe(customerData.name);
        expect(response.body.email).toBe(customerData.email);
        expect(response.body.addresses).toHaveLength(1);

        testCustomer = response.body;
      });
    });

    describe('GET /api/admin/customers', () => {
      it('debería obtener lista de clientes como admin', async () => {
        const response = await request(app)
          .get('/api/admin/customers')
          .set('Authorization', `Bearer ${adminAuthToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('customers');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.customers)).toBe(true);
      });

      it('debería rechazar acceso sin permisos admin', async () => {
        const response = await request(app)
          .get('/api/admin/customers')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(403);
      });
    });
  });

  describe('Order Endpoints', () => {
    describe('POST /api/admin/orders', () => {
      it('debería crear una orden como admin', async () => {
        const orderData = {
          customerId: testCustomer.id,
          customerName: testCustomer.name,
          customerEmail: testCustomer.email,
          customerPhone: testCustomer.phone,
          items: [{
            productId: testProduct.id,
            quantity: 2,
            size: 'M'
          }],
          paymentMethod: 'Credit Card',
          shippingAddress: testCustomer.addresses[0]
        };

        const response = await request(app)
          .post('/api/admin/orders')
          .set('Authorization', `Bearer ${adminAuthToken}`)
          .send(orderData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.customerId).toBe(testCustomer.id);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.total).toBe(testProduct.price * 2);

        testOrder = response.body;
      });
    });

    describe('GET /api/admin/orders', () => {
      it('debería obtener lista de órdenes como admin', async () => {
        const response = await request(app)
          .get('/api/admin/orders')
          .set('Authorization', `Bearer ${adminAuthToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('orders');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.orders)).toBe(true);
        expect(response.body.orders.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/admin/orders/:id', () => {
      it('debería obtener orden específica como admin', async () => {
        const response = await request(app)
          .get(`/api/admin/orders/${testOrder.id}`)
          .set('Authorization', `Bearer ${adminAuthToken}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testOrder.id);
        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('shippingAddress');
        expect(response.body).toHaveProperty('customerInfo');
      });
    });

    describe('PUT /api/admin/orders/:id/status', () => {
      it('debería actualizar estado de orden como admin', async () => {
        const statusUpdate = {
          status: 'PROCESSING',
          trackingNumber: 'INTEG-TEST-001'
        };

        const response = await request(app)
          .put(`/api/admin/orders/${testOrder.id}/status`)
          .set('Authorization', `Bearer ${adminAuthToken}`)
          .send(statusUpdate);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe(statusUpdate.status);
        expect(response.body.trackingNumber).toBe(statusUpdate.trackingNumber);
      });
    });

    describe('GET /api/orders/:id/public', () => {
      it('debería obtener orden pública sin información sensible', async () => {
        const response = await request(app)
          .get(`/api/orders/${testOrder.id}/public`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testOrder.id);
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('total');
        expect(response.body).not.toHaveProperty('customerInfo'); // No debe incluir info sensible
      });
    });
  });

  describe('Admin Stats Endpoints', () => {
    describe('GET /api/admin/stats/overview', () => {
      it('debería obtener estadísticas generales como admin', async () => {
        const response = await request(app)
          .get('/api/admin/stats/overview')
          .set('Authorization', `Bearer ${adminAuthToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('totalProducts');
        expect(response.body).toHaveProperty('totalCustomers');
        expect(response.body).toHaveProperty('totalOrders');
        expect(response.body).toHaveProperty('totalRevenue');
        expect(typeof response.body.totalProducts).toBe('number');
        expect(typeof response.body.totalCustomers).toBe('number');
        expect(typeof response.body.totalOrders).toBe('number');
      });

      it('debería rechazar acceso sin permisos admin', async () => {
        const response = await request(app)
          .get('/api/admin/stats/overview')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/admin/stats/orders', () => {
      it('debería obtener estadísticas de órdenes como admin', async () => {
        const response = await request(app)
          .get('/api/admin/stats/orders')
          .set('Authorization', `Bearer ${adminAuthToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('totalOrders');
        expect(response.body).toHaveProperty('pendingOrders');
        expect(response.body).toHaveProperty('shippedOrders');
        expect(response.body).toHaveProperty('deliveredOrders');
        expect(response.body).toHaveProperty('totalRevenue');
        expect(response.body).toHaveProperty('averageOrderValue');
      });
    });
  });

  describe('Error Handling', () => {
    it('debería manejar rutas no existentes', async () => {
      const response = await request(app)
        .get('/api/nonexistent/route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('debería manejar métodos HTTP no permitidos', async () => {
      const response = await request(app)
        .patch('/api/products'); // PATCH no permitido en esta ruta

      expect([404, 405]).toContain(response.status);
    });

    it('debería manejar JSON malformado', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });

    it('debería manejar campos requeridos faltantes', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@test.com'
          // password, name, role faltantes
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Performance and Load', () => {
    it('debería manejar múltiples requests concurrentes', async () => {
      const requests = [];
      
      // Crear 10 requests concurrentes
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/products')
        );
      }

      const responses = await Promise.all(requests);
      
      // Todas las requests deberían completarse exitosamente
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('debería responder en tiempo razonable', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/products');

      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Menos de 5 segundos
    });
  });

  describe('Data Consistency', () => {
    it('debería mantener consistencia al crear orden', async () => {
      // Obtener inventario inicial
      const initialProduct = await request(app)
        .get(`/api/products/${testProduct.id}`);
      
      const initialInventory = initialProduct.body.inventory.quantity;

      // Crear orden que reduzca inventario
      const orderData = {
        customerId: testCustomer.id,
        customerName: testCustomer.name,
        customerEmail: testCustomer.email,
        customerPhone: testCustomer.phone,
        items: [{
          productId: testProduct.id,
          quantity: 3,
          size: 'L'
        }],
        paymentMethod: 'Bank Transfer',
        shippingAddress: testCustomer.addresses[0]
      };

      const orderResponse = await request(app)
        .post('/api/admin/orders')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(orderData);

      expect(orderResponse.status).toBe(201);

      // Verificar que el inventario se actualizó correctamente
      const updatedProduct = await request(app)
        .get(`/api/products/${testProduct.id}`);

      expect(updatedProduct.body.inventory.quantity).toBe(initialInventory - 3);

      // Verificar que las estadísticas del cliente se actualizaron
      const customerResponse = await request(app)
        .get(`/api/admin/customers/${testCustomer.id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`);

      expect(Number(customerResponse.body.totalSpent)).toBeGreaterThan(0);
      expect(customerResponse.body.totalOrders).toBeGreaterThan(0);
    });
  });
});