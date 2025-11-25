
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';

// Tipos para los datos del cliente
type AddressData = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault?: boolean;
};

type CustomerData = {
  name: string;
  email: string;
  phone: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'VIP';
  birthDate?: Date;
  preferences?: string[];
  notes?: string;
  addresses: AddressData[];
};

// Esquema de validación para la consulta de clientes (para el servicio)
const customerQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'VIP']).optional(),
  sortBy: z.enum(['name', 'email', 'registrationDate', 'totalSpent']).default('registrationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Función para formatear la salida del cliente
const formatCustomerOutput = (customer: any) => ({
  id: customer.id,
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
  status: customer.status,
  registrationDate: customer.registrationDate,
  lastPurchase: customer.lastPurchase,
  totalOrders: customer.totalOrders,
  totalSpent: Number(customer.totalSpent),
  wishlistItems: customer.wishlistItems,
  notes: customer.notes,
  birthDate: customer.birthDate,
  preferences: customer.preferences,
  addresses: customer.addresses,
  createdAt: customer.createdAt,
  updatedAt: customer.updatedAt,
  // Incluir órdenes recientes si están presentes
  recentOrders: customer.orders ? customer.orders.map((order: any) => ({
    id: order.id,
    total: Number(order.total),
    date: order.orderDate,
    status: order.status,
  })) : undefined,
  // Incluir órdenes completas si están presentes (para getCustomerById)
  orders: customer.orders && customer.orders[0] && customer.orders[0].items ? customer.orders.map((order: any) => ({
    id: order.id,
    total: Number(order.total),
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    orderDate: order.orderDate,
    estimatedDelivery: order.estimatedDelivery,
    trackingNumber: order.trackingNumber,
    items: order.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productImage: item.product.images[0] || null,
      quantity: item.quantity,
      price: Number(item.price),
      size: item.size,
    })),
    shippingAddress: order.shippingAddress,
  })) : undefined,
});

export const getAllCustomers = async (query: z.infer<typeof customerQuerySchema>) => {
  const { page, limit, search, status, sortBy, sortOrder } = query;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const offset = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        addresses: true,
        orders: {
          select: {
            id: true,
            total: true,
            orderDate: true,
            status: true,
          },
          orderBy: { orderDate: 'desc' },
          take: 5,
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: offset,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers: customers.map(formatCustomerOutput),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getCustomerById = async (id: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: {
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
          shippingAddress: true,
        },
        orderBy: { orderDate: 'desc' },
      },
    },
  });

  if (!customer) {
    return null;
  }
  return formatCustomerOutput(customer);
};

export const createCustomer = async (customerData: CustomerData) => {
  const existingCustomer = await prisma.customer.findUnique({
    where: { email: customerData.email },
  });

  if (existingCustomer) {
    throw new ConflictError('Ya existe un cliente con este email');
  }

  const customer = await prisma.customer.create({
    data: {
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      status: customerData.status,
      birthDate: customerData.birthDate,
      preferences: customerData.preferences,
      notes: customerData.notes,
      addresses: {
        create: customerData.addresses,
      },
    },
    include: {
      addresses: true,
    },
  });
  return formatCustomerOutput(customer);
};

export const updateCustomer = async (id: string, updateData: Partial<CustomerData>) => {
  const existingCustomer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!existingCustomer) {
    throw new NotFoundError('Cliente no encontrado');
  }

  if (updateData.email && updateData.email !== existingCustomer.email) {
    const emailExists = await prisma.customer.findUnique({
      where: { email: updateData.email },
    });

    if (emailExists) {
      throw new ConflictError('Ya existe un cliente con este email');
    }
  }

  const customerUpdateData: any = {
    name: updateData.name,
    email: updateData.email,
    phone: updateData.phone,
    status: updateData.status,
    birthDate: updateData.birthDate,
    preferences: updateData.preferences,
    notes: updateData.notes,
  };

  if (updateData.addresses) {
    customerUpdateData.addresses = {
      deleteMany: {},
      create: updateData.addresses,
    };
  }

  const updatedCustomer = await prisma.customer.update({
    where: { id },
    data: customerUpdateData,
    include: {
      addresses: true,
    },
  });

  return formatCustomerOutput(updatedCustomer);
};

export const deleteCustomer = async (id: string) => {
  const existingCustomer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: true,
    },
  });

  if (!existingCustomer) {
    throw new NotFoundError('Cliente no encontrado');
  }

  if (existingCustomer.orders.length > 0) {
    throw new BadRequestError('No se puede eliminar un cliente con pedidos asociados');
  }

  await prisma.customer.delete({
    where: { id },
  });
};

export const getCustomerOverviewStats = async () => {
  const [
    totalCustomers,
    activeCustomers,
    vipCustomers,
    inactiveCustomers,
    totalRevenue,
    averageOrderValue,
    topCustomers,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { status: 'ACTIVE' } }),
    prisma.customer.count({ where: { status: 'VIP' } }),
    prisma.customer.count({ where: { status: 'INACTIVE' } }),
    prisma.customer.aggregate({
      _sum: { totalSpent: true },
    }),
    prisma.customer.aggregate({
      _avg: { totalSpent: true },
    }),
    prisma.customer.findMany({
      orderBy: { totalSpent: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        totalSpent: true,
        totalOrders: true,
        status: true,
      },
    }),
  ]);

  return {
    totalCustomers,
    activeCustomers,
    vipCustomers,
    inactiveCustomers,
    totalRevenue: Number(totalRevenue._sum.totalSpent || 0),
    averageOrderValue: Number(averageOrderValue._avg.totalSpent || 0),
    topCustomers: topCustomers.map(customer => ({
      ...customer,
      totalSpent: Number(customer.totalSpent),
    })),
  };
};
