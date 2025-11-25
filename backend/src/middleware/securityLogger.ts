import { Request, Response, NextFunction } from 'express';
import { simpleLogger } from '../utils/simple-logger';
import { prisma } from '../utils/prisma';

/**
 * Tipos de eventos de seguridad
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_BRUTEFORCE = 'LOGIN_BRUTEFORCE',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  ADMIN_ACCESS = 'ADMIN_ACCESS',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  CSRF_VIOLATION = 'CSRF_VIOLATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  FILE_UPLOAD_VIOLATION = 'FILE_UPLOAD_VIOLATION',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT'
}

/**
 * Interfaz para eventos de seguridad
 */
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  email?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: Date;
}

/**
 * Obtener información de la request
 */
function getRequestInfo(req: Request): Pick<SecurityEvent, 'ip' | 'userAgent' | 'path' | 'method'> {
  return {
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    path: req.path,
    method: req.method
  };
}

/**
 * Determinar geolocalización aproximada por IP (simplificado)
 */
function getLocationInfo(ip: string): { country?: string; city?: string } {
  // En producción, usar un servicio como MaxMind GeoIP
  // Por ahora, detectar IPs locales
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'Local', city: 'Development' };
  }
  return {};
}

/**
 * Logger de seguridad principal
 */
export class SecurityLogger {
  /**
   * Log de evento de seguridad
   */
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const location = getLocationInfo(event.ip);
    
    const logData = {
      ...event,
      timestamp: event.timestamp || new Date(),
      location
    };

    // Log con logger simple (evita dependencias circulares)
    const logLevel = this.getLogLevel(event.severity);
    simpleLogger[logLevel]('Security Event', logData);

    // Guardar en base de datos para eventos importantes
    if (event.severity === 'high' || event.severity === 'critical') {
      try {
        await this.saveToDatabase(logData);
      } catch (error) {
        simpleLogger.error('Error saving security event to database:', error);
      }
    }

    // Alertas para eventos críticos
    if (event.severity === 'critical') {
      await this.sendAlert(logData);
    }
  }

  /**
   * Log de login exitoso
   */
  static async logLoginSuccess(req: Request, userId: string, email: string): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.LOGIN_SUCCESS,
      userId,
      email,
      ...getRequestInfo(req),
      severity: 'low',
      details: {
        loginTime: new Date().toISOString()
      }
    });
  }

  /**
   * Log de login fallido
   */
  static async logLoginFailed(req: Request, email?: string, reason?: string): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.LOGIN_FAILED,
      email,
      ...getRequestInfo(req),
      severity: 'medium',
      details: {
        reason: reason || 'Invalid credentials',
        attemptTime: new Date().toISOString()
      }
    });

    // Verificar patrones de brute force
    await this.checkBruteForcePattern(req.ip, email);
  }

  /**
   * Log de acceso no autorizado
   */
  static async logUnauthorizedAccess(req: Request, userId?: string, reason?: string): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.UNAUTHORIZED_ACCESS,
      userId,
      ...getRequestInfo(req),
      severity: 'high',
      details: {
        reason: reason || 'Missing or invalid token',
        attemptTime: new Date().toISOString(),
        headers: {
          authorization: req.headers.authorization ? '[PRESENT]' : '[MISSING]',
          'x-api-key': req.headers['x-api-key'] ? '[PRESENT]' : '[MISSING]'
        }
      }
    });
  }

  /**
   * Log de acceso de administrador
   */
  static async logAdminAccess(req: Request, userId: string, action: string): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.ADMIN_ACCESS,
      userId,
      ...getRequestInfo(req),
      severity: 'medium',
      details: {
        action,
        accessTime: new Date().toISOString(),
        body: req.method !== 'GET' ? req.body : undefined
      }
    });
  }

  /**
   * Log de rate limiting
   */
  static async logRateLimitExceeded(req: Request, limit: number): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      ...getRequestInfo(req),
      severity: 'medium',
      details: {
        limit,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log de violación CSRF
   */
  static async logCSRFViolation(req: Request, userId?: string): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.CSRF_VIOLATION,
      userId,
      ...getRequestInfo(req),
      severity: 'high',
      details: {
        hasToken: !!req.body?._csrf || !!req.headers['x-csrf-token'],
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log de actividad sospechosa
   */
  static async logSuspiciousActivity(req: Request, reason: string, details?: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      ...getRequestInfo(req),
      severity: 'high',
      details: {
        reason,
        timestamp: new Date().toISOString(),
        ...details
      }
    });
  }

  /**
   * Verificar patrones de brute force
   */
  private static async checkBruteForcePattern(ip: string, email?: string): Promise<void> {
    const timeWindow = 15 * 60 * 1000; // 15 minutos
    const maxAttempts = 5;
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindow);

    try {
      // Contar intentos fallidos en la ventana de tiempo
      const recentFailures = await prisma.securityLog.count({
        where: {
          eventType: SecurityEventType.LOGIN_FAILED,
          ip,
          createdAt: {
            gte: windowStart
          }
        }
      });

      if (recentFailures >= maxAttempts) {
        await this.logSecurityEvent({
          type: SecurityEventType.LOGIN_BRUTEFORCE,
          email,
          ip,
          userAgent: 'system',
          path: '/auth/login',
          method: 'POST',
          severity: 'critical',
          details: {
            attemptCount: recentFailures,
            timeWindow: timeWindow / 1000 / 60, // en minutos
            detectedAt: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      simpleLogger.error('Error checking brute force pattern:', error);
    }
  }

  /**
   * Guardar evento en base de datos
   */
  private static async saveToDatabase(event: SecurityEvent & { location?: any }): Promise<void> {
    await prisma.securityLog.create({
      data: {
        eventType: event.type,
        userId: event.userId,
        email: event.email,
        ip: event.ip,
        userAgent: event.userAgent,
        path: event.path,
        method: event.method,
        severity: event.severity,
        details: event.details as any,
        location: event.location as any,
        createdAt: event.timestamp
      }
    });
  }

  /**
   * Enviar alerta para eventos críticos
   */
  private static async sendAlert(event: SecurityEvent): Promise<void> {
    // En producción, enviar email/Slack/webhook
    simpleLogger.error('🚨 SECURITY ALERT 🚨', {
      type: event.type,
      severity: event.severity,
      ip: event.ip,
      path: event.path,
      details: event.details
    });

    // TODO: Implementar notificaciones reales
    // - Email al administrador
    // - Webhook a Slack
    // - Integración con SIEM
  }

  /**
   * Mapear severidad a nivel de log
   */
  private static getLogLevel(severity: string): 'info' | 'warn' | 'error' {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warn';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  }
}

/**
 * Middleware para logging automático de requests sospechosos
 */
export const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Detectar patrones sospechosos en URL
  const suspiciousPatterns = [
    /\.\.\//g,           // Directory traversal
    /<script/i,          // XSS attempts
    /union.*select/i,    // SQL injection
    /drop.*table/i,      // SQL injection
    /exec\(/i,           // Code injection
    /eval\(/i,           // Code injection
    /javascript:/i,      // XSS attempts
    /vbscript:/i,        // XSS attempts
    /onload=/i,          // XSS attempts
    /onerror=/i          // XSS attempts
  ];

  const url = req.originalUrl;
  const userAgent = req.get('User-Agent') || '';

  // Verificar patrones sospechosos
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(userAgent)) {
      SecurityLogger.logSuspiciousActivity(req, 'Suspicious pattern detected', {
        pattern: pattern.toString(),
        url,
        userAgent
      });
      break;
    }
  }

  // Detectar user agents sospechosos
  const suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scan/i,
    /hack/i,
    /sqlmap/i,
    /nikto/i,
    /nmap/i
  ];

  if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
    SecurityLogger.logSuspiciousActivity(req, 'Suspicious user agent', {
      userAgent
    });
  }

  next();
};

export default SecurityLogger;