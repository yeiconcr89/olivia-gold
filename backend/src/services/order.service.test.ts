
import { prisma } from '../utils/prisma';
import * as orderService from './order.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// Datos de prueba
const productData = {
  name: 'Producto de Prueba para Pedido',
  price: 50.00,
  category: 'Joyas',
  subcategory: 'Anillos',
  description: 'Descripción del producto.',
  materials: 'Oro',
  dimensions: '1x1x1',
  care: 'Cuidado.',
  images: ['http://example.com/product.jpg'],
  tags: [],
};

const customerData = {
  name: 'Cliente Pedido',
  email: 'test-order@example.com',
  phone: '1112223333',
};

const addressData = [
  {
    street: 'Calle del Pedido 1',
    city: 'Ciudad Pedido',
    state: 'Estado Pedido',
    zipCode: '12345',
    country: 'Colombia',
  },
];

let createdProduct: any;
let createdCustomer: any;
let createdOrder: any;

describe('Order Service - Pruebas de Integración', () => {

  // Limpiar la base de datos antes de todas las pruebas
  beforeAll(async () => {
    await prisma.orderItem.deleteMany({});
    await prisma.shippingAddress.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productTag.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.customerAddress.deleteMany({});
    await prisma.customer.deleteMany({});

    // Crear un producto y cliente para las pruebas
    createdProduct = await prisma.product.create({
      data: {
        ...productData,
        images: {
          create: productData.images.map((url, index) => ({ url, isPrimary: index === 0, order: index }))
        },
        tags: {
          create: productData.tags.map((tag: string) => ({ tag }))
        },
        inventory: {
          create: { quantity: 100 }
        }
      },
      include: { inventory: true, images: true, tags: true }
    });

    createdCustomer = await prisma.customer.create({
      data: {
        ...customerData,
        addresses: {
          create: addressData
        }
      }
    });
  });

  // Limpiar la base de datos después de todas las pruebas
  afterAll(async () => {
    await prisma.orderItem.deleteMany({});
    await prisma.shippingAddress.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productTag.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.customerAddress.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.$disconnect();
  });

  it('debería crear un nuevo pedido correctamente y actualizar el inventario y el cliente', async () => {
    const orderInput = {
      customerId: createdCustomer.id,
      customerName: createdCustomer.name,
      customerEmail: createdCustomer.email,
      customerPhone: createdCustomer.phone,
      items: [
        { productId: createdProduct.id, quantity: 2, size: 'M', price: Number(createdProduct.price) },
      ],
      total: Number(createdProduct.price) * 2,
      paymentMethod: 'Credit Card',
      shippingAddress: addressData[0],
    };

    createdOrder = await orderService.createOrder(orderInput);

    expect(createdOrder).toBeDefined();
    expect(createdOrder.total).toBe(Number(createdProduct.price) * 2);
    expect(createdOrder.items).toHaveLength(1);

    // Verificar inventario
    const updatedProduct = await prisma.product.findUnique({
      where: { id: createdProduct.id },
      include: { inventory: true }
    });
    expect(updatedProduct?.inventory?.quantity).toBe(98); // 100 - 2

    // Verificar cliente
    const updatedCustomer = await prisma.customer.findUnique({ where: { id: createdCustomer.id } });
    expect(updatedCustomer?.totalOrders).toBe(1);
    expect(Number(updatedCustomer?.totalSpent)).toBe(Number(createdProduct.price) * 2);
  });

  it('debería lanzar un error si el stock es insuficiente', async () => {
    const orderInput = {
      customerId: createdCustomer.id,
      customerName: createdCustomer.name,
      customerEmail: createdCustomer.email,
      customerPhone: createdCustomer.phone,
      items: [
        { productId: createdProduct.id, quantity: 200, size: 'M', price: Number(createdProduct.price) }, // Cantidad excesiva
      ],
      total: Number(createdProduct.price) * 200,
      paymentMethod: 'Credit Card',
      shippingAddress: addressData[0],
    };

    await expect(orderService.createOrder(orderInput)).rejects.toThrow('Stock insuficiente para el producto: Producto de Prueba para Pedido');
  });

  it('debería obtener un pedido por su ID (acceso privado)', async () => {
    const foundOrder: any = await orderService.getOrderById(createdOrder.id);

    expect(foundOrder).not.toBeNull();
    if (foundOrder) {
      expect(foundOrder.id).toBe(createdOrder.id);
      expect(foundOrder.customerInfo).toBeDefined();
    }
  });

  it('debería obtener un pedido por su ID (acceso público)', async () => {
    const foundOrder: any = await orderService.getOrderById(createdOrder.id, true);

    expect(foundOrder).not.toBeNull();
    if (foundOrder) {
      expect(foundOrder.id).toBe(createdOrder.id);
      expect(foundOrder).not.toHaveProperty('customerInfo'); // No debe incluir info de cliente en público
    }
  });

  it('debería lanzar un error si el ID del pedido no existe', async () => {
    const nonExistentId = 'clxkj3b4k0000a4b2v3c8d9e9'; // ID inventado

    await expect(orderService.getOrderById(nonExistentId)).rejects.toThrow('Pedido no encontrado');
  });

  it('debería obtener todos los pedidos', async () => {
    const result = await orderService.getAllOrders({
      page: 1,
      limit: 10,
      sortBy: 'orderDate',
      sortOrder: 'desc',
    });

    expect(result.orders).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('debería actualizar el estado de un pedido', async () => {
    const updateData = { status: OrderStatus.SHIPPED, trackingNumber: 'TRACK123' };
    const updatedOrder = await orderService.updateOrderStatus(createdOrder.id, updateData);

    expect(updatedOrder).toBeDefined();
    expect(updatedOrder.status).toBe(OrderStatus.SHIPPED);
    expect(updatedOrder.trackingNumber).toBe('TRACK123');

    // Verificar directamente en la BD
    const dbOrder = await prisma.order.findUnique({ where: { id: createdOrder.id } });
    expect(dbOrder?.status).toBe(OrderStatus.SHIPPED);
  });

  it('debería obtener estadísticas de pedidos', async () => {
    const stats = await orderService.getOrderOverviewStats();

    expect(stats).toBeDefined();
    expect(stats.totalOrders).toBeGreaterThanOrEqual(1);
    expect(stats.shippedOrders).toBeGreaterThanOrEqual(1);
  });

  it('debería eliminar un pedido y revertir el inventario y las estadísticas del cliente', async () => {
    // Crear un nuevo pedido para eliminar
    const productForDelete = await prisma.product.create({
      data: {
        ...productData,
        name: 'Producto para Eliminar',
        images: {
          create: productData.images.map((url, index) => ({ url, isPrimary: index === 0, order: index }))
        },
        tags: {
          create: productData.tags.map((tag: string) => ({ tag }))
        },
        inventory: {
          create: { quantity: 50 }
        }
      },
      include: { inventory: true }
    });

    const customerForDelete = await prisma.customer.create({
      data: {
        ...customerData,
        email: 'delete_order@example.com',
        name: 'Cliente para Eliminar Pedido',
      }
    });

    const orderToDelete = await orderService.createOrder({
      customerId: customerForDelete.id,
      customerName: customerForDelete.name,
      customerEmail: customerForDelete.email,
      customerPhone: customerForDelete.phone,
      items: [
        { productId: productForDelete.id, quantity: 5, size: 'S', price: Number(productForDelete.price) },
      ],
      total: Number(productForDelete.price) * 5,
      paymentMethod: 'Cash',
      shippingAddress: addressData[0],
    });

    // Verificar estado inicial del inventario y cliente
    const initialProduct = await prisma.product.findUnique({ where: { id: productForDelete.id }, include: { inventory: true } });
    const initialCustomer = await prisma.customer.findUnique({ where: { id: customerForDelete.id } });

    await orderService.deleteOrder(orderToDelete.id);

    // Verificar que el pedido fue eliminado
    const dbOrder = await prisma.order.findUnique({ where: { id: orderToDelete.id } });
    expect(dbOrder).toBeNull();

    // Verificar que el inventario fue revertido
    const finalProduct = await prisma.product.findUnique({ where: { id: productForDelete.id }, include: { inventory: true } });
    expect(finalProduct?.inventory?.quantity).toBe(initialProduct!.inventory!.quantity + 5); // 50 + 5

    // Verificar que las estadísticas del cliente fueron revertidas
    const finalCustomer = await prisma.customer.findUnique({ where: { id: customerForDelete.id } });
    expect(finalCustomer?.totalOrders).toBe(initialCustomer!.totalOrders - 1);
    expect(Number(finalCustomer?.totalSpent)).toBe(Number(initialCustomer!.totalSpent) - Number(orderToDelete.total));
  });

  it('no debería eliminar un pedido que ya ha sido enviado o entregado', async () => {
    const shippedOrder = await prisma.order.create({
      data: {
        id: 'SHIPPED-ORDER-123',
        orderNumber: 'SHIPPED-ORDER-123',
        customerId: createdCustomer.id,
        customerName: createdCustomer.name,
        customerEmail: createdCustomer.email,
        customerPhone: createdCustomer.phone,
        total: 10.00,
        paymentMethod: 'Transfer',
        status: OrderStatus.SHIPPED,
        paymentStatus: PaymentStatus.PAID,
        items: {
          create: [
            { productId: createdProduct.id, quantity: 1, price: 10.00 },
          ],
        },
        shippingAddress: {
          create: {
            street: 'Calle Enviada', city: 'Ciudad Enviada', state: 'Estado Enviada', zipCode: '54321',
          },
        },
      },
    });

    await expect(orderService.deleteOrder(shippedOrder.id)).rejects.toThrow('No se puede cancelar un pedido que ya ha sido enviado o entregado');

    // Limpiar
    await prisma.orderItem.deleteMany({ where: { orderId: shippedOrder.id } });
    await prisma.shippingAddress.deleteMany({ where: { orderId: shippedOrder.id } });
    await prisma.order.delete({ where: { id: shippedOrder.id } });
  });
});
