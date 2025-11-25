import { prisma } from '../utils/prisma';
import * as orderService from './order.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// Datos de prueba avanzados
const advancedProductData = [
  {
    name: 'Anillo Oro Premium',
    price: 1500.00,
    category: 'Anillos',
    subcategory: 'Oro',
    description: 'Anillo de oro premium para pruebas avanzadas',
    materials: 'Oro 18k',
    dimensions: 'Talla 7',
    care: 'Cuidado especial',
    images: ['http://example.com/anillo-premium.jpg'],
    tags: ['premium', 'oro'],
    inventory: { quantity: 10 }
  },
  {
    name: 'Collar Plata Exclusivo',
    price: 800.00,
    category: 'Collares',
    subcategory: 'Plata',
    description: 'Collar de plata exclusivo para pruebas',
    materials: 'Plata 925',
    dimensions: '45cm',
    care: 'Evitar humedad',
    images: ['http://example.com/collar-exclusivo.jpg'],
    tags: ['exclusivo', 'plata'],
    inventory: { quantity: 5 }
  },
  {
    name: 'Aretes Diamante Lujo',
    price: 3200.00,
    category: 'Aretes',
    subcategory: 'Diamante',
    description: 'Aretes con diamantes para pruebas de lujo',
    materials: 'Oro blanco 18k + Diamantes',
    dimensions: '8mm',
    care: 'Limpieza profesional',
    images: ['http://example.com/aretes-diamante.jpg'],
    tags: ['lujo', 'diamante'],
    inventory: { quantity: 2 }
  }
];

const advancedCustomerData = [
  {
    name: 'Cliente Premium',
    email: 'premium@advanced-test.com',
    phone: '+57 300 111 1111',
    addresses: [{
      street: 'Calle Premium 123',
      city: 'Bogotá',
      state: 'Cundinamarca',
      zipCode: '110111',
      country: 'Colombia'
    }]
  },
  {
    name: 'Cliente VIP',
    email: 'vip@advanced-test.com',
    phone: '+57 300 222 2222',
    addresses: [{
      street: 'Avenida VIP 456',
      city: 'Medellín',
      state: 'Antioquia',
      zipCode: '050001',
      country: 'Colombia'
    }]
  }
];

const createdProducts: any[] = [];
const createdCustomers: any[] = [];
const createdOrders: any[] = [];

describe('Advanced Order Service - Pruebas Avanzadas', () => {

  beforeAll(async () => {
    // Limpiar datos de pruebas avanzadas
    await prisma.orderItem.deleteMany({});
    await prisma.shippingAddress.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productTag.deleteMany({});
    await prisma.product.deleteMany({
      where: { name: { in: advancedProductData.map(p => p.name) } }
    });
    await prisma.customerAddress.deleteMany({});
    await prisma.customer.deleteMany({
      where: { email: { in: advancedCustomerData.map(c => c.email) } }
    });

    // Crear productos de prueba
    for (const productData of advancedProductData) {
      const product = await prisma.product.create({
        data: {
          ...productData,
          inventory: undefined,
          images: {
            create: productData.images.map((url, index) => ({ 
              url, 
              isPrimary: index === 0, 
              order: index 
            }))
          },
          tags: {
            create: productData.tags.map((tag: string) => ({ tag }))
          },
          inventory: {
            create: productData.inventory
          }
        },
        include: { inventory: true, images: true, tags: true }
      });
      createdProducts.push(product);
    }

    // Crear clientes de prueba
    for (const customerData of advancedCustomerData) {
      const customer = await prisma.customer.create({
        data: {
          ...customerData,
          addresses: {
            create: customerData.addresses
          }
        },
        include: { addresses: true }
      });
      createdCustomers.push(customer);
    }
  });

  afterAll(async () => {
    // Limpiar todo
    await prisma.orderItem.deleteMany({});
    await prisma.shippingAddress.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productTag.deleteMany({});
    await prisma.product.deleteMany({
      where: { name: { in: advancedProductData.map(p => p.name) } }
    });
    await prisma.customerAddress.deleteMany({});
    await prisma.customer.deleteMany({
      where: { email: { in: advancedCustomerData.map(c => c.email) } }
    });
    await prisma.$disconnect();
  });

  describe('Multi-Item Orders', () => {
    it('debería crear orden con múltiples productos correctamente', async () => {
      const multiItemOrderInput = {
        customerId: createdCustomers[0].id,
        customerName: createdCustomers[0].name,
        customerEmail: createdCustomers[0].email,
        customerPhone: createdCustomers[0].phone,
        items: [
          { productId: createdProducts[0].id, quantity: 2, size: 'M', price: createdProducts[0].price }, // Anillo: 1500 * 2 = 3000
          { productId: createdProducts[1].id, quantity: 1, size: 'M', price: createdProducts[1].price }, // Collar: 800 * 1 = 800
          { productId: createdProducts[2].id, quantity: 1, size: 'S', price: createdProducts[2].price }  // Aretes: 3200 * 1 = 3200
        ],
        total: 7000, // Calculado: 3000 + 800 + 3200
        paymentMethod: 'Credit Card',
        shippingAddress: createdCustomers[0].addresses[0],
      };

      const order = await orderService.createOrder(multiItemOrderInput);
      createdOrders.push(order);

      expect(order).toBeDefined();
      expect(order.items).toHaveLength(3);
      expect(order.total).toBe(7000); // 3000 + 800 + 3200
      
      // Verificar inventarios actualizados
      const updatedProduct1 = await prisma.product.findUnique({
        where: { id: createdProducts[0].id },
        include: { inventory: true }
      });
      expect(updatedProduct1?.inventory?.quantity).toBe(8); // 10 - 2

      const updatedProduct2 = await prisma.product.findUnique({
        where: { id: createdProducts[1].id },
        include: { inventory: true }
      });
      expect(updatedProduct2?.inventory?.quantity).toBe(4); // 5 - 1

      const updatedProduct3 = await prisma.product.findUnique({
        where: { id: createdProducts[2].id },
        include: { inventory: true }
      });
      expect(updatedProduct3?.inventory?.quantity).toBe(1); // 2 - 1
    });

    it('debería fallar si algún producto no tiene stock suficiente', async () => {
      const insufficientStockOrder = {
        customerId: createdCustomers[1].id,
        customerName: createdCustomers[1].name,
        customerEmail: createdCustomers[1].email,
        customerPhone: createdCustomers[1].phone,
        items: [
          { productId: createdProducts[2].id, quantity: 5, size: 'M', price: createdProducts[2].price } // Solo hay 1 disponible
        ],
        total: createdProducts[2].price * 5,
        paymentMethod: 'Debit Card',
        shippingAddress: createdCustomers[1].addresses[0],
      };

      await expect(orderService.createOrder(insufficientStockOrder))
        .rejects.toThrow('Stock insuficiente para el producto: Aretes Diamante Lujo');
    });
  });

  describe('Order Status Workflows', () => {
    it('debería manejar flujo completo de estado de orden', async () => {
      // Crear orden para testing de estados
      const statusTestOrder = await orderService.createOrder({
        customerId: createdCustomers[1].id,
        customerName: createdCustomers[1].name,
        customerEmail: createdCustomers[1].email,
        customerPhone: createdCustomers[1].phone,
        items: [
          { productId: createdProducts[1].id, quantity: 1, size: 'M', price: createdProducts[1].price }
        ],
        total: createdProducts[1].price,
        paymentMethod: 'Bank Transfer',
        shippingAddress: createdCustomers[1].addresses[0],
      });
      createdOrders.push(statusTestOrder);

      // Estado inicial
      expect(statusTestOrder.status).toBe(OrderStatus.PENDING);
      expect(statusTestOrder.paymentStatus).toBe(PaymentStatus.PENDING);

      // Confirmar pago
      const paidOrder = await orderService.updateOrderStatus(statusTestOrder.id, {
        paymentStatus: PaymentStatus.PAID
      });
      expect(paidOrder.paymentStatus).toBe(PaymentStatus.PAID);

      // Procesar orden
      const processingOrder = await orderService.updateOrderStatus(statusTestOrder.id, {
        status: OrderStatus.PROCESSING
      });
      expect(processingOrder.status).toBe(OrderStatus.PROCESSING);

      // Enviar orden
      const shippedOrder = await orderService.updateOrderStatus(statusTestOrder.id, {
        status: OrderStatus.SHIPPED,
        trackingNumber: 'TRACK-ADV-001'
      });
      expect(shippedOrder.status).toBe(OrderStatus.SHIPPED);
      expect(shippedOrder.trackingNumber).toBe('TRACK-ADV-001');

      // Entregar orden
      const deliveredOrder = await orderService.updateOrderStatus(statusTestOrder.id, {
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date()
      });
      expect(deliveredOrder.status).toBe(OrderStatus.DELIVERED);
      expect(deliveredOrder.deliveredAt).toBeDefined();
    });

    it('debería prevenir transiciones de estado inválidas', async () => {
      // Crear orden para testing de validaciones
      const validationOrder = await orderService.createOrder({
        customerId: createdCustomers[0].id,
        customerName: createdCustomers[0].name,
        customerEmail: createdCustomers[0].email,
        customerPhone: createdCustomers[0].phone,
        items: [
          { productId: createdProducts[0].id, quantity: 1, size: 'M' }
        ],
        paymentMethod: 'Cash',
        shippingAddress: createdCustomers[0].addresses[0],
      });
      createdOrders.push(validationOrder);

      // Marcar como entregado directamente desde pending debería fallar
      await expect(orderService.updateOrderStatus(validationOrder.id, {
        status: OrderStatus.DELIVERED
      })).rejects.toThrow();
    });
  });

  describe('Customer Analytics', () => {
    it('debería actualizar correctamente las estadísticas del cliente', async () => {
      const customer = createdCustomers[0];
      
      // Verificar estadísticas después de múltiples órdenes
      const updatedCustomer = await prisma.customer.findUnique({
        where: { id: customer.id }
      });

      expect(updatedCustomer?.totalOrders).toBeGreaterThan(0);
      expect(Number(updatedCustomer?.totalSpent)).toBeGreaterThan(0);
      expect(updatedCustomer?.lastOrderDate).toBeDefined();
    });

    it('debería calcular el valor promedio de orden del cliente', async () => {
      const customer = createdCustomers[0];
      const customerData = await prisma.customer.findUnique({
        where: { id: customer.id },
        include: {
          orders: {
            select: { total: true }
          }
        }
      });

      if (customerData && customerData.orders.length > 0) {
        const totalSpent = customerData.orders.reduce((sum, order) => sum + Number(order.total), 0);
        const averageOrderValue = totalSpent / customerData.orders.length;
        
        expect(averageOrderValue).toBeGreaterThan(0);
        expect(averageOrderValue).toBe(Number(customerData.totalSpent) / customerData.totalOrders);
      }
    });
  });

  describe('Inventory Management', () => {
    it('debería manejar concurrencia en updates de inventario', async () => {
      // Simular múltiples órdenes concurrentes del mismo producto
      const concurrentOrders = [
        orderService.createOrder({
          customerId: createdCustomers[0].id,
          customerName: createdCustomers[0].name,
          customerEmail: createdCustomers[0].email,
          customerPhone: createdCustomers[0].phone,
          items: [{ productId: createdProducts[0].id, quantity: 1, size: 'M' }],
          paymentMethod: 'Credit Card',
          shippingAddress: createdCustomers[0].addresses[0],
        }),
        orderService.createOrder({
          customerId: createdCustomers[1].id,
          customerName: createdCustomers[1].name,
          customerEmail: createdCustomers[1].email,
          customerPhone: createdCustomers[1].phone,
          items: [{ productId: createdProducts[0].id, quantity: 1, size: 'M' }],
          paymentMethod: 'Debit Card',
          shippingAddress: createdCustomers[1].addresses[0],
        })
      ];

      const results = await Promise.allSettled(concurrentOrders);
      
      // Ambas órdenes deberían completarse exitosamente
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });

      // Agregar órdenes creadas para limpieza
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          createdOrders.push(result.value);
        }
      });
    });

    it('debería revertir inventario correctamente al cancelar orden', async () => {
      // Obtener inventario inicial
      const initialInventory = await prisma.product.findUnique({
        where: { id: createdProducts[1].id },
        include: { inventory: true }
      });

      // Crear orden para cancelar
      const orderToCancel = await orderService.createOrder({
        customerId: createdCustomers[0].id,
        customerName: createdCustomers[0].name,
        customerEmail: createdCustomers[0].email,
        customerPhone: createdCustomers[0].phone,
        items: [{ productId: createdProducts[1].id, quantity: 2, size: 'M' }],
        paymentMethod: 'Credit Card',
        shippingAddress: createdCustomers[0].addresses[0],
      });

      // Verificar que inventario se redujo
      const afterOrderInventory = await prisma.product.findUnique({
        where: { id: createdProducts[1].id },
        include: { inventory: true }
      });
      expect(afterOrderInventory?.inventory?.quantity).toBe(
        initialInventory!.inventory!.quantity - 2
      );

      // Cancelar orden
      await orderService.deleteOrder(orderToCancel.id);

      // Verificar que inventario se restauró
      const afterCancelInventory = await prisma.product.findUnique({
        where: { id: createdProducts[1].id },
        include: { inventory: true }
      });
      expect(afterCancelInventory?.inventory?.quantity).toBe(
        initialInventory!.inventory!.quantity
      );
    });
  });

  describe('Order Search and Filtering', () => {
    it('debería filtrar órdenes por estado', async () => {
      const pendingOrders = await orderService.getAllOrders({
        page: 1,
        limit: 10,
        status: OrderStatus.PENDING
      });

      expect(pendingOrders.orders.length).toBeGreaterThan(0);
      pendingOrders.orders.forEach(order => {
        expect(order.status).toBe(OrderStatus.PENDING);
      });
    });

    it('debería filtrar órdenes por rango de fechas', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const recentOrders = await orderService.getAllOrders({
        page: 1,
        limit: 10,
        startDate: yesterday,
        endDate: today
      });

      expect(recentOrders.orders.length).toBeGreaterThan(0);
      recentOrders.orders.forEach(order => {
        expect(new Date(order.orderDate).getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
        expect(new Date(order.orderDate).getTime()).toBeLessThanOrEqual(today.getTime());
      });
    });

    it('debería filtrar órdenes por cliente', async () => {
      const customerOrders = await orderService.getAllOrders({
        page: 1,
        limit: 10,
        customerId: createdCustomers[0].id
      });

      expect(customerOrders.orders.length).toBeGreaterThan(0);
      customerOrders.orders.forEach(order => {
        expect(order.customerId).toBe(createdCustomers[0].id);
      });
    });
  });

  describe('Order Statistics', () => {
    it('debería calcular estadísticas precisas de órdenes', async () => {
      const stats = await orderService.getOrderOverviewStats();

      expect(stats).toBeDefined();
      expect(stats.totalOrders).toBeGreaterThan(0);
      expect(stats.totalRevenue).toBeGreaterThan(0);
      expect(stats.pendingOrders).toBeGreaterThanOrEqual(0);
      expect(stats.shippedOrders).toBeGreaterThanOrEqual(0);
      expect(stats.deliveredOrders).toBeGreaterThanOrEqual(0);
      expect(stats.averageOrderValue).toBeGreaterThan(0);
    });

    it('debería calcular estadísticas por período', async () => {
      const monthlyStats = await orderService.getOrderStats({
        period: 'month',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      });

      expect(monthlyStats).toBeDefined();
      expect(Array.isArray(monthlyStats)).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('debería manejar productos inexistentes en orden', async () => {
      const invalidProductOrder = {
        customerId: createdCustomers[0].id,
        customerName: createdCustomers[0].name,
        customerEmail: createdCustomers[0].email,
        customerPhone: createdCustomers[0].phone,
        total: 100000,
        items: [
          { productId: 'non-existent-product-id', quantity: 1, size: 'M', price: 100000 }
        ],
        paymentMethod: 'Credit Card',
        shippingAddress: createdCustomers[0].addresses[0],
      };

      await expect(orderService.createOrder(invalidProductOrder))
        .rejects.toThrow();
    });

    it('debería manejar cantidad cero o negativa', async () => {
      const zeroQuantityOrder = {
        customerId: createdCustomers[0].id,
        customerName: createdCustomers[0].name,
        customerEmail: createdCustomers[0].email,
        customerPhone: createdCustomers[0].phone,
        total: 0,
        items: [
          { productId: createdProducts[0].id, quantity: 0, size: 'M', price: 0 }
        ],
        paymentMethod: 'Credit Card',
        shippingAddress: createdCustomers[0].addresses[0],
      };

      await expect(orderService.createOrder(zeroQuantityOrder))
        .rejects.toThrow();
    });

    it('debería manejar cliente inexistente', async () => {
      const invalidCustomerOrder = {
        customerId: 'non-existent-customer-id',
        customerName: 'Non Existent',
        customerEmail: 'nonexistent@test.com',
        customerPhone: '+57 300 000 0000',
        total: 100000,
        items: [
          { productId: createdProducts[0].id, quantity: 1, size: 'M', price: 100000 }
        ],
        paymentMethod: 'Credit Card',
        shippingAddress: {
          street: 'Non Existent Street',
          city: 'Non Existent City',
          state: 'Non Existent State',
          zipCode: '00000',
          country: 'Colombia'
        },
      };

      await expect(orderService.createOrder(invalidCustomerOrder))
        .rejects.toThrow();
    });
  });

  describe('Large Volume Operations', () => {
    it('debería manejar orden con muchos items diferentes', async () => {
      // Crear productos adicionales para esta prueba
      const bulkProducts = [];
      for (let i = 0; i < 5; i++) {
        const product = await prisma.product.create({
          data: {
            name: `Producto Bulk ${i}`,
            price: 100 + i * 50,
            category: 'Anillos',
            subcategory: 'Plata',
            description: `Producto ${i} para prueba de volumen`,
            materials: 'Plata 925',
            dimensions: 'Estándar',
            care: 'Cuidado básico',
            images: {
              create: [{ url: `http://example.com/bulk-${i}.jpg`, isPrimary: true, order: 0 }]
            },
            tags: {
              create: [{ tag: `bulk-${i}` }]
            },
            inventory: {
              create: { quantity: 100 }
            }
          },
          include: { inventory: true }
        });
        bulkProducts.push(product);
      }

      const bulkOrder = await orderService.createOrder({
        customerId: createdCustomers[0].id,
        customerName: createdCustomers[0].name,
        customerEmail: createdCustomers[0].email,
        customerPhone: createdCustomers[0].phone,
        total: bulkProducts.reduce((sum, product, index) => sum + product.price * (index + 1), 0),
        items: bulkProducts.map((product, index) => ({
          productId: product.id,
          quantity: index + 1,
          size: 'M',
          price: product.price
        })),
        paymentMethod: 'Credit Card',
        shippingAddress: createdCustomers[0].addresses[0],
      });

      expect(bulkOrder).toBeDefined();
      expect(bulkOrder.items).toHaveLength(5);
      
      // Limpiar productos de prueba de volumen
      await prisma.orderItem.deleteMany({
        where: { orderId: bulkOrder.id }
      });
      await prisma.shippingAddress.deleteMany({
        where: { orderId: bulkOrder.id }
      });
      await prisma.order.delete({ where: { id: bulkOrder.id } });
      
      for (const product of bulkProducts) {
        await prisma.inventory.delete({ where: { productId: product.id } });
        await prisma.productImage.deleteMany({ where: { productId: product.id } });
        await prisma.productTag.deleteMany({ where: { productId: product.id } });
        await prisma.product.delete({ where: { id: product.id } });
      }
    });
  });
});