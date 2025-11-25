import { CorsOptions } from 'cors';
import { config } from '../config/config';
import { logger } from '../utils/logger';

/**
 * Configuración avanzada de CORS con seguridad mejorada
 */

// Lista de dominios permitidos por ambiente
const getAllowedOrigins = (): string[] => {
  const frontendUrl = config.frontendUrl;

  if (config.nodeEnv === 'production') {
    // En producción, solo dominios específicos
    return [
      frontendUrl,
      'https://olivia-gold.com',
      'https://www.olivia-gold.com',
      'https://admin.olivia-gold.com'
    ].filter(Boolean);
  } else if (config.nodeEnv === 'staging') {
    // En staging, dominios de staging
    return [
      frontendUrl,
      'https://staging.olivia-gold.com',
      'https://dev.olivia-gold.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173'
    ].filter(Boolean);
  } else {
    // En desarrollo, más permisivo pero controlado
    return [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:4173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:4173',
      frontendUrl
    ].filter(Boolean);
  }
};

// Headers permitidos según el ambiente
const getAllowedHeaders = (): string[] => {
  const baseHeaders = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ];

  if (config.nodeEnv === 'production') {
    return [
      ...baseHeaders,
      'x-csrf-token',
      'x-api-key'
    ];
  } else {
    return [
      ...baseHeaders,
      'x-csrf-token',
      'x-api-key',
      'x-debug-mode',
      'x-test-mode'
    ];
  }
};

// Métodos HTTP permitidos
const getAllowedMethods = (): string[] => {
  if (config.nodeEnv === 'production') {
    return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  } else {
    return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
  }
};

/**
 * Verificar si el origen está permitido
 */
const isOriginAllowed = (origin: string | undefined, allowedOrigins: string[]): boolean => {
  // Si no hay origen (requests del mismo servidor), permitir
  if (!origin) return true;

  // Verificar contra lista de orígenes permitidos
  return allowedOrigins.some(allowed => {
    if (allowed === origin) return true;

    // Permitir subdominios en producción si está configurado
    if (config.nodeEnv === 'production') {
      if (allowed.includes('olivia-gold.com')) {
        const domain = new URL(allowed).hostname;
        const originDomain = new URL(origin).hostname;
        if (originDomain.endsWith(domain) || originDomain === domain) return true;
      }
      // Permitir cualquier dominio de Vercel (para previews y producción)
      if (origin.endsWith('.vercel.app')) {
        return true;
      }
    }

    return false;
  });
};

/**
 * Configuración principal de CORS
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    if (isOriginAllowed(origin, allowedOrigins)) {
      callback(null, true);
    } else {
      // Log intento de acceso no autorizado
      logger.warn('CORS: Origen no permitido', {
        origin,
        allowedOrigins,
        userAgent: 'N/A', // Se agregará en el middleware
        ip: 'N/A', // Se agregará en el middleware
        timestamp: new Date().toISOString()
      });

      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },

  credentials: true, // Permitir cookies y credenciales

  methods: getAllowedMethods(),

  allowedHeaders: getAllowedHeaders(),

  // Headers que el cliente puede leer
  exposedHeaders: [
    'Content-Length',
    'Content-Range',
    'X-Total-Count',
    'X-Page-Count',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],

  // Cache de preflight requests
  maxAge: config.nodeEnv === 'production' ? 86400 : 300, // 24h en prod, 5min en dev

  // Opciones adicionales para seguridad
  optionsSuccessStatus: 200, // Para navegadores legacy
  preflightContinue: false, // No pasar control al siguiente handler
};

/**
 * Middleware CORS mejorado con logging
 */
export const corsWithLogging = (req: any, res: any, next: any) => {
  const origin = req.get('Origin');
  const userAgent = req.get('User-Agent');
  const method = req.method;

  // Log para requests CORS problemáticos
  if (origin && method === 'OPTIONS') {
    logger.debug('CORS preflight request', {
      origin,
      method: req.method,
      headers: req.headers,
      ip: req.ip,
      userAgent,
      path: req.path
    });
  }

  // Continuar con CORS normal
  next();
};

/**
 * Configuración CORS específica para uploads
 */
export const corsForUploads: CorsOptions = {
  ...corsOptions,
  // Headers adicionales para uploads
  allowedHeaders: [
    ...getAllowedHeaders(),
    'Content-Disposition',
    'Content-Range',
    'X-File-Size',
    'X-File-Type'
  ]
};

/**
 * Configuración CORS para webhooks (más restrictiva)
 */
export const corsForWebhooks: CorsOptions = {
  origin: false, // No permitir CORS para webhooks
  credentials: false
};

/**
 * Configuración CORS para desarrollo/testing
 */
export const corsForDevelopment: CorsOptions = {
  origin: true, // Permitir cualquier origen en desarrollo
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: '*', // Permitir cualquier header en desarrollo
  exposedHeaders: '*'
};

/**
 * Validar configuración CORS en startup
 */
export const validateCorsConfig = (): void => {
  const allowedOrigins = getAllowedOrigins();

  logger.info('CORS Configuration loaded', {
    environment: config.nodeEnv,
    allowedOrigins: allowedOrigins.length,
    allowedMethods: getAllowedMethods(),
    credentialsEnabled: corsOptions.credentials,
    maxAge: corsOptions.maxAge
  });

  // Advertencias para configuraciones inseguras
  if (config.nodeEnv === 'production') {
    if (allowedOrigins.some(origin => origin.includes('localhost'))) {
      logger.warn('⚠️  CORS: localhost origins found in production!');
    }

    if (allowedOrigins.length > 10) {
      logger.warn('⚠️  CORS: Many origins allowed in production', { count: allowedOrigins.length });
    }
  }

  // Verificar que frontend URL esté configurado
  if (!config.frontendUrl) {
    logger.error('❌ FRONTEND_URL not configured!');
    throw new Error('FRONTEND_URL is required for CORS configuration');
  }

  logger.info('✅ CORS configuration validated successfully');
};

export default corsOptions;