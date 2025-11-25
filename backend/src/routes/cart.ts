import express from 'express';
import { z } from 'zod';
import * as cartService from '../services/cart.service';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';
import { BadRequestError, NotFoundError } from '../utils/errors';

const router = express.Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const addToCartSchema = z.object({
  productId: z.string({
    required_error: "ID de producto es requerido",
    invalid_type_error: "ID de producto debe ser un texto"
  }).min(1, "ID de producto no puede estar vacío"),
  quantity: z.number({
    required_error: "Cantidad es requerida",
    invalid_type_error: "Cantidad debe ser un número"
  }).int("Cantidad debe ser un número entero").min(1).max(10),
}).strict({
  message: "No se permiten campos adicionales"
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(10),
  size: z.string().optional(),
  customization: z.any().optional(),
});

const applyCouponSchema = z.object({
  couponCode: z.string().min(1),
});

// ============================================================================
// ROUTES
// ============================================================================

// GET /api/cart - Obtener carrito actual
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { sessionId, guestEmail } = req.query;

    const cart = await cartService.getOrCreateCart(
      userId,
      sessionId as string,
      guestEmail as string
    );

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    logger.error('Error getting cart:', error);
    next(error);
  }
});

// POST /api/cart/add - Agregar item al carrito
const cartIdentifiersSchema = z.object({
  sessionId: z.string().optional(),
  guestEmail: z.string().email().optional(),
});

router.post('/add', validate(addToCartSchema), async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    // Validar identificadores del carrito
    const queryParams = cartIdentifiersSchema.safeParse(req.query);
    if (!queryParams.success) {
      throw new BadRequestError('Se requiere sessionId o guestEmail');
    }
    
    const { sessionId, guestEmail } = queryParams.data;
    const itemData = req.body;
    
    // Log para debugging
    logger.debug('Adding to cart:', { 
      userId, 
      sessionId, 
      guestEmail, 
      itemData 
    });

    const cart = await cartService.addToCart(
      { userId, sessionId: sessionId as string, guestEmail: guestEmail as string },
      itemData
    );

    logger.info(`Item agregado al carrito: ${itemData.productId} x${itemData.quantity}`);

    res.json({
      success: true,
      message: 'Producto agregado al carrito',
      cart
    });
  } catch (error) {
    logger.error('Error adding to cart:', error);
    next(error);
  }
});

// PUT /api/cart/items/:itemId - Actualizar item del carrito
router.put('/items/:itemId', validate(updateCartItemSchema), async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const updateData = req.body;

    const cart = await cartService.updateCartItem(itemId, updateData);

    logger.info(`Cart item actualizado: ${itemId}`);

    res.json({
      success: true,
      message: 'Item actualizado',
      cart
    });
  } catch (error) {
    logger.error('Error updating cart item:', error);
    next(error);
  }
});

// DELETE /api/cart/items/:itemId - Eliminar item del carrito
router.delete('/items/:itemId', async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const cart = await cartService.removeFromCart(itemId);

    logger.info(`Cart item eliminado: ${itemId}`);

    res.json({
      success: true,
      message: 'Item eliminado del carrito',
      cart
    });
  } catch (error) {
    logger.error('Error removing cart item:', error);
    next(error);
  }
});

// DELETE /api/cart/:cartId/clear - Limpiar carrito
router.delete('/:cartId/clear', async (req, res, next) => {
  try {
    const { cartId } = req.params;

    const cart = await cartService.clearCart(cartId);

    logger.info(`Carrito limpiado: ${cartId}`);

    res.json({
      success: true,
      message: 'Carrito limpiado',
      cart
    });
  } catch (error) {
    logger.error('Error clearing cart:', error);
    next(error);
  }
});

// POST /api/cart/:cartId/coupon - Aplicar cupón
router.post('/:cartId/coupon', validate(applyCouponSchema), async (req, res, next) => {
  try {
    const { cartId } = req.params;
    const couponData = req.body;

    const result = await cartService.applyCoupon(cartId, couponData);

    logger.info(`Cupón aplicado: ${couponData.couponCode} al carrito ${cartId}`);

    res.json({
      success: true,
      message: 'Cupón aplicado exitosamente',
      coupon: result.coupon
    });
  } catch (error) {
    logger.error('Error applying coupon:', error);
    next(error);
  }
});

// POST /api/cart/cleanup - Limpiar carritos expirados (tarea automatizada)
router.post('/cleanup', authenticate, requireRole(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const deletedCount = await cartService.cleanupExpiredCarts();

    logger.info(`Limpieza automática: ${deletedCount} carritos eliminados`);

    res.json({
      success: true,
      message: `${deletedCount} carritos expirados eliminados`,
      deletedCount
    });
  } catch (error) {
    logger.error('Error cleaning up carts:', error);
    next(error);
  }
});

// POST /api/cart/verify-availability - Verificar disponibilidad de productos
router.post('/verify-availability', async (req, res, next) => {
  try {
    const { cartId, items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        error: 'Items requeridos para verificar disponibilidad'
      });
    }

    const unavailableItems: string[] = [];
    
    // Verificar cada item
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { inventory: true }
      });
      
      if (!product) {
        unavailableItems.push(`Producto no encontrado: ${item.productId}`);
        continue;
      }
      
      if (!product.inStock) {
        unavailableItems.push(`${product.name} - No disponible`);
        continue;
      }
      
      const availableQuantity = (product.inventory?.quantity || 0) - (product.inventory?.reservedQuantity || 0);
      if (availableQuantity < item.quantity) {
        unavailableItems.push(`${product.name} - Solo ${availableQuantity} disponibles (solicitaste ${item.quantity})`);
      }
    }
    
    res.json({
      available: unavailableItems.length === 0,
      unavailableItems
    });
    
  } catch (error) {
    logger.error('Error verificando disponibilidad:', error);
    next(error);
  }
});

export default router;