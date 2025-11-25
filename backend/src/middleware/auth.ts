import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';
import SecurityLogger from './securityLogger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthRequest;
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await SecurityLogger.logUnauthorizedAccess(req, undefined, 'Missing or invalid authorization header');
      return res.status(401).json({
        error: 'Token de acceso requerido',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      
      // Verificar que el usuario existe y está activo
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        await SecurityLogger.logUnauthorizedAccess(req, decoded.userId, 'User not found');
        return res.status(401).json({
          error: 'Usuario no encontrado',
        });
      }

      if (!user.isActive) {
        await SecurityLogger.logUnauthorizedAccess(req, user.id, 'User account inactive');
        return res.status(401).json({
          error: 'Usuario inactivo',
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      };
      next();
    } catch (jwtError) {
      await SecurityLogger.logUnauthorizedAccess(req, undefined, 'Invalid JWT token');
      logger.warn('Token JWT inválido:', jwtError);
      return res.status(401).json({
        error: 'Token inválido',
      });
    }
  } catch (error) {
    logger.error('Error en autenticación:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
    });
  }
};

export const authorize = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      await SecurityLogger.logUnauthorizedAccess(req, undefined, 'User not authenticated');
      return res.status(401).json({
        error: 'Usuario no autenticado',
      });
    }

    if (!roles.includes(req.user.role)) {
      await SecurityLogger.logUnauthorizedAccess(req, req.user.id, `Insufficient permissions. Required: ${roles.join(', ')}, User role: ${req.user.role}`);
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción',
      });
    }

    // Log admin access para roles privilegiados
    if (['ADMIN', 'MANAGER'].includes(req.user.role)) {
      await SecurityLogger.logAdminAccess(req, req.user.id, `${req.method} ${req.path}`);
    }

    next();
  };
};

// Alias for easier usage
export const requireRole = (roles: UserRole[] | UserRole) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return authorize(roleArray);
};

// Middleware opcional de autenticación (para endpoints públicos que pueden beneficiarse de info del usuario)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        });

        if (user && user.isActive) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          };
        }
      } catch (jwtError) {
        // Ignorar errores de JWT en autenticación opcional
      }
    }

    next();
  } catch (error) {
    // En autenticación opcional, continuamos sin usuario
    next();
  }
};

// Middleware para autenticación obligatoria
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });

      if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      if (user.status !== 'ACTIVE') {
        return res.status(401).json({ error: 'Usuario inactivo' });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para verificar que el usuario sea administrador
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }

  next();
};