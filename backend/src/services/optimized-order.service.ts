import { prisma } from '../config/database-optimized';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';

// ============================================================================
// OPTIMIZED ORDER QUERIES - Solving N+1 Problems
// ============================================================================

/**
 * Optimized order listing with selective includes
 */
export const getOrdersOptimized = async (options: {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  customerEmail?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'orderDate' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}) => {
  const {
    page = 1,
    limit = 20,
    status,
    paymentStatus,
    customerEmail,
    dateFrom,
    dateTo,
    sortBy = 'orderDate',
    sortOrder = 'desc',
  } = options;

  // Build where clause
  const where: any = {};
  
  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (customerEmail) {
    where.customerEmail = { contains: customerEmail, mode: 'insensitive' };
  }
  
  if (dateFrom || dateTo) {
    where.orderDate = {};
    if (dateFrom) where.orderDate.gte = dateFrom;
    if (dateTo) where.orderDate.lte = dateTo;
  }

  const offset = (page - 1) * limit;

  // OPTIMIZED: Use separate queries to avoid N+1 on order items
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        status: true,
        paymentStatus: true,
        total: true,
        orderDate: true,
        estimatedDelivery: true,
        trackingNumber: true,
        // Get item count without loading all items
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const result = {
    orders: orders.map(order => ({
      id: order.id,
      orderNumber: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      itemCount: order._count.items,
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

  return result;
};

/**
 * Optimized single order query with controlled includes
 */
export const getOrderByIdOptimized = async (orderId: string) => {
  // OPTIMIZED: Use separate queries instead of deep nested includes
  const [order, orderItems, shippingAddress, tracking] = await Promise.all([
    // Main order data
    prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        total: true,
        subtotal: true,
        tax: true,
        shippingCost: true,
        discount: true,
        orderDate: true,
        estimatedDelivery: true,
        trackingNumber: true,
        notes: true,
        source: true,
        priority: true,
      },
    }),
    
    // Order items with product info
    prisma.orderItem.findMany({
      where: { orderId },
      select: {
        id: true,
        quantity: true,
        price: true,
        size: true,
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            images: {
              select: {
                url: true,
                altText: true,
              },
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    }),
    
    // Shipping address
    prisma.shippingAddress.findUnique({
      where: { orderId },
      select: {
        street: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
      },
    }),
    
    // Tracking history
    prisma.orderTracking.findMany({
      where: { orderId },
      select: {
        id: true,
        status: true,
        description: true,
        location: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  if (!order) {
    throw new NotFoundError('Pedido no encontrado');
  }

  return {
    id: order.id,
    orderNumber: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    tax: Number(order.tax || 0),
    shippingCost: Number(order.shippingCost || 0),
    discount: Number(order.discount || 0),
    orderDate: order.orderDate,
    estimatedDelivery: order.estimatedDelivery,
    trackingNumber: order.trackingNumber,
    notes: order.notes,
    source: order.source,
    priority: order.priority,
    items: orderItems.map(item => ({
      id: item.id,
      productId: item.product.id,
      productName: item.product.name,
      category: item.product.category,
      quantity: item.quantity,
      price: Number(item.price),
      size: item.size,
      total: Number(item.price) * item.quantity,
      productImage: item.product.images[0]?.url || null,
    })),
    shippingAddress,
    tracking: tracking.map(t => ({
      id: t.id,
      status: t.status,
      description: t.description,
      location: t.location,
      timestamp: t.createdAt,
    })),
  };
};

/**
 * Optimized customer orders query
 */
export const getCustomerOrdersOptimized = async (
  customerEmail: string,
  options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}
) => {
  const { page = 1, limit = 10, status } = options;
  
  const where: any = { customerEmail };
  if (status) where.status = status;

  const offset = (page - 1) * limit;

  // OPTIMIZED: Minimal data for customer order history
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        total: true,
        orderDate: true,
        estimatedDelivery: true,
        trackingNumber: true,
        _count: {
          select: {
            items: true,
          },
        },
        // Get first item for preview
        items: {
          select: {
            product: {
              select: {
                name: true,
                images: {
                  select: {
                    url: true,
                  },
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { orderDate: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map(order => ({
      id: order.id,
      orderNumber: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      itemCount: order._count.items,
      orderDate: order.orderDate,
      estimatedDelivery: order.estimatedDelivery,
      trackingNumber: order.trackingNumber,
      firstItemName: order.items[0]?.product.name || '',
      firstItemImage: order.items[0]?.product.images[0]?.url || null,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Optimized order statistics
 */
export const getOrderStatsOptimized = async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
  }

  // OPTIMIZED: Use aggregations instead of loading all orders
  const [orderStats, revenueStats, statusStats] = await Promise.all([
    // Basic order counts
    prisma.order.aggregate({
      where: {
        orderDate: { gte: startDate },
      },
      _count: true,
      _avg: { total: true },
      _sum: { total: true },
    }),
    
    // Revenue by payment status
    prisma.order.groupBy({
      by: ['paymentStatus'],
      where: {
        orderDate: { gte: startDate },
      },
      _count: true,
      _sum: { total: true },
    }),
    
    // Orders by status
    prisma.order.groupBy({
      by: ['status'],
      where: {
        orderDate: { gte: startDate },
      },
      _count: true,
    }),
  ]);

  return {
    period,
    totalOrders: orderStats._count,
    totalRevenue: Number(orderStats._sum.total || 0),
    averageOrderValue: Number(orderStats._avg.total || 0),
    revenueByPaymentStatus: revenueStats.map(stat => ({
      paymentStatus: stat.paymentStatus,
      count: stat._count,
      revenue: Number(stat._sum.total || 0),
    })),
    ordersByStatus: statusStats.map(stat => ({
      status: stat.status,
      count: stat._count,
    })),
  };
};

/**
 * Optimized recent orders for dashboard
 */
export const getRecentOrdersOptimized = async (limit: number = 10) => {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      customerName: true,
      customerEmail: true,
      status: true,
      total: true,
      orderDate: true,
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: { orderDate: 'desc' },
    take: limit,
  });

  return orders.map(order => ({
    id: order.id,
    orderNumber: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    status: order.status,
    total: Number(order.total),
    itemCount: order._count.items,
    orderDate: order.orderDate,
  }));
};

export {
  // Re-export original functions for backward compatibility
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderById,
  getOrders,
} from './advanced-order.service';