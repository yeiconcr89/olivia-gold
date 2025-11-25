import express from 'express';
import { z } from 'zod';
import {
  getProductInventoryMovements,
  getAllInventoryMovements,
  getInventoryMovementStats,
  getRecentInventoryMovements,
  exportInventoryMovements,
} from '../services/inventory-movements.service';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
});

const movementFiltersSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RESERVED', 'RELEASED']).optional(),
  dateFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dateTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
  createdBy: z.string().optional(),
  reason: z.string().optional(),
});

/**
 * GET /api/inventory-movements/product/:productId
 * Get paginated inventory movements for a specific product
 */
router.get('/product/:productId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const paginationData = paginationSchema.parse(req.query);
    const filtersData = movementFiltersSchema.parse(req.query);
    
    const result = await getProductInventoryMovements(productId, {
      ...paginationData,
      ...filtersData,
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting product inventory movements:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos de inventario del producto',
    });
  }
});

/**
 * GET /api/inventory-movements
 * Get all inventory movements (admin only) with pagination and filters
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const paginationData = paginationSchema.parse(req.query);
    const filtersData = movementFiltersSchema.parse(req.query);
    
    const additionalFilters = z.object({
      search: z.string().optional(),
      sortBy: z.enum(['createdAt', 'quantity', 'type']).optional().default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    }).parse(req.query);
    
    const result = await getAllInventoryMovements({
      ...paginationData,
      ...filtersData,
      ...additionalFilters,
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting all inventory movements:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos de inventario',
    });
  }
});

/**
 * GET /api/inventory-movements/stats
 * Get inventory movement statistics
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const statsSchema = z.object({
      productId: z.string().optional(),
      timeframe: z.enum(['day', 'week', 'month', 'year']).optional().default('month'),
    });
    
    const { productId, timeframe } = statsSchema.parse(req.query);
    
    const stats = await getInventoryMovementStats(productId, timeframe);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting inventory movement stats:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de movimientos',
    });
  }
});

/**
 * GET /api/inventory-movements/recent
 * Get recent inventory movements for dashboard
 */
router.get('/recent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limitSchema = z.object({
      limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    });
    
    const { limit } = limitSchema.parse(req.query);
    
    const movements = await getRecentInventoryMovements(limit);
    
    res.json({
      success: true,
      data: movements,
    });
  } catch (error) {
    logger.error('Error getting recent inventory movements:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos recientes',
    });
  }
});

/**
 * GET /api/inventory-movements/export
 * Export inventory movements to CSV
 */
router.get('/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const exportSchema = z.object({
      productId: z.string().optional(),
      ...movementFiltersSchema.shape,
    });
    
    const filters = exportSchema.parse(req.query);
    
    const exportData = await exportInventoryMovements(filters);
    
    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-movements.csv');
    
    // Write CSV content
    const csvContent = [
      exportData.headers.join(','),
      ...exportData.rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
    
    logger.info(`Inventory movements exported by admin ${req.user!.email} - ${exportData.totalRecords} records`);
    
    res.send(csvContent);
  } catch (error) {
    logger.error('Error exporting inventory movements:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al exportar movimientos de inventario',
    });
  }
});

export default router;