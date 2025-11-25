import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import dotenv from 'dotenv';
import 'express-async-errors';
// Usar versión temporal de passport sin autenticación de Google
import passport from './config/passport.temp';

import { config } from './config/config';
import { logger } from './utils/logger';
import { connectDatabase } from './config/prisma';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import csrfProtection, { csrfTokenGenerator, getCsrfToken } from './middleware/csrf';
import corsOptions, { validateCorsConfig, corsWithLogging } from './middleware/corsConfig';
import { securityMiddleware } from './middleware/securityLogger';
import { redisService } from './services/redis.service';
import { cacheService } from './services/cache.service';

// Importar rutas
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import customerRoutes from './routes/customers';
import orderRoutes from './routes/orders';
import inventoryRoutes from './routes/inventory';
import seoRoutes from './routes/seo';
import healthRoutes from './routes/health';
import bulkRoutes from './routes/bulk';
import uploadRoutes from './routes/upload';
import cartRoutes from './routes/cart';
import advancedOrderRoutes from './routes/advanced-orders';
import couponRoutes from './routes/coupons';
import heroSliderRoutes from './routes/heroSlider';
import cacheRoutes from './routes/cache';
import performanceRoutes from './routes/performance';
import reviewRoutes from './routes/reviews';
import inventoryMovementRoutes from './routes/inventory-movements';
import searchRoutes from './routes/search';
import wompiRoutes from './routes/wompi';
// Usando implementación real de pagos con Wompi
import paymentRoutes from './routes/payments';
import contactRoutes from './routes/contact';
import newsletterRoutes from './routes/newsletter.routes';
// import adminPaymentsRoutes from './routes/admin-payments';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ============================================================================
// MIDDLEWARE DE SEGURIDAD
// ============================================================================

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS - Configuración avanzada y segura
app.use(corsWithLogging);
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // Use value from config
  max: config.rateLimitMaxRequests, // Use value from config
  message: 'Demasiadas requests desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Rate limiting is now ALWAYS enabled for security
  // Use higher limits in development if needed via config
  skip: () => config.isTest === true,
});
app.use('/api/', limiter);

// ============================================================================
// MIDDLEWARE GENERAL
// ============================================================================

// Compresión
app.use(compression());

// Parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuración de sesión para Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'test-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// CSRF Protection (después de sesión y antes de rutas)
if (config.nodeEnv === 'production') {
  app.use(csrfProtection());
  app.use(csrfTokenGenerator());
} else {
  // En desarrollo, usar protección CSRF más permisiva para facilitar testing
  console.log('⚠️  CSRF protection disabled in development mode');
}

// Endpoint para obtener token CSRF
app.get('/api/csrf-token', getCsrfToken);

// Logging de requests
app.use(requestLogger);

// Security monitoring middleware
app.use(securityMiddleware);

// ============================================================================
// RUTAS
// ============================================================================

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/orders/advanced', advancedOrderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/hero-slider', heroSliderRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/inventory-movements', inventoryMovementRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/wompi', wompiRoutes);
// Usando implementación real de pagos con Wompi
app.use('/api/payments', paymentRoutes);
// Alias para compatibilidad con tests
app.use('/api/payment-methods', paymentRoutes);
// Newsletter routes
app.use('/api/newsletter', newsletterRoutes);
// TODO: Add authentication middleware for admin routes
// app.use('/api/admin/payments', adminPaymentsRoutes);

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Joyería Elegante API',
    version: '1.0.0',
    description: 'API completa para sistema de gestión de joyería',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      customers: '/api/customers',
      orders: '/api/orders',
      advancedOrders: '/api/orders/advanced',
      cart: '/api/cart',
      coupons: '/api/coupons',
      inventory: '/api/inventory',
      seo: '/api/seo',
      heroSlider: '/api/hero-slider',
    },
    documentation: 'https://documenter.getpostman.com/view/joyeria-elegante-api',
    support: 'dev@joyceriaelegante.com',
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /health',
      'GET /api',
      'POST /api/auth/login',
      'GET /api/products',
      'GET /api/inventory',
      'POST /api/orders',
      'GET /api/seo',
    ],
  });
});

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

app.use(errorHandler);

// ============================================================================
// INICIO DEL SERVIDOR
// ============================================================================

const startServer = async () => {
  try {
    console.log('🔄 Iniciando servidor...');

    // Validar configuración de seguridad
    console.log('🔒 Validando configuración CORS...');
    validateCorsConfig();
    console.log('✅ Configuración CORS válida');

    // Conectar a la base de datos usando función centralizada
    console.log('🔌 Conectando a la base de datos...');
    await connectDatabase();
    console.log('✅ Base de datos conectada');

    // Redis es completamente opcional, no intentamos conectar si no está disponible
    console.log('🚀 Iniciando servidor HTTP...');
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`📋 API docs: http://localhost:${PORT}/api`);
      logger.info(`🔗 Bind address: 0.0.0.0:${PORT} (todas las interfaces)`);

      // Intentar conectar Redis solo después de que el servidor esté funcionando
      if (process.env.REDIS_ENABLED === 'true') {
        redisService.connect()
          .then(() => cacheService.warmup())
          .then(() => logger.info('✅ Redis conectado y cache inicializado'))
          .catch(redisError => logger.warn('⚠️ Redis no disponible - continuando sin cache'));
      } else {
        logger.info('ℹ️ Redis deshabilitado - servidor funcionando sin cache');
      }
      logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`📋 API docs: http://localhost:${PORT}/api`);
      logger.info(`🔗 Bind address: 0.0.0.0:${PORT} (todas las interfaces)`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Puerto ${PORT} ya está en uso`);
      } else {
        logger.error('❌ Error del servidor:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales de terminación
process.on('SIGINT', async () => {
  logger.info('\n🛑 Cerrando servidor...');
  const { disconnectDatabase } = await import('./utils/prisma');
  await Promise.all([
    disconnectDatabase(),
    redisService.disconnect()
  ]);
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n🛑 Cerrando servidor...');
  const { disconnectDatabase } = await import('./utils/prisma');
  await Promise.all([
    disconnectDatabase(),
    redisService.disconnect()
  ]);
  process.exit(0);
});

startServer();

export default app;