import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { config } from '../config/config';

// Extender Request para incluir csrfToken
declare global {
  namespace Express {
    interface Request {
      csrfToken?: () => string;
    }
  }
}

interface CSRFOptions {
  secretLength?: number;
  tokenLength?: number;
  headerName?: string;
  cookieName?: string;
  sessionKey?: string;
  ignoreMethods?: string[];
  value?: (req: Request) => string | undefined;
}

const DEFAULT_OPTIONS: Required<CSRFOptions> = {
  secretLength: 18,
  tokenLength: 8,
  headerName: 'x-csrf-token',
  cookieName: 'csrf-token',
  sessionKey: 'csrfSecret',
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  value: (req: Request) => {
    return req.body?._csrf ||
      req.query._csrf ||
      req.headers['x-csrf-token'] ||
      req.headers['x-xsrf-token'];
  }
};

/**
 * Generar un token CSRF seguro
 */
function generateSecret(length: number): string {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Generar token CSRF basado en secret
 */
function generateToken(secret: string, length: number): string {
  const hash = crypto.createHash('sha256')
    .update(secret + Date.now().toString())
    .digest('base64');
  return hash.substring(0, length);
}

/**
 * Verificar si el token CSRF es válido
 */
function verifyToken(secret: string, token: string, length: number): boolean {
  if (!secret || !token) return false;

  // Para tokens de duración limitada, verificar en ventana de tiempo
  const now = Date.now();
  const timeWindow = 3600000; // 1 hora

  for (let i = 0; i < 5; i++) {
    const time = now - (i * 600000); // Verificar cada 10 minutos hacia atrás
    const expectedToken = crypto.createHash('sha256')
      .update(secret + Math.floor(time / 600000).toString())
      .digest('base64')
      .substring(0, length);

    if (token === expectedToken) return true;
  }

  return false;
}

/**
 * Middleware de protección CSRF
 */
export function csrfProtection(options: CSRFOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip para métodos seguros
    if (opts.ignoreMethods.includes(req.method)) {
      return addTokenToRequest();
    }

    // Skip para rutas específicas (health checks, webhooks, etc.)
    if (isExemptRoute(req.path)) {
      return next();
    }

    // Verificar token para métodos que modifican estado
    const secret = getSecret();
    const token = opts.value(req) as string;

    if (!verifyToken(secret, token, opts.tokenLength)) {
      logger.warn('CSRF token verification failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        hasToken: !!token,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        error: 'Token CSRF inválido',
        code: 'CSRF_TOKEN_INVALID'
      });
    }

    addTokenToRequest();

    function getSecret(): string {
      // Intentar obtener el secret de la sesión
      if (req.session && req.session[opts.sessionKey]) {
        return req.session[opts.sessionKey];
      }

      // Generar nuevo secret si no existe
      const newSecret = generateSecret(opts.secretLength);
      if (req.session) {
        req.session[opts.sessionKey] = newSecret;
      }
      return newSecret;
    }

    function addTokenToRequest() {
      // Agregar función para generar token al request
      req.csrfToken = () => {
        const secret = getSecret();
        const token = generateToken(secret, opts.tokenLength);

        // Configurar cookie si está habilitado
        if (config.nodeEnv === 'production') {
          res.cookie(opts.cookieName, token, {
            httpOnly: false, // Debe ser accessible desde JavaScript
            secure: true,
            sameSite: 'strict',
            maxAge: 3600000 // 1 hora
          });
        } else {
          res.cookie(opts.cookieName, token, {
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
            maxAge: 3600000
          });
        }

        return token;
      };

      next();
    }
  };
}

/**
 * Verificar si la ruta está exenta de protección CSRF
 */
function isExemptRoute(path: string): boolean {
  const exemptRoutes = [
    '/api/health',
    '/api/webhooks',
    '/api/auth/google/callback', // OAuth callbacks
    '/api/payments/webhook' // Payment webhooks
  ];

  return exemptRoutes.some(route => path.startsWith(route));
}

/**
 * Middleware para generar token CSRF (solo para GET requests)
 */
export function csrfTokenGenerator() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && req.csrfToken) {
      // Generar token automáticamente para GET requests
      req.csrfToken();
    }
    next();
  };
}

/**
 * Endpoint para obtener token CSRF
 */
export function getCsrfToken(req: Request, res: Response) {
  if (!req.csrfToken) {
    // CSRF middleware está deshabilitado, devolver token dummy
    logger.warn('CSRF protection not initialized - returning dummy token');
    return res.json({
      csrfToken: 'csrf-disabled',
      timestamp: Date.now(),
      enabled: false
    });
  }

  const token = req.csrfToken();
  res.json({
    csrfToken: token,
    timestamp: Date.now(),
    enabled: true
  });
}

export default csrfProtection;