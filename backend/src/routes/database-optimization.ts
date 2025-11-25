import express from 'express';
import { z } from 'zod';
import { databaseOptimizationService } from '../services/database-optimization.service';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/database/health
 * Get comprehensive database health metrics
 */
router.get('/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const health = await databaseOptimizationService.getDatabaseHealth();
    
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    logger.error('Error getting database health:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener salud de la base de datos',
    });
  }
});

/**
 * GET /api/database/slow-queries
 * Get slow query statistics
 */
router.get('/slow-queries', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limitSchema = z.object({
      limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
    });
    
    const { limit } = limitSchema.parse(req.query);
    
    const slowQueries = await databaseOptimizationService.getSlowQueries(limit);
    
    res.json({
      success: true,
      data: {
        queries: slowQueries,
        count: slowQueries.length,
      },
    });
  } catch (error) {
    logger.error('Error getting slow queries:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener consultas lentas',
    });
  }
});

/**
 * GET /api/database/indexes
 * Get index usage statistics
 */
router.get('/indexes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const indexStats = await databaseOptimizationService.getIndexUsageStats();
    
    // Group by usage level
    const grouped = indexStats.reduce((acc, index) => {
      if (!acc[index.usageLevel]) {
        acc[index.usageLevel] = [];
      }
      acc[index.usageLevel].push(index);
      return acc;
    }, {} as Record<string, typeof indexStats>);
    
    res.json({
      success: true,
      data: {
        indexes: indexStats,
        summary: {
          total: indexStats.length,
          unused: grouped.UNUSED?.length || 0,
          lowUsage: grouped.LOW_USAGE?.length || 0,
          mediumUsage: grouped.MEDIUM_USAGE?.length || 0,
          highUsage: grouped.HIGH_USAGE?.length || 0,
        },
        grouped,
      },
    });
  } catch (error) {
    logger.error('Error getting index stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de índices',
    });
  }
});

/**
 * GET /api/database/tables
 * Get table size statistics
 */
router.get('/tables', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tableSizes = await databaseOptimizationService.getTableSizeStats();
    
    res.json({
      success: true,
      data: {
        tables: tableSizes,
        summary: {
          totalTables: tableSizes.length,
          largestTable: tableSizes[0]?.tablename || 'unknown',
          largestSize: tableSizes[0]?.totalSize || '0 bytes',
          totalSize: tableSizes.reduce((sum, table) => sum + table.sizeBytes, 0),
        },
      },
    });
  } catch (error) {
    logger.error('Error getting table sizes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tamaños de tablas',
    });
  }
});

/**
 * GET /api/database/connections
 * Get database connection statistics
 */
router.get('/connections', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const connectionStats = await databaseOptimizationService.getConnectionStats();
    
    res.json({
      success: true,
      data: connectionStats,
    });
  } catch (error) {
    logger.error('Error getting connection stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de conexiones',
    });
  }
});

/**
 * GET /api/database/locks
 * Get database lock statistics
 */
router.get('/locks', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const lockStats = await databaseOptimizationService.getLockStats();
    
    res.json({
      success: true,
      data: {
        locks: lockStats,
        summary: {
          totalLocks: lockStats.reduce((sum: number, lock: any) => sum + parseInt(lock.count), 0),
        },
      },
    });
  } catch (error) {
    logger.error('Error getting lock stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de bloqueos',
    });
  }
});

/**
 * POST /api/database/analyze
 * Analyze table statistics
 */
router.post('/analyze', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const analyzeSchema = z.object({
      tableName: z.string().optional(),
    });
    
    const { tableName } = analyzeSchema.parse(req.body);
    
    const result = await databaseOptimizationService.analyzeTableStats(tableName);
    
    logger.info(`Database analysis performed by admin ${req.user!.email}${tableName ? ` for table ${tableName}` : ''}`);
    
    res.json({
      success: true,
      data: result,
      message: tableName 
        ? `Tabla ${tableName} analizada exitosamente`
        : 'Todas las tablas analizadas exitosamente',
    });
  } catch (error) {
    logger.error('Error analyzing database:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al analizar la base de datos',
    });
  }
});

/**
 * POST /api/database/maintenance
 * Perform database maintenance
 */
router.post('/maintenance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const maintenanceSchema = z.object({
      vacuum: z.boolean().optional().default(true),
      analyze: z.boolean().optional().default(true),
      reindex: z.boolean().optional().default(false),
      tables: z.array(z.string()).optional(),
    });
    
    const options = maintenanceSchema.parse(req.body);
    
    const result = await databaseOptimizationService.performMaintenance(options);
    
    logger.info(`Database maintenance performed by admin ${req.user!.email}`, options);
    
    res.json({
      success: true,
      data: result,
      message: 'Mantenimiento de base de datos completado exitosamente',
    });
  } catch (error) {
    logger.error('Error performing database maintenance:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al realizar mantenimiento de base de datos',
    });
  }
});

/**
 * POST /api/database/query-plan
 * Get query execution plan
 */
router.post('/query-plan', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const querySchema = z.object({
      query: z.string().min(1, 'Query is required'),
    });
    
    const { query } = querySchema.parse(req.body);
    
    // Security: Only allow SELECT queries
    if (!query.trim().toLowerCase().startsWith('select')) {
      return res.status(400).json({
        success: false,
        message: 'Solo se permiten consultas SELECT',
      });
    }
    
    const plan = await databaseOptimizationService.getQueryPlan(query);
    
    logger.info(`Query plan requested by admin ${req.user!.email} for query: ${query.substring(0, 100)}...`);
    
    res.json({
      success: true,
      data: {
        query,
        plan,
      },
    });
  } catch (error) {
    logger.error('Error getting query plan:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener plan de consulta',
    });
  }
});

/**
 * POST /api/database/reset-stats
 * Reset database statistics
 */
router.post('/reset-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await databaseOptimizationService.resetStats();
    
    logger.info(`Database statistics reset by admin ${req.user!.email}`);
    
    res.json({
      success: true,
      data: result,
      message: 'Estadísticas de base de datos reiniciadas exitosamente',
    });
  } catch (error) {
    logger.error('Error resetting database stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reiniciar estadísticas de base de datos',
    });
  }
});

export default router;