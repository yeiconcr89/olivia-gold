import express, { Request, Response } from 'express'; // Importa Request y Response
import { authenticate, authorize } from '../middleware/auth'; // No importes AuthRequest
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { logger } from '../utils/logger';
import { z } from 'zod';
import * as inventoryService from '../services/inventory.service';

const router = express.Router();

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const updateInventorySchema = z.object({
  quantity: z.number().int().min(0),
  reason: z.string(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RESERVED', 'RELEASED']),
});

const inventoryParamsSchema = z.object({
  productId: z.string(),
});

const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional().transform(e => e === "" ? undefined : e),
  lowStock: z.preprocess(val => val === '' ? undefined : val, z.coerce.boolean().optional()),
  outOfStock: z.preprocess(val => val === '' ? undefined : val, z.coerce.boolean().optional()),
  category: z.string().optional().transform(e => e === "" ? undefined : e),
  sortBy: z.enum(['name', 'quantity', 'category', 'lastUpdated']).default('lastUpdated'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const movementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  productId: z.string().optional(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RESERVED', 'RELEASED']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['createdAt', 'quantity', 'type']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// RUTAS PRIVADAS (ADMIN/MANAGER) - RUTAS ESPECÍFICAS PRIMERO
// ============================================================================

/**
 * @route   GET /api/inventory/movements/history
 * @desc    Obtener movimientos de inventario
 * @access  Private (Admin/Manager)
 */
// RUTAS ESPECÍFICAS PRIMERO
router.get('/movements/history', 
  authenticate, 
  authorize(['ADMIN', 'MANAGER']), 
  validateQuery(movementQuerySchema), 
  async (req: Request, res: Response) => { // Usa Request y Response
    try {
      const query = movementQuerySchema.parse(req.query);
      const result = await inventoryService.getInventoryMovements(query);
      res.json(result);
    } catch (error) {
      logger.error('Error obteniendo movimientos de inventario:', error);
      throw error;
    }
  }
);

/**
 * @route   GET /api/inventory/stats/overview
 * @desc    Obtener estadísticas de inventario
 * @access  Private (Admin/Manager)
 */
router.get('/stats/overview', 
  authenticate, 
  authorize(['ADMIN', 'MANAGER']), 
  async (req: Request, res: Response) => { // Usa Request y Response
    try {
      const stats = await inventoryService.getInventoryOverviewStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error obteniendo estadísticas de inventario:', error);
      throw error;
    }
  }
);

// RUTAS GENERALES DESPUÉS
router.get('/', 
  authenticate, 
  authorize(['ADMIN', 'MANAGER']), 
  validateQuery(inventoryQuerySchema), 
  async (req: Request, res: Response) => { // Usa Request y Response
    try {
      const query = inventoryQuerySchema.parse(req.query);
      const result = await inventoryService.getAllInventory(query);
      res.json(result);
    } catch (error) {
      logger.error('Error obteniendo inventario:', error);
      throw error;
    }
  }
);

/**
 * @route   GET /api/inventory/:productId
 * @desc    Obtener inventario de un producto específico
 * @access  Private (Admin/Manager)
 */
router.get('/:productId', 
  authenticate, 
  authorize(['ADMIN', 'MANAGER']), 
  validateParams(inventoryParamsSchema), 
  async (req: Request, res: Response) => { // Usa Request y Response
    try {
      const { productId } = req.params;
      const inventory = await inventoryService.getInventoryByProductId(productId);
      res.json(inventory);
    } catch (error) {
      logger.error('Error obteniendo inventario del producto:', error);
      throw error;
    }
  }
);

/**
 * @route   PUT /api/inventory/:productId
 * @desc    Actualizar inventario de un producto
 * @access  Private (Admin/Manager)
 */
router.put('/:productId', 
  authenticate, 
  authorize(['ADMIN', 'MANAGER']), 
  validateParams(inventoryParamsSchema),
  validate(updateInventorySchema), 
  async (req: Request, res: Response) => { // Usa Request y Response
    try {
      const { productId } = req.params;
      const updateData = req.body;
      
      const updatedInventory = await inventoryService.updateInventory(
        productId, 
        updateData, 
        req.user!.id
      );
      
      res.json({
        message: 'Inventario actualizado exitosamente',
        inventory: updatedInventory,
      });
    } catch (error) {
      logger.error('Error actualizando inventario:', error);
      throw error;
    }
  }
);

export default router;