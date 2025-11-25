import express from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = express.Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING']),
  value: z.number().min(0),
  minimumAmount: z.number().min(0).optional(),
  maximumDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  applicableCategories: z.array(z.string()).optional(),
});

const updateCouponSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED']).optional(),
  value: z.number().min(0).optional(),
  minimumAmount: z.number().min(0).optional(),
  maximumDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  applicableCategories: z.array(z.string()).optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

// GET /api/coupons - Listar cupones
router.get('/', authenticate, requireRole(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      type,
    } = req.query;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { code: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (status) where.status = status;
    if (type) where.type = type;

    const offset = (Number(page) - 1) * Number(limit);

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: Number(limit),
        include: {
          orders: {
            select: { id: true },
          },
        },
      }),
      prisma.coupon.count({ where }),
    ]);

    const couponsWithStats = coupons.map(coupon => ({
      ...coupon,
      ordersUsed: coupon.orders.length,
    }));

    res.json({
      success: true,
      coupons: couponsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Error getting coupons:', error);
    next(error);
  }
});

// POST /api/coupons - Crear cupón
router.post('/', authenticate, requireRole(['ADMIN', 'MANAGER']), validate(createCouponSchema), async (req, res, next) => {
  try {
    const couponData = req.body;

    // Verificar que el código no exista
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: couponData.code.toUpperCase() },
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un cupón con este código',
      });
    }

    const coupon = await prisma.coupon.create({
      data: {
        ...couponData,
        code: couponData.code.toUpperCase(),
        validFrom: new Date(couponData.validFrom),
        validUntil: new Date(couponData.validUntil),
        status: 'ACTIVE',
      },
    });

    logger.info(`Cupón creado: ${coupon.code} por usuario ${req.user?.id}`);

    res.status(201).json({
      success: true,
      message: 'Cupón creado exitosamente',
      coupon,
    });
  } catch (error) {
    logger.error('Error creating coupon:', error);
    next(error);
  }
});

// GET /api/coupons/:id - Obtener cupón por ID
router.get('/:id', authenticate, requireRole(['ADMIN', 'MANAGER']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            id: true,
            customerName: true,
            total: true,
            orderDate: true,
          },
        },
      },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Cupón no encontrado',
      });
    }

    res.json({
      success: true,
      coupon: {
        ...coupon,
        ordersUsed: coupon.orders.length,
      },
    });
  } catch (error) {
    logger.error('Error getting coupon:', error);
    next(error);
  }
});

// PUT /api/coupons/:id - Actualizar cupón
router.put('/:id', authenticate, requireRole(['ADMIN', 'MANAGER']), validate(updateCouponSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        error: 'Cupón no encontrado',
      });
    }

    // Procesar fechas si se proporcionan
    const processedData = { ...updateData };
    if (updateData.validFrom) {
      processedData.validFrom = new Date(updateData.validFrom);
    }
    if (updateData.validUntil) {
      processedData.validUntil = new Date(updateData.validUntil);
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: processedData,
    });

    logger.info(`Cupón actualizado: ${updatedCoupon.code} por usuario ${req.user?.id}`);

    res.json({
      success: true,
      message: 'Cupón actualizado exitosamente',
      coupon: updatedCoupon,
    });
  } catch (error) {
    logger.error('Error updating coupon:', error);
    next(error);
  }
});

// DELETE /api/coupons/:id - Eliminar cupón
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        orders: { select: { id: true } },
      },
    });

    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        error: 'Cupón no encontrado',
      });
    }

    if (existingCoupon.orders.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar un cupón que ya ha sido usado en pedidos',
      });
    }

    await prisma.coupon.delete({
      where: { id },
    });

    logger.info(`Cupón eliminado: ${existingCoupon.code} por usuario ${req.user?.id}`);

    res.json({
      success: true,
      message: 'Cupón eliminado exitosamente',
    });
  } catch (error) {
    logger.error('Error deleting coupon:', error);
    next(error);
  }
});

// POST /api/coupons/validate - Validar cupón (público)
router.post('/validate', async (req, res, next) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Código de cupón requerido',
      });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Cupón no válido',
      });
    }

    // Validaciones
    const now = new Date();
    const errors = [];

    if (coupon.status !== 'ACTIVE') {
      errors.push('El cupón no está activo');
    }

    if (now < coupon.validFrom) {
      errors.push('El cupón aún no es válido');
    }

    if (now > coupon.validUntil) {
      errors.push('El cupón ha expirado');
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      errors.push('El cupón ha alcanzado su límite de uso');
    }

    if (coupon.minimumAmount && cartTotal < Number(coupon.minimumAmount)) {
      errors.push(`El monto mínimo para este cupón es $${coupon.minimumAmount.toLocaleString()}`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors[0], // Mostrar el primer error
      });
    }

    // Calcular descuento
    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = cartTotal * (Number(coupon.value) / 100);
      if (coupon.maximumDiscount && discountAmount > Number(coupon.maximumDiscount)) {
        discountAmount = Number(coupon.maximumDiscount);
      }
    } else if (coupon.type === 'FIXED') {
      discountAmount = Math.min(Number(coupon.value), cartTotal);
    }

    res.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        discountAmount,
        freeShipping: coupon.type === 'FREE_SHIPPING',
      },
    });
  } catch (error) {
    logger.error('Error validating coupon:', error);
    next(error);
  }
});

export default router;