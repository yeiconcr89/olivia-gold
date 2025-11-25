import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

export const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      logger.error('Validation error:', {
        body: req.body,
        errors: result.error.errors,
        path: req.path
      });
      return next(new BadRequestError(
        `Datos inválidos: ${result.error.errors.map(e => `${e.path}: ${e.message}`).join(', ')}`
      ));
    }
    req.body = result.data; // usar datos validados
    next();
  } catch (error) {
    logger.error('Unexpected validation error:', error);
    next(error);
  }
};

export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Parámetros inválidos',
          details: errorDetails,
        });
      }

      logger.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Parámetros de consulta inválidos',
          details: errorDetails,
        });
      }

      logger.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  };
};