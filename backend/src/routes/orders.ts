
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { orderCreationLimiter, adminLimiter } from '../middleware/rateLimiting';
import { logger } from '../utils/logger';
import * as orderService from '../services/order.service';

const router = express.Router();

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const createOrderSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(2, 'El nombre del cliente es requerido'),
  customerEmail: z.string().email('Email inválido'),
  customerPhone: z.string().min(10, 'El teléfono debe tener al menos 10 caracteres'),
  customerDocument: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'ID de producto requerido'),
    quantity: z.number().int().positive('La cantidad debe ser un número positivo'),
    size: z.string().optional(),
    price: z.number().positive('El precio debe ser un número positivo')
  })).min(1, 'Al menos un producto es requerido'),
  paymentMethod: z.string().min(1, 'Método de pago requerido'),
  shippingAddress: z.object({
    street: z.string().min(1, 'La calle es requerida'),
    city: z.string().min(1, 'La ciudad es requerida'),
    state: z.string().min(1, 'El estado es requerido'),
    zipCode: z.string().min(1, 'El código postal es requerido'),
    country: z.string().default('Colombia'),
    instructions: z.string().optional()
  }),
  notes: z.string().optional(),
  // Campos adicionales del carrito
  cartId: z.string().optional(),
  subtotal: z.number().positive().optional(),
  taxAmount: z.number().min(0).optional(),
  shippingAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  total: z.number().positive(),
  couponCode: z.string().optional()
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  notes: z.string().optional()
});

const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional().transform(e => e === "" ? undefined : e),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  customerId: z.string().optional().transform(e => e === "" ? undefined : e),
  startDate: z.string().optional().transform(e => e ? new Date(e) : undefined),
  endDate: z.string().optional().transform(e => e ? new Date(e) : undefined),
  sortBy: z.enum(['orderDate', 'total', 'status', 'customerName']).default('orderDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// ============================================================================
// RUTAS PRIVADAS (ADMIN/MANAGER) - RUTAS ESPECÍFICAS PRIMERO
// ============================================================================

/**
 * @route   GET /api/orders/stats/overview
 * @desc    Obtener estadísticas de pedidos
 * @access  Private (Admin/Manager)
 */
router.get('/stats/overview',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const stats = await orderService.getOrderOverviewStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error obteniendo estadísticas de pedidos:', error);
      throw error;
    }
  }
);

// ============================================================================
// RUTAS PRIVADAS (ADMIN)
// ============================================================================

/**
 * @route   GET /api/orders
 * @desc    Obtener lista de pedidos con filtros y paginación
 * @access  Private (Admin)
 */
router.get('/',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateQuery(orderQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const query = orderQuerySchema.parse(req.query);
      const { orders, pagination } = await orderService.getAllOrders(query);
      res.json({ orders, pagination });
    } catch (error) {
      logger.error('Error obteniendo pedidos:', error);
      throw error;
    }
  }
);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Actualizar estado del pedido
 * @access  Private (Admin)
 */
router.put('/:id/status',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateParams(z.object({ id: z.string().cuid() })),
  validate(updateOrderStatusSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedOrder = await orderService.updateOrderStatus(id, updateData);
      logger.info(`Estado de pedido actualizado: ${id} a ${updateData.status}`);
      res.json({
        message: 'Estado del pedido actualizado exitosamente',
        order: updatedOrder,
      });
    } catch (error) {
      logger.error('Error actualizando estado del pedido:', error);
      throw error; // Re-lanzar el error para que sea capturado por el middleware
    }
  }
);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Cancelar/Eliminar pedido
 * @access  Private (Admin)
 */
router.delete('/:id',
  authenticate,
  authorize(['ADMIN']),
  validateParams(z.object({ id: z.string().cuid() })),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await orderService.deleteOrder(id);
      logger.info(`Pedido eliminado: ${id}`);
      res.status(200).json({ message: 'Pedido eliminado exitosamente' });
    } catch (error) {
      logger.error('Error eliminando pedido:', error);
      throw error;
    }
  }
);

// ============================================================================
// RUTAS PÚBLICAS
// ============================================================================

/**
 * @route   POST /api/orders
 * @desc    Crear nuevo pedido
 * @access  Public
 */
router.post('/',
  orderCreationLimiter,
  validate(createOrderSchema),
  async (req: Request, res: Response) => {
    try {
      const orderData = req.body;
      const order = await orderService.createOrder(orderData);
      logger.info(`Pedido creado: ${order.id} por ${order.customerEmail}`);
      res.status(201).json({
        message: 'Pedido creado exitosamente',
        order,
      });
    } catch (error) {
      logger.error('Error creando pedido:', error);
      throw error; // Re-lanzar el error para que sea capturado por el middleware
    }
  }
);

/**
 * @route   GET /api/orders/:id
 * @desc    Obtener pedido por ID (público con limitaciones)
 * @access  Public
 */
router.get('/:id',
  validateParams(z.object({ id: z.string().cuid() })),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id, true); // Acceso público
      res.json(order);
    } catch (error) {
      logger.error('Error obteniendo pedido:', error);
      throw error; // Re-lanzar el error para que sea capturado por el middleware
    }
  }
);

/**
 * @route   GET /api/orders/my-orders
 * @desc    Obtener pedidos del usuario autenticado
 * @access  Private
 */
router.get('/my-orders',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      // El middleware authenticate añade el usuario a req.user
      const userEmail = (req as any).user?.email;

      if (!userEmail) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const orders = await orderService.getOrdersByCustomer(userEmail);
      res.json(orders);
    } catch (error) {
      logger.error('Error obteniendo mis pedidos:', error);
      throw error;
    }
  }
);

export default router;
