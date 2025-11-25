import express from 'express';
import { z } from 'zod';
import * as advancedOrderService from '../services/advanced-order.service';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = express.Router();

// ============================================================================
// VALIDATION SCHEMAS
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

const orderQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  sortBy: z.string().default('orderDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// ROUTES
// ============================================================================

// POST /api/orders/advanced/create-from-cart - Crear pedido desde carrito
router.post('/create-from-cart', validate(createOrderFromCartSchema), async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const orderData = req.body;

    const result = await advancedOrderService.createOrderFromCart(orderData, userId);

    logger.info(`Pedido avanzado creado: ${result.orderNumber} por ${orderData.customerInfo.name}`);

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      order: result
    });
  } catch (error) {
    logger.error('Error creating advanced order:', error);
    next(error);
  }
});

// PUT /api/orders/advanced/:orderId/status - Actualizar estado del pedido
router.put('/:orderId/status', 
  authenticate, 
  requireRole(['ADMIN', 'MANAGER']), 
  validate(updateOrderStatusSchema), 
  async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const statusData = req.body;

    const updatedOrder = await advancedOrderService.updateOrderStatus(
      orderId, 
      statusData, 
      userId
    );

    logger.info(`Estado de pedido actualizado: ${orderId} -> ${statusData.status}`);

    res.json({
      success: true,
      message: 'Estado del pedido actualizado',
      order: updatedOrder
    });
  } catch (error) {
    logger.error('Error updating order status:', error);
    next(error);
  }
});

// GET /api/orders/advanced/:orderId - Obtener pedido por ID con detalles completos
router.get('/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await advancedOrderService.getOrderById(orderId);

    res.json({
      success: true,
      order
    });
  } catch (error) {
    logger.error('Error getting order details:', error);
    next(error);
  }
});

// GET /api/orders/advanced - Obtener todos los pedidos con paginación y filtros
router.get('/', validate(orderQuerySchema, 'query'), async (req, res, next) => {
  try {
    const query = req.query;

    const result = await advancedOrderService.getAllOrders(query);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error getting orders:', error);
    next(error);
  }
});

// GET /api/orders/advanced/tracking/:orderId - Obtener tracking completo del pedido
router.get('/tracking/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await advancedOrderService.getOrderById(orderId);

    res.json({
      success: true,
      tracking: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        timeline: order.timeline,
        estimatedDelivery: order.estimatedDelivery,
        trackingNumber: order.trackingNumber,
        shippingAddress: order.shippingAddress
      }
    });
  } catch (error) {
    logger.error('Error getting order tracking:', error);
    next(error);
  }
});

// GET /api/orders/advanced/stats/dashboard - Estadísticas avanzadas para dashboard
router.get('/stats/dashboard', authenticate, requireRole(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    // Obtener estadísticas generales
    const allOrders = await advancedOrderService.getAllOrders({ limit: 1000 });
    
    const stats = {
      totalOrders: allOrders.pagination.total,
      totalRevenue: allOrders.orders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: allOrders.orders.length > 0 
        ? allOrders.orders.reduce((sum, order) => sum + order.total, 0) / allOrders.orders.length 
        : 0,
      statusDistribution: allOrders.orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      paymentStatusDistribution: allOrders.orders.reduce((acc, order) => {
        acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentOrders: allOrders.orders.slice(0, 5).map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
        status: order.status,
        orderDate: order.orderDate
      }))
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    next(error);
  }
});

export default router;