
import { prisma } from '../utils/prisma';
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';
import { z } from 'zod';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { generateOrderNumber } from '../utils/orderNumber';


// ============================================================================
// TIPOS
// ============================================================================

type OrderItemInput = {
  productId: string;
  quantity: number;
  size?: string;
};

type OrderItemWithProduct = Prisma.OrderItemGetPayload<{
  include: {
    product: {
      select: {
        id: true;
        name: true;
        images: true;
      };
    };
  };
}>;

type OrderItemForResponse = {
  id: string;
  productId: string;
  productName: string;
  productImage: any;
  quantity: number;
  price: number;
  size: string | null;
};

type ShippingAddressInput = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
};

type CreateOrderData = {
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocument?: string;
  items: Array<{
    productId: string;
    quantity: number;
    size?: string;
    price: number;
  }>;
  paymentMethod: string;
  shippingAddress: ShippingAddressInput & {
    instructions?: string;
  };
  notes?: string;
  // Campos adicionales del carrito
  cartId?: string;
  subtotal?: number;
  taxAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  total: number;
  couponCode?: string;
};

type UpdateOrderStatusData = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  notes?: string;
};

// Esquema de validación para la consulta de pedidos (para el servicio)
const orderQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  customerId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  sortBy: z.enum(['orderDate', 'total', 'status', 'customerName']).default('orderDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// HELPERS
// ============================================================================

type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: {
          select: {
            id: true;
            name: true;
            images: true;
          };
        };
      };
    };
    shippingAddress: true;
    customer: {
      select: {
        id: true;
        name: true;
        status: true;
      };
    };
  };
}>;

const formatOrderResponse = (order: any) => {
  return {
    id: order.id!,
    orderNumber: order.id!, // Usar el ID como número de pedido (formato PED-AAMMDD-XXX)
    customerId: order.customerId,
    customerName: order.customerName!,
    customerEmail: order.customerEmail!,
    customerPhone: order.customerPhone!,
    customerInfo: order.customer ? { id: order.customer.id, name: order.customer.name, status: order.customer.status } : null,
    total: Number(order.total),
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    orderDate: order.orderDate,
    estimatedDelivery: order.estimatedDelivery,
    trackingNumber: order.trackingNumber,
    notes: order.notes,
    itemsCount: order.items?.length || 0,
    itemCount: order.items?.length || 0, // Alias para compatibilidad con frontend
    items: order.items?.map((item: any): OrderItemForResponse => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name || 'N/A',
      productImage: item.product?.images?.[0] || null,
      quantity: item.quantity,
      price: Number(item.price),
      size: item.size,
    })),
    shippingAddress: order.shippingAddress,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

// ============================================================================
// FUNCIONES DEL SERVICIO
// ============================================================================

export const createOrder = async (orderData: CreateOrderData) => {
  console.log('🛒 createOrder llamado con datos:', JSON.stringify(orderData, null, 2));
  
  const order = await prisma.$transaction(async (tx) => {
    // 1. Buscar o crear customer si no se proporciona customerId
    let customerId = orderData.customerId;
    
    if (!customerId) {
      // Buscar customer existente por email
      let customer = await tx.customer.findUnique({
        where: { email: orderData.customerEmail }
      });

      if (!customer) {
        // Crear nuevo customer
        customer = await tx.customer.create({
          data: {
            name: orderData.customerName,
            email: orderData.customerEmail,
            phone: orderData.customerPhone,
            status: 'ACTIVE',
            registrationDate: new Date(),
            totalOrders: 0,
            totalSpent: 0,
          }
        });
        logger.info(`Nuevo customer creado: ${customer.id} - ${customer.email}`);
      } else {
        // Actualizar información del customer si es necesario
        if (customer.name !== orderData.customerName || customer.phone !== orderData.customerPhone) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: {
              name: orderData.customerName,
              phone: orderData.customerPhone,
            }
          });
          logger.info(`Customer actualizado: ${customer.id} - ${customer.email}`);
        }
      }
      
      customerId = customer.id;
    }

    // 2. Verificar que todos los productos existen y obtener su inventario
    const productIds = orderData.items.map(item => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      include: {
        inventory: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundError('Uno o más productos no existen');
    }

    // 3. Verificar stock y preparar actualizaciones de inventario
    const inventoryUpdates: Prisma.PrismaPromise<any>[] = [];
    for (const item of orderData.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product || !product.inventory || product.inventory.quantity < item.quantity) {
        throw new BadRequestError(`Stock insuficiente para el producto: ${product?.name || item.productId}`);
      }
      inventoryUpdates.push(
        tx.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        })
      );
    }

    // 4. Preparar items del pedido y usar el total del carrito
    const orderItems = orderData.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price || product!.price, // Usar precio del item o del producto
        size: item.size,
      };
    });
    
    // Usar el total calculado del carrito
    const total = orderData.total;

    // 5. Generar número de pedido único
    const orderNumber = await generateOrderNumber();
    
    // 6. Crear el pedido
    const newOrder = await tx.order.create({
      data: {
        id: orderNumber,
        orderNumber: orderNumber,
        customerId: customerId, // Usar el customerId encontrado o creado
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        total,
        subtotal: orderData.subtotal || total,
        taxAmount: orderData.taxAmount || 0,
        shippingAmount: orderData.shippingAmount || 0,
        discountAmount: orderData.discountAmount || 0,
        paymentMethod: orderData.paymentMethod,
        couponCode: orderData.couponCode,
        notes: orderData.notes,
        items: {
          create: orderItems,
        },
        shippingAddress: {
          create: orderData.shippingAddress,
        },
      },
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
        customer: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    // 7. Ejecutar actualizaciones de inventario
    await Promise.all(inventoryUpdates);

    // 8. Actualizar estadísticas del cliente (ahora siempre existe)
    await tx.customer.update({
      where: { id: customerId },
      data: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: total },
        lastPurchase: new Date(),
      },
    });

    return newOrder;
  });

    logger.debug('Order object before formatting in createOrder:', JSON.stringify(order, null, 2));
  return formatOrderResponse(order);
};



export const getOrderById = async (id: string, isPublic: boolean = false) => {
  // Siempre incluir la relación product para evitar errores de tipo
  const includeOptions: Prisma.OrderInclude = {
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
  };

  if (!isPublic) {
    includeOptions.customer = {
      select: {
        id: true,
        name: true,
        status: true,
      },
    };
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: includeOptions,
  });

  if (!order) {
    throw new NotFoundError('Pedido no encontrado');
  }

  if (isPublic) {
    // Información limitada para acceso público
    return {
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderDate: order.orderDate,
      estimatedDelivery: order.estimatedDelivery,
      trackingNumber: order.trackingNumber,
      total: Number(order.total),
      items: order.items.map((item: any) => ({
        productName: item.product?.name || 'N/A',
        productImage: item.product?.images?.[0] || null,
        quantity: item.quantity,
        price: Number(item.price),
      })),
    };
  } else {
    logger.debug('Order object before formatting in getOrderById (private):', JSON.stringify(order, null, 2));
    return formatOrderResponse(order);
  }
};

export const getAllOrders = async (query: z.infer<typeof orderQuerySchema>) => {
  const { page, limit, search, status, paymentStatus, customerId, startDate, endDate, sortBy, sortOrder } = query;

  const where: any = {};

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerEmail: { contains: search, mode: 'insensitive' } },
      { id: { contains: search, mode: 'insensitive' } },
      { trackingNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (startDate || endDate) {
    where.orderDate = {};
    if (startDate) where.orderDate.gte = startDate;
    if (endDate) where.orderDate.lte = endDate;
  }

  const offset = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
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
        customer: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: offset,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((order: any) => {
      logger.debug('Order object before formatting in getAllOrders:', JSON.stringify(order, null, 2));
      return formatOrderResponse(order);
    }),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const updateOrderStatus = async (id: string, updateData: UpdateOrderStatusData) => {
  const existingOrder = await prisma.order.findUnique({
    where: { id },
  });

  if (!existingOrder) {
    throw new NotFoundError('Pedido no encontrado');
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      status: updateData.status,
      paymentStatus: updateData.paymentStatus,
      trackingNumber: updateData.trackingNumber,
      estimatedDelivery: updateData.estimatedDelivery,
      notes: updateData.notes,
    },
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
      customer: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  logger.debug('Order object before formatting in updateOrderStatus:', JSON.stringify(updatedOrder, null, 2));
  return formatOrderResponse(updatedOrder);
};

export const deleteOrder = async (id: string) => {
  const existingOrder = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!existingOrder) {
    throw new NotFoundError('Pedido no encontrado');
  }

  // Solo permitir cancelar pedidos que no han sido enviados o entregados
  if (['SHIPPED', 'DELIVERED'].includes(existingOrder.status)) {
    throw new BadRequestError('No se puede cancelar un pedido que ya ha sido enviado o entregado');
  }

  // Actualizar estadísticas del cliente si existe
  if (existingOrder.customerId) {
    // Revertir inventario
    for (const item of existingOrder.items) {
      await prisma.inventory.update({
        where: { productId: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }

    await prisma.customer.update({
      where: { id: existingOrder.customerId },
      data: {
        totalOrders: { decrement: 1 },
        totalSpent: { decrement: Number(existingOrder.total) },
      },
    });
  }

  await prisma.order.delete({
    where: { id },
  });
};

export const getOrderOverviewStats = async () => {
  const [
    totalOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
    averageOrderValue,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'PROCESSING' } }),
    prisma.order.count({ where: { status: 'SHIPPED' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _avg: { total: true },
    }),
    prisma.order.findMany({
      orderBy: { orderDate: 'desc' },
      take: 10,
      select: {
        id: true,
        customerName: true,
        total: true,
        status: true,
        orderDate: true,
      },
    }),
  ]);

  return {
    totalOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue: Number(totalRevenue._sum.total || 0),
    averageOrderValue: Number(averageOrderValue._avg.total || 0),
    recentOrders: recentOrders.map(order => ({
      ...order,
      total: Number(order.total),
    })),
  };
};
