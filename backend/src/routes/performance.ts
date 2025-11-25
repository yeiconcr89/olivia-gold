import express from 'express';
import { queryPerformanceService } from '../services/query-performance.service';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/performance/stats
 * Get query performance statistics
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const timeWindow = req.query.timeWindow ? parseInt(req.query.timeWindow as string) : 3600000; // 1 hour default
    const stats = queryPerformanceService.getPerformanceStats(timeWindow);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get performance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de performance',
    });
  }
});

/**
 * GET /api/performance/database
 * Get database performance analysis
 */
router.get('/database', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const analysis = await queryPerformanceService.analyzeDatabasePerformance();
    
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    logger.error('Failed to analyze database performance:', error);
    res.status(500).json({
      success: false,
      message: 'Error al analizar performance de base de datos',
    });
  }
});

/**
 * GET /api/performance/recommendations
 * Get optimization recommendations
 */
router.get('/recommendations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const recommendations = queryPerformanceService.getOptimizationRecommendations();
    
    res.json({
      success: true,
      data: {
        recommendations,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error('Failed to get recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recomendaciones',
    });
  }
});

/**
 * DELETE /api/performance/metrics
 * Clear performance metrics
 */
router.delete('/metrics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    queryPerformanceService.clearMetrics();
    
    logger.info(`Performance metrics cleared by admin user ${req.user?.email}`);
    
    res.json({
      success: true,
      message: 'Métricas de performance limpiadas exitosamente',
    });
  } catch (error) {
    logger.error('Failed to clear metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar métricas',
    });
  }
});

/**
 * GET /api/performance/health
 * Performance health check
 */
router.get('/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = queryPerformanceService.getPerformanceStats(300000); // 5 minutes
    
    const health = {
      status: 'healthy',
      issues: [] as string[],
      metrics: {
        averageExecutionTime: stats.averageExecutionTime,
        cacheHitRate: stats.cacheHitRate,
        slowQueries: stats.slowQueries,
        totalQueries: stats.totalQueries,
      },
    };

    // Check for performance issues
    if (stats.averageExecutionTime > 1000) {
      health.status = 'warning';
      health.issues.push('High average query execution time');
    }

    if (stats.cacheHitRate < 30) {
      health.status = 'warning';
      health.issues.push('Low cache hit rate');
    }

    if (stats.slowQueries > stats.totalQueries * 0.2) {
      health.status = 'critical';
      health.issues.push('High percentage of slow queries');
    }

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    logger.error('Failed to get performance health:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar salud de performance',
    });
  }
});

export default router;