import express from 'express';
import { cacheService } from '../services/cache.service';
import { redisService } from '../services/redis.service';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// ============================================================================
// CACHE MONITORING ROUTES (ADMIN ONLY)
// ============================================================================

// Get cache statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [cacheStats, redisStats] = await Promise.all([
      cacheService.getStats(),
      cacheService.getRedisStats()
    ]);

    res.json({
      cache: cacheStats,
      redis: redisStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas de cache' });
  }
});

// Cache health check
router.get('/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const health = await cacheService.healthCheck();
    res.json(health);
  } catch (error) {
    logger.error('Error checking cache health:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Error verificando salud del cache' 
    });
  }
});

// Clear all cache (DANGEROUS - admin only)
router.delete('/clear', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const success = await cacheService.clear();
    
    if (success) {
      logger.info(`Cache cleared by admin user ${req.user?.email}`);
      res.json({ 
        success: true, 
        message: 'Cache limpiado completamente' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Error limpiando cache' 
      });
    }
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error limpiando cache' 
    });
  }
});

// Clear cache by tag
router.delete('/tag/:tag', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { tag } = req.params;
    const success = await cacheService.invalidateByTag(tag);
    
    if (success) {
      logger.info(`Cache tag '${tag}' invalidated by admin user ${req.user?.email}`);
      res.json({ 
        success: true, 
        message: `Cache con tag '${tag}' invalidado` 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: `Error invalidando cache con tag '${tag}'` 
      });
    }
  } catch (error) {
    logger.error(`Error invalidating cache tag '${req.params.tag}':`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Error invalidando cache por tag' 
    });
  }
});

// Clear cache by pattern
router.delete('/pattern/:pattern', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { pattern } = req.params;
    const decodedPattern = decodeURIComponent(pattern);
    const success = await cacheService.invalidateByPattern(decodedPattern);
    
    if (success) {
      logger.info(`Cache pattern '${decodedPattern}' invalidated by admin user ${req.user?.email}`);
      res.json({ 
        success: true, 
        message: `Cache con patrón '${decodedPattern}' invalidado` 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: `Error invalidando cache con patrón '${decodedPattern}'` 
      });
    }
  } catch (error) {
    logger.error(`Error invalidating cache pattern '${req.params.pattern}':`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Error invalidando cache por patrón' 
    });
  }
});

// Reset cache statistics
router.post('/stats/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    cacheService.resetStats();
    logger.info(`Cache stats reset by admin user ${req.user?.email}`);
    res.json({ 
      success: true, 
      message: 'Estadísticas de cache reiniciadas' 
    });
  } catch (error) {
    logger.error('Error resetting cache stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error reiniciando estadísticas de cache' 
    });
  }
});

// Warm up cache manually
router.post('/warmup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await cacheService.warmup();
    logger.info(`Cache warmup initiated by admin user ${req.user?.email}`);
    res.json({ 
      success: true, 
      message: 'Cache warming iniciado' 
    });
  } catch (error) {
    logger.error('Error warming up cache:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error iniciando cache warming' 
    });
  }
});

// ============================================================================
// CACHE TESTING ROUTES (DEVELOPMENT ONLY)
// ============================================================================

if (process.env.NODE_ENV !== 'production') {
  // Test cache set/get
  router.post('/test', authenticateToken, async (req, res) => {
    try {
      const { key, value, ttl } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ error: 'Key y value son requeridos' });
      }

      const success = await cacheService.set(key, value, { ttl: ttl || 300 });
      
      if (success) {
        const retrieved = await cacheService.get(key);
        res.json({
          success: true,
          set: value,
          retrieved,
          match: JSON.stringify(value) === JSON.stringify(retrieved)
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: 'Error guardando en cache' 
        });
      }
    } catch (error) {
      logger.error('Error testing cache:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error probando cache' 
      });
    }
  });

  // Get cache value by key
  router.get('/test/:key', authenticateToken, async (req, res) => {
    try {
      const { key } = req.params;
      const value = await cacheService.get(key);
      
      res.json({
        key,
        value,
        found: value !== null
      });
    } catch (error) {
      logger.error(`Error getting cache key '${req.params.key}':`, error);
      res.status(500).json({ 
        error: 'Error obteniendo valor de cache' 
      });
    }
  });
}

export default router;