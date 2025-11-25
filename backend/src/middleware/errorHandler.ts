import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { CustomError } from '../utils/errors';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Error Handler:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  if (error instanceof CustomError) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  // Error de Prisma - Registro duplicado
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Ya existe un registro con estos datos',
        field: error.meta?.target,
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Registro no encontrado',
      });
    }
  }

  // Error de validación de Prisma
  if (error instanceof Prisma.PrismaClientValidationError) {
    logger.warn('Prisma Validation Error:', error.message);
    return res.status(400).json({
      error: 'Datos inválidos proporcionados',
      details: error.message,
    });
  }

  // Error de JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
    });
  }

  // Error de Multer (subida de archivos)
  if (error.name === 'MulterError') {
    if (error.message.includes('File too large')) {
      return res.status(413).json({
        error: 'Archivo demasiado grande',
      });
    }
    return res.status(400).json({
      error: 'Error en la subida del archivo',
    });
  }

  // Error genérico
  return res.status(500).json({
    error: 'Error interno del servidor',
    details: error.message,
    stack: error.stack,
    // TODO: Remove this in production after debugging
  });
};