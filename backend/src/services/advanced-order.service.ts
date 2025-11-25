import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import * as inventoryService from './inventory.service';
import * as cartService from './cart.service';

// ============================================================================
// TIPOS Y VALIDACIONES
// ============================================================================

const createOrderFromCartSchema = z.object({
  cartId: z.string().cuid(),
  customerInfo: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
  }),
  shippingAddress: z.object({
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    zipCode: z.string().min(5),
    country: z.string().default('Colombia'),
  }),
  paymentMethod: z.string().min(1),
  couponCode: z.string().optional(),
  shippingMethodId: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().default('WEB'),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'CONFIRMED', 'PROCESSING', 'PREPARING', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PARTIALLY_DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED']),
  paymentStatus: z.enum(['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'PARTIAL_REFUND', 'REFUNDED', 'CHARGEBACK']).optional(),
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
  carrier: z.string().optional(),
  trackingUrl: z.string().url().optional(),
});

interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  orderDate: Date;
  estimatedDelivery?: Date;
  trackingNumber?: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  timeline: Array<{
    status: string;
    description: string;
    location?: string;
    timestamp: Date;
    estimatedArrival?: Date;
    actualArrival?: Date;
  }>;
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

export const createOrderFromCart = async (
  orderData: z.infer<typeof createOrderFromCartSchema>,
  userId?: string
) => {
  const validatedData = createOrderFromCartSchema.parse(orderData);
  const { cartId, customerInfo, shippingAddress, paymentMethod, couponCode, shippingMethodId, notes, source, utm_source, utm_medium, utm_campaign } = validatedData;

  return await prisma.$transaction(async (tx) => {
    // 1. Obtener el carrito y validar que existe
    const cart = await tx.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: {
              include: { inventory: true }
            }
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestError('Carrito vacío o no encontrado');
    }

    // 2. Validar inventario para todos los productos
    for (const item of cart.items) {
      const availableQuantity = (item.product.inventory?.quantity || 0) - (item.product.inventory?.reservedQuantity || 0);
      if (availableQuantity < item.quantity) {
        throw new BadRequestError(`Solo hay ${availableQuantity} unidades disponibles de ${item.product.name}`);
      }
    }

    // 3. Calcular totales
    let subtotal = 0;
    const orderItems = cart.items.map(item => {
      const itemSubtotal = Number(item.product.price) * item.quantity;
      subtotal += itemSubtotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
        size: item.size,
      };
    });

    // 4. Aplicar cupón si existe
    let coupon = null;
    let discountAmount = 0;
    if (couponCode) {
      coupon = await tx.coupon.findUnique({
        where: { code: couponCode }
      });

      if (coupon && coupon.status === 'ACTIVE' && 
          new Date() >= coupon.validFrom && 
          new Date() <= coupon.validUntil &&
          (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) &&
          (!coupon.minimumAmount || subtotal >= Number(coupon.minimumAmount))) {
        
        if (coupon.type === 'PERCENTAGE') {
          discountAmount = subtotal * (Number(coupon.value) / 100);
          if (coupon.maximumDiscount && discountAmount > Number(coupon.maximumDiscount)) {
            discountAmount = Number(coupon.maximumDiscount);
          }
        } else if (coupon.type === 'FIXED') {
          discountAmount = Number(coupon.value);
        }
      }
    }

    // 5. Calcular shipping
    let shippingAmount = 0;
    let shippingMethod = null;
    if (shippingMethodId) {
      shippingMethod = await tx.shippingMethod.findUnique({
        where: { id: shippingMethodId }
      });
      if (shippingMethod && shippingMethod.isActive) {
        shippingAmount = Number(shippingMethod.basePrice);
        if (shippingMethod.freeShippingMinimum && subtotal >= Number(shippingMethod.freeShippingMinimum)) {
          shippingAmount = 0;
        }
      }
    } else {
      // Método de envío por defecto
      shippingAmount = subtotal >= 150000 ? 0 : 15000; // Envío gratis sobre $150k
    }

    // Si el cupón es de envío gratis
    if (coupon?.type === 'FREE_SHIPPING') {
      const originalShipping = shippingAmount;
      shippingAmount = 0;
      discountAmount = originalShipping;
    }

    // 6. Calcular impuestos y total
    const taxRate = 0.19; // 19% IVA
    const taxAmount = (subtotal - discountAmount) * taxRate;
    const total = subtotal + taxAmount + shippingAmount - discountAmount;

    // 7. Crear el pedido
    const orderNumber = await generateOrderNumber();
    const order = await tx.order.create({
      data: {
        customerId: null, // Se puede implementar gestión de clientes después
        userId,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        subtotal,
        discountAmount,
        taxAmount,
        shippingAmount,
        total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod,
        couponId: coupon?.id,
        couponCode,
        shippingMethodId,
        notes,
        source,
        utm_source,
        utm_medium,
        utm_campaign,
        items: {
          createMany: {
            data: orderItems
          }
        },
        shippingAddress: {
          create: shippingAddress
        }
      },
      include: {
        items: {
          include: { product: true }
        },
        shippingAddress: true,
        coupon: true,
        shippingMethod: true
      }
    });

    // 8. Actualizar inventario - reservar stock
    for (const item of cart.items) {
      await inventoryService.updateInventory(
        item.productId,
        {
          quantity: item.quantity,
          reason: `Pedido #${orderNumber} - Stock reservado`,
          type: 'RESERVED'
        },
        userId || 'system'
      );
    }

    // 9. Actualizar contador de cupón
    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } }
      });
    }

    // 10. Crear tracking inicial
    await tx.orderTracking.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        description: 'Pedido creado y en espera de pago',
        createdBy: userId || 'system'
      }
    });

    // 11. Crear notificación
    await createOrderNotification(order.id, 'ORDER_CREATED', userId);

    // 12. Limpiar carrito
    await tx.cartItem.deleteMany({
      where: { cartId }
    });

    logger.info(`Pedido creado: ${orderNumber} por ${customerInfo.name} - Total: $${total}`);

    return {
      orderId: order.id,
      orderNumber,
      total,
      status: order.status,
      estimatedDelivery: shippingMethod ? 
        new Date(Date.now() + (shippingMethod.estimatedDays * 24 * 60 * 60 * 1000)) : 
        new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
    };
  });
};

export const updateOrderStatus = async (
  orderId: string, 
  statusData: z.infer<typeof updateOrderStatusSchema>,
  updatedBy?: string
) => {
  const validatedData = updateOrderStatusSchema.parse(statusData);
  const { status, paymentStatus, trackingNumber, estimatedDelivery, notes, location, carrier, trackingUrl } = validatedData;

  return await prisma.$transaction(async (tx) => {
    // Obtener pedido actual
    const currentOrder = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!currentOrder) {
      throw new NotFoundError('Pedido no encontrado');
    }

    // Actualizar pedido
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        paymentStatus: paymentStatus || currentOrder.paymentStatus,
        trackingNumber,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : currentOrder.estimatedDelivery,
        notes: notes || currentOrder.notes,
      }
    });

    // Crear registro de tracking
    await tx.orderTracking.create({
      data: {
        orderId,
        status,
        location,
        description: getStatusDescription(status),
        carrier,
        trackingUrl,
        estimatedArrival: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
        createdBy: updatedBy || 'system'
      }
    });

    // Manejar cambios de inventario según el estado
    if (status === 'PAID' && currentOrder.status === 'PENDING') {
      // Confirmar reserva cuando se paga
      await createOrderNotification(orderId, 'PAYMENT_RECEIVED');
    } else if (status === 'CONFIRMED' && currentOrder.paymentStatus === 'PAID') {
      // El pedido está confirmado y pagado
      await createOrderNotification(orderId, 'ORDER_CONFIRMED');
    } else if (status === 'SHIPPED') {
      // Convertir stock reservado a salida real
      for (const item of currentOrder.items) {
        await inventoryService.updateInventory(
          item.productId,
          {
            quantity: item.quantity,
            reason: `Pedido #${currentOrder.id} - Stock enviado`,
            type: 'OUT'
          },
          updatedBy || 'system'
        );

        // Liberar la reserva
        await inventoryService.updateInventory(
          item.productId,
          {
            quantity: item.quantity,
            reason: `Pedido #${currentOrder.id} - Liberación de reserva`,
            type: 'RELEASED'
          },
          updatedBy || 'system'
        );
      }
      await createOrderNotification(orderId, 'ORDER_SHIPPED');
    } else if (status === 'DELIVERED') {
      await createOrderNotification(orderId, 'ORDER_DELIVERED');
    } else if (status === 'CANCELLED') {
      // Liberar stock reservado
      for (const item of currentOrder.items) {
        await inventoryService.updateInventory(
          item.productId,
          {
            quantity: item.quantity,
            reason: `Pedido #${currentOrder.id} - Cancelación`,
            type: 'RELEASED'
          },
          updatedBy || 'system'
        );
      }
      await createOrderNotification(orderId, 'ORDER_CANCELLED');
    }

    logger.info(`Pedido ${orderId} actualizado: ${currentOrder.status} -> ${status}`);

    return updatedOrder;
  });
};

export const getOrderById = async (orderId: string): Promise<OrderSummary> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
            }
          }
        }
      },
      shippingAddress: true,
      tracking: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!order) {
    throw new NotFoundError('Pedido no encontrado');
  }

  return {
    id: order.id,
    orderNumber: order.id, // Se puede mejorar con un número más legible
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: Number(order.total),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    orderDate: order.orderDate,
    estimatedDelivery: order.estimatedDelivery || undefined,
    trackingNumber: order.trackingNumber || undefined,
    items: order.items.map(item => ({
      id: item.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: Number(item.price),
      subtotal: Number(item.price) * item.quantity,
    })),
    shippingAddress: order.shippingAddress ? {
      street: order.shippingAddress.street,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      zipCode: order.shippingAddress.zipCode,
      country: order.shippingAddress.country,
    } : {} as any,
    timeline: order.tracking.map(track => ({
      status: track.status,
      description: track.description,
      location: track.location || undefined,
      timestamp: track.createdAt,
      estimatedArrival: track.estimatedArrival || undefined,
      actualArrival: track.actualArrival || undefined,
    }))
  };
};

export const getAllOrders = async (query: any = {}) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    paymentStatus,
    sortBy = 'orderDate',
    sortOrder = 'desc'
  } = query;

  const where: any = {};

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerEmail: { contains: search, mode: 'insensitive' } },
      { id: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;

  const offset = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { name: true }
            }
          }
        },
        shippingAddress: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map(order => ({
      id: order.id,
      orderNumber: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      orderDate: order.orderDate,
      estimatedDelivery: order.estimatedDelivery,
      trackingNumber: order.trackingNumber,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

const generateOrderNumber = async (): Promise<string> => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  
  // Contar órdenes del día
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  
  const orderCount = await prisma.order.count({
    where: {
      orderDate: {
        gte: startOfDay,
        lt: endOfDay,
      }
    }
  });

  return `OG${year}${month}${day}${(orderCount + 1).toString().padStart(4, '0')}`;
};

const getStatusDescription = (status: string): string => {
  const descriptions: Record<string, string> = {
    'PENDING': 'Pedido creado y en espera de pago',
    'PAID': 'Pago recibido correctamente',
    'CONFIRMED': 'Pedido confirmado y en proceso',
    'PROCESSING': 'Preparando tu pedido',
    'PREPARING': 'Empacando productos',
    'SHIPPED': 'Pedido enviado',
    'IN_TRANSIT': 'En camino a tu dirección',
    'OUT_FOR_DELIVERY': 'En reparto, llegará hoy',
    'DELIVERED': 'Entregado exitosamente',
    'PARTIALLY_DELIVERED': 'Entrega parcial realizada',
    'CANCELLED': 'Pedido cancelado',
    'RETURNED': 'Pedido devuelto',
    'REFUNDED': 'Reembolso procesado',
  };
  return descriptions[status] || status;
};

const createOrderNotification = async (
  orderId: string,
  type: 'ORDER_CREATED' | 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED' | 'PAYMENT_RECEIVED' | 'PAYMENT_FAILED',
  userId?: string
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      customerName: true,
      customerEmail: true,
      total: true,
      userId: true,
    }
  });

  if (!order) return;

  const notificationData = getNotificationData(type, order.customerName, Number(order.total));

  await prisma.notification.create({
    data: {
      userId: userId || order.userId,
      orderId,
      type,
      channel: 'EMAIL',
      title: notificationData.title,
      message: notificationData.message,
      scheduledFor: new Date(),
      metadata: {
        customerEmail: order.customerEmail,
        orderTotal: order.total,
      }
    }
  });
};

const getNotificationData = (type: string, customerName: string, total: number) => {
  const data: Record<string, { title: string; message: string }> = {
    'ORDER_CREATED': {
      title: '¡Pedido creado exitosamente!',
      message: `Hola ${customerName}, hemos recibido tu pedido por $${total.toLocaleString()}. Te notificaremos cuando sea procesado.`
    },
    'PAYMENT_RECEIVED': {
      title: '¡Pago recibido!',
      message: `${customerName}, confirmamos el pago de tu pedido. Comenzaremos a prepararlo de inmediato.`
    },
    'ORDER_CONFIRMED': {
      title: '¡Pedido confirmado!',
      message: `${customerName}, tu pedido ha sido confirmado y está siendo preparado con mucho cuidado.`
    },
    'ORDER_SHIPPED': {
      title: '¡Tu pedido está en camino!',
      message: `${customerName}, tu pedido ha sido enviado. Pronto recibirás la información de seguimiento.`
    },
    'ORDER_DELIVERED': {
      title: '¡Pedido entregado!',
      message: `${customerName}, tu pedido ha sido entregado exitosamente. ¡Esperamos que disfrutes tus joyas!`
    },
    'ORDER_CANCELLED': {
      title: 'Pedido cancelado',
      message: `${customerName}, tu pedido ha sido cancelado. Si tienes preguntas, contactanos.`
    },
  };

  return data[type] || { title: 'Actualización de pedido', message: `${customerName}, hay una actualización en tu pedido.` };
};