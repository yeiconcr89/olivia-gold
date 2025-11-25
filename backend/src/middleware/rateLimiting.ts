import rateLimit from 'express-rate-limit';
import { config } from '../config/config';
import { logger } from '../utils/logger';

// Helper para saltar rate limiting en entorno de pruebas
const skipInTest = () => config.isTest === true;

// Rate limiter general (ya configurado en server.ts)
export const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Demasiadas requests desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

// Rate limiter estricto para auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: config.isDevelopment ? 10 : 5, // 5 intentos en producción, 10 en desarrollo
  message: {
    error: 'Demasiados intentos de autenticación desde esta IP',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
  skip: skipInTest,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit reached for auth endpoint`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString()
    });
    
    res.status(options.statusCode).json({
      error: 'Demasiados intentos de autenticación desde esta IP',
      retryAfter: '15 minutos'
    });
  }
});

// Rate limiter para password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Solo 3 intentos por hora
  message: {
    error: 'Demasiados intentos de reset de contraseña desde esta IP',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: (req, res, next, options) => {
    logger.warn(`Password reset rate limit reached`, {
      ip: req.ip,
      email: req.body?.email,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(options.statusCode).json({
      error: 'Demasiados intentos de reset de contraseña desde esta IP',
      retryAfter: '1 hora'
    });
  }
});

// Rate limiter para upload de archivos
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: config.isDevelopment ? 20 : 10, // Más permisivo en desarrollo
  message: {
    error: 'Demasiadas subidas de archivos desde esta IP',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

// Rate limiter para crear órdenes
export const orderCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // Máximo 5 órdenes por minuto
  message: {
    error: 'Demasiadas órdenes creadas desde esta IP',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: (req, res, next, options) => {
    logger.warn(`Order creation rate limit reached`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      customerEmail: req.body?.customerEmail,
      timestamp: new Date().toISOString()
    });
    
    res.status(options.statusCode).json({
      error: 'Demasiadas órdenes creadas desde esta IP',
      retryAfter: '1 minuto'
    });
  }
});

// Rate limiter para endpoints de admin
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: config.isDevelopment ? 200 : 100, // Más permisivo en desarrollo
  message: {
    error: 'Demasiadas requests a endpoints de admin desde esta IP',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

// Rate limiter para búsquedas
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: config.isDevelopment ? 100 : 30, // Búsquedas frecuentes pero limitadas
  message: {
    error: 'Demasiadas búsquedas desde esta IP',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

export default {
  general: generalLimiter,
  auth: authLimiter,
  passwordReset: passwordResetLimiter,
  upload: uploadLimiter,
  orderCreation: orderCreationLimiter,
  admin: adminLimiter,
  search: searchLimiter
};