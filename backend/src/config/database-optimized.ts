import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// OPTIMIZED DATABASE CONFIGURATION
// ============================================================================

interface DatabaseConfig {
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  statementTimeout: number;
  idleTimeout: number;
  logQueries: boolean;
  logSlowQueries: boolean;
  slowQueryThreshold: number;
}

const getDatabaseConfig = (): DatabaseConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    // Connection pool settings
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || (isProduction ? '20' : '10')),
    connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000'), // 10s
    queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '30000'), // 30s
    statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '60000'), // 60s
    idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '300000'), // 5min

    // Logging settings
    logQueries: process.env.DATABASE_LOG_QUERIES === 'true' || !isProduction,
    logSlowQueries: process.env.DATABASE_LOG_SLOW_QUERIES !== 'false',
    slowQueryThreshold: parseInt(process.env.DATABASE_SLOW_QUERY_THRESHOLD || '1000'), // 1s
  };
};

const config = getDatabaseConfig();

// ============================================================================
// PRISMA CLIENT WITH OPTIMIZED CONFIGURATION
// ============================================================================

export const prismaOptimized = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: [
    ...(config.logQueries ? [{ emit: 'event' as const, level: 'query' as const }] : []),
    { emit: 'event' as const, level: 'error' as const },
    { emit: 'event' as const, level: 'warn' as const },
  ],
});

export const prisma = prismaOptimized;

// ============================================================================
// QUERY LOGGING AND MONITORING
// ============================================================================

if (config.logQueries) {
  prismaOptimized.$on('query', (e) => {
    const duration = e.duration;
    const query = e.query.substring(0, 200) + (e.query.length > 200 ? '...' : '');

    if (config.logSlowQueries && duration > config.slowQueryThreshold) {
      logger.warn(`Slow query detected (${duration}ms): ${query}`, {
        duration,
        params: e.params,
        target: e.target,
      });
    } else if (config.logQueries && process.env.NODE_ENV === 'development') {
      logger.debug(`Query (${duration}ms): ${query}`);
    }
  });
}

prismaOptimized.$on('error', (e) => {
  logger.error('Prisma error:', e);
});

prismaOptimized.$on('warn', (e) => {
  logger.warn('Prisma warning:', e);
});

// ============================================================================
// CONNECTION POOL MONITORING
// ============================================================================

class ConnectionPoolMonitor {
  private metrics = {
    activeConnections: 0,
    totalQueries: 0,
    slowQueries: 0,
    errors: 0,
    lastReset: new Date(),
  };

  incrementActiveConnections() {
    this.metrics.activeConnections++;
  }

  decrementActiveConnections() {
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
  }

  recordQuery(duration: number) {
    this.metrics.totalQueries++;
    if (duration > config.slowQueryThreshold) {
      this.metrics.slowQueries++;
    }
  }

  recordError() {
    this.metrics.errors++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.lastReset.getTime(),
      slowQueryRate: this.metrics.totalQueries > 0
        ? (this.metrics.slowQueries / this.metrics.totalQueries) * 100
        : 0,
    };
  }

  reset() {
    this.metrics = {
      activeConnections: 0,
      totalQueries: 0,
      slowQueries: 0,
      errors: 0,
      lastReset: new Date(),
    };
  }
}

export const connectionPoolMonitor = new ConnectionPoolMonitor();

// ============================================================================
// MIDDLEWARE FOR CONNECTION MONITORING
// ============================================================================

export const withConnectionMonitoring = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();

  try {
    connectionPoolMonitor.incrementActiveConnections();
    const result = await operation();

    const duration = Date.now() - startTime;
    connectionPoolMonitor.recordQuery(duration);

    return result;
  } catch (error) {
    connectionPoolMonitor.recordError();
    throw error;
  } finally {
    connectionPoolMonitor.decrementActiveConnections();
  }
};

// ============================================================================
// OPTIMIZED QUERY HELPERS
// ============================================================================

export const optimizedQueries = {
  /**
   * Execute query with automatic retry on connection errors
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await withConnectionMonitoring(operation);
      } catch (error) {
        lastError = error as Error;

        // Only retry on connection errors
        if (
          attempt < maxRetries &&
          (error as Error).message.includes('connection') ||
          (error as Error).message.includes('timeout')
        ) {
          logger.warn(`Query attempt ${attempt} failed, retrying in ${delay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }

        throw error;
      }
    }

    throw lastError!;
  },

  /**
   * Execute query with timeout
   */
  async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = config.queryTimeout
  ): Promise<T> {
    return Promise.race([
      withConnectionMonitoring(operation),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  },

  /**
   * Execute batch operations efficiently
   */
  async batch<T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 10
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(op => withConnectionMonitoring(op))
      );
      results.push(...batchResults);
    }

    return results;
  },
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const checkDatabaseHealth = async () => {
  try {
    const startTime = Date.now();
    await prismaOptimized.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    const poolMetrics = connectionPoolMonitor.getMetrics();

    return {
      status: 'healthy',
      responseTime,
      config: {
        maxConnections: config.maxConnections,
        connectionTimeout: config.connectionTimeout,
        queryTimeout: config.queryTimeout,
      },
      metrics: poolMetrics,
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      error: (error as Error).message,
      metrics: connectionPoolMonitor.getMetrics(),
    };
  }
};

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

export const disconnectOptimizedDatabase = async () => {
  try {
    logger.info('Disconnecting from optimized database...');
    await prismaOptimized.$disconnect();
    logger.info('✅ Optimized database disconnected');
  } catch (error) {
    logger.error('Error disconnecting optimized database:', error);
  }
};

// Export the optimized client as default
export default prismaOptimized;