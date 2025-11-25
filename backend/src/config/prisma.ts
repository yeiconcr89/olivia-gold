import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { validateEnvironment } from './env-validation';

validateEnvironment();

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
  datasourceUrl: process.env.DATABASE_URL,
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

// Función para conectar y probar la base de datos
export const connectDatabase = async () => {
  try {
    // Probar la conexión
    await prisma.$connect();
    logger.info('✅ Conexión a la base de datos establecida');
  } catch (error) {
    logger.error('❌ Error conectando a la base de datos:', error);
    throw error;
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