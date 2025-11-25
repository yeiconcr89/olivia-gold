
import { prisma } from '../utils/prisma';
import * as customerService from './customer.service';

// Datos de prueba
const customerData = {
  name: 'Cliente de Prueba',
  email: 'test-customer@example.com',
  phone: '1234567890',
  addresses: [
    {
      street: 'Calle Falsa 123',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      country: 'USA',
      isDefault: true,
    },
  ],
};

const customerData2 = {
  name: 'Otro Cliente',
  email: 'another@example.com',
  phone: '0987654321',
  addresses: [
    {
      street: 'Avenida Siempre Viva 742',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      country: 'USA',
      isDefault: true,
    },
  ],
};

let createdCustomer: any;

describe('Customer Service - Pruebas de Integración', () => {

  // Limpiar la base de datos antes de todas las pruebas
  beforeAll(async () => {
    await prisma.customerAddress.deleteMany({});
    await prisma.customer.deleteMany({});
  });

  // Limpiar la base de datos después de todas las pruebas
  afterAll(async () => {
    await prisma.customerAddress.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.$disconnect();
  });

  it('debería crear un nuevo cliente correctamente', async () => {
    createdCustomer = await customerService.createCustomer(customerData);

    expect(createdCustomer).toBeDefined();
    expect(createdCustomer.name).toBe(customerData.name);
    expect(createdCustomer.email).toBe(customerData.email);
    expect(createdCustomer.addresses).toHaveLength(1);

    // Verificar directamente en la BD
    const dbCustomer = await prisma.customer.findUnique({ where: { id: createdCustomer.id }, include: { addresses: true } });
    expect(dbCustomer).not.toBeNull();
    expect(dbCustomer?.addresses).toHaveLength(1);
  });

  it('no debería crear un cliente con un email duplicado', async () => {
    await expect(customerService.createCustomer(customerData)).rejects.toThrow('Ya existe un cliente con este email');
  });

  it('debería obtener un cliente por su ID', async () => {
    const foundCustomer = await customerService.getCustomerById(createdCustomer.id);

    expect(foundCustomer).not.toBeNull();
    expect(foundCustomer?.id).toBe(createdCustomer.id);
    expect(foundCustomer?.email).toBe(customerData.email);
  });

  it('debería devolver null si el ID del cliente no existe', async () => {
    const nonExistentId = 'clxkj3b4k0000a4b2v3c8d9e9'; // ID inventado
    const foundCustomer = await customerService.getCustomerById(nonExistentId);

    expect(foundCustomer).toBeNull();
  });

  it('debería obtener todos los clientes', async () => {
    await customerService.createCustomer(customerData2);
    const result = await customerService.getAllCustomers({
      page: 1,
      limit: 20,
      sortBy: 'registrationDate',
      sortOrder: 'desc',
    });

    expect(result.customers).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
  });

  it('debería actualizar un cliente existente', async () => {
    const updateData = { name: 'Cliente Actualizado', phone: '9998887777' };

    const updatedCustomer = await customerService.updateCustomer(createdCustomer.id, updateData);

    expect(updatedCustomer).toBeDefined();
    expect(updatedCustomer.name).toBe(updateData.name);
    expect(updatedCustomer.phone).toBe(updateData.phone);

    // Verificar directamente en la BD
    const dbCustomer = await prisma.customer.findUnique({ where: { id: createdCustomer.id } });
    expect(dbCustomer?.name).toBe(updateData.name);
  });

  it('no debería actualizar un cliente con un email duplicado', async () => {
    const tempCustomer = await customerService.createCustomer({
      name: 'Temp', email: 'temp@example.com', phone: '111', addresses: customerData.addresses
    });
    await expect(customerService.updateCustomer(tempCustomer.id, { email: customerData.email })).rejects.toThrow('Ya existe un cliente con este email');
    await prisma.customer.delete({ where: { id: tempCustomer.id } }); // Limpiar
  });

  it('debería obtener estadísticas de clientes', async () => {
    const stats = await customerService.getCustomerOverviewStats();

    expect(stats).toBeDefined();
    expect(stats.totalCustomers).toBeGreaterThanOrEqual(1);
    expect(stats.activeCustomers).toBeGreaterThanOrEqual(1);
  });

  it('debería eliminar un cliente existente', async () => {
    // Crear un cliente que pueda ser eliminado (sin pedidos asociados)
    const customerToDelete = await customerService.createCustomer({
      name: 'Cliente a Eliminar', email: 'delete@example.com', phone: '555', addresses: customerData.addresses
    });

    await customerService.deleteCustomer(customerToDelete.id);

    // Verificar directamente en la BD
    const dbCustomer = await prisma.customer.findUnique({ where: { id: customerToDelete.id } });
    expect(dbCustomer).toBeNull();
  });

  it('no debería eliminar un cliente con pedidos asociados', async () => {
    // Para esta prueba, necesitaríamos simular un pedido asociado.
    // Dado que estamos haciendo pruebas de integración, esto requeriría crear un pedido real.
    // Por simplicidad, esta prueba se dejará como un placeholder o se implementará si se crea un servicio de pedidos.
    // Por ahora, asumimos que el servicio de pedidos no está integrado aquí.
    const customerWithOrders = await customerService.createCustomer({
      name: 'Cliente con Pedidos', email: 'orders@example.com', phone: '444', addresses: customerData.addresses
    });

    // Crear un pedido real asociado al cliente
    const dummyOrder = await prisma.order.create({
      data: {
        customerId: customerWithOrders.id,
        customerName: customerWithOrders.name,
        customerEmail: customerWithOrders.email,
        customerPhone: customerWithOrders.phone,
        total: 100.00,
        paymentMethod: 'Credit Card',
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });

    await expect(customerService.deleteCustomer(customerWithOrders.id)).rejects.toThrow('No se puede eliminar un cliente con pedidos asociados');

    // Limpiar el pedido y el cliente
    await prisma.order.delete({ where: { id: dummyOrder.id } });
    await prisma.customer.delete({ where: { id: customerWithOrders.id } });
  });
});
