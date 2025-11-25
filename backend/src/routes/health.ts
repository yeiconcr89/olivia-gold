import express from 'express';
import { checkDatabaseHealth, getDatabaseMetrics } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint con métricas de base de datos
 */
router.get('/', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const metrics = getDatabaseMetrics();
    
    const healthStatus = {
      status: dbHealth.status === 'healthy' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
      metrics: {
        ...metrics,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
        process: {
          pid: process.pid,
          version: process.version,
          platform: process.platform,
        },
      },
    };

    // Log health check si hay problemas
    if (dbHealth.status !== 'healthy') {
      logger.warn('Health check failed', healthStatus);
    }

    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/health/database
 * Health check específico de base de datos
 */
router.get('/database', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(dbHealth);
  } catch (error) {
    logger.error('Database health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/health/metrics
 * Métricas de performance de la aplicación
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = getDatabaseMetrics();
    
    const fullMetrics = {
      database: metrics,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform,
        cpuUsage: process.cpuUsage(),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(fullMetrics);
  } catch (error) {
    logger.error('Metrics error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;