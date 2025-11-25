import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from './logger';

// Configurar métricas de performance
let queryCount = 0;
let slowQueryCount = 0;
const SLOW_QUERY_THRESHOLD = 1000; // 1 segundo

declare global {
  var __prisma: PrismaClient | undefined;
}

// Singleton pattern para evitar múltiples instancias
export const prisma: PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error' | 'info' | 'warn'> = globalThis.__prisma ?? new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
  datasourceUrl: process.env.NODE_ENV === 'production'
    ? (process.env.DATABASE_URL?.includes('?')
      ? `${process.env.DATABASE_URL}&sslmode=no-verify`
      : `${process.env.DATABASE_URL}?sslmode=no-verify`)
    : process.env.DATABASE_URL,
});

// Logging de queries en desarrollo con métricas
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: Prisma.QueryEvent) => {
    queryCount++;

    if (e.duration > SLOW_QUERY_THRESHOLD) {
      slowQueryCount++;
      logger.warn('Slow Query Detected:', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
        slowQueryCount,
      });
    } else {
      logger.debug('Prisma Query:', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
        totalQueries: queryCount,
      });
    }
  });
}

prisma.$on('error', (e: Prisma.LogEvent) => {
  logger.error('Prisma Error:', e);
});

// Asegurar singleton en desarrollo
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Función para conectar a la base de datos
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Conectado a la base de datos');
  } catch (error) {
    logger.error('❌ Error conectando a la base de datos:', error);
    process.exit(1);
  }
};

// Función para desconectar de la base de datos
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('🔌 Desconectado de la base de datos');
  } catch (error) {
    logger.error('❌ Error desconectando de la base de datos:', error);
  }
};

// Health check para verificar estado de la conexión
export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      timestamp: new Date(),
      queryCount,
      slowQueryCount,
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Función para obtener métricas de performance
export const getDatabaseMetrics = () => {
  return {
    totalQueries: queryCount,
    slowQueries: slowQueryCount,
    slowQueryPercentage: queryCount > 0 ? (slowQueryCount / queryCount) * 100 : 0,
    slowQueryThreshold: SLOW_QUERY_THRESHOLD,
  };
};

// Limpiar métricas (útil para testing)
export const resetMetrics = () => {
  queryCount = 0;
  slowQueryCount = 0;
};