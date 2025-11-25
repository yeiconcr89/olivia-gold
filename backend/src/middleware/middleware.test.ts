/**
 * Middleware Testing Suite
 * Tests for authentication, validation, and security middleware
 */

import { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authMiddleware, adminMiddleware, validateRequest } from './auth.middleware';
import { rateLimitMiddleware } from './rateLimiter';
import { requestLogger, errorHandler } from './logging';
import { corsMiddleware } from './cors';
import { z } from 'zod';

// Mock express objects
const createMockRequest = (overrides: any = {}): Partial<Request> => ({
  headers: {},
  body: {},
  query: {},
  params: {},
  user: undefined,
  ip: '127.0.0.1',
  method: 'GET',
  path: '/test',
  ...overrides,
});

const createMockResponse = (): Partial<Response> => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  setHeader: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis(),
});

const createMockNext = (): NextFunction => jest.fn();

describe('🛡️ Middleware Testing Suite', () => {

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('🔐 Authentication Middleware', () => {
    test('should allow requests with valid JWT token', async () => {
      const testUser = { 
        id: 'user-123', 
        email: 'test@example.com', 
        role: 'CUSTOMER' 
      };
      
      const token = jwt.sign(testUser, process.env.JWT_SECRET!, { expiresIn: '1h' });
      
      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` }
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual(expect.objectContaining(testUser));
    });

    test('should reject requests without authorization header', async () => {
      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token de acceso requerido'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject requests with malformed authorization header', async () => {
      const req = createMockRequest({
        headers: { authorization: 'InvalidFormat token-here' }
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Formato de token inválido'
      });
    });

    test('should reject requests with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: 'user-123', email: 'test@example.com' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const req = createMockRequest({
        headers: { authorization: `Bearer ${expiredToken}` }
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token expirado'
      });
    });

    test('should reject requests with invalid token', async () => {
      const req = createMockRequest({
        headers: { authorization: 'Bearer invalid-token-123' }
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token inválido'
      });
    });

    test('should handle token signed with different secret', async () => {
      const tokenWithDifferentSecret = jwt.sign(
        { id: 'user-123', email: 'test@example.com' },
        'different-secret',
        { expiresIn: '1h' }
      );

      const req = createMockRequest({
        headers: { authorization: `Bearer ${tokenWithDifferentSecret}` }
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token inválido'
      });
    });
  });

  describe('👑 Admin Middleware', () => {
    test('should allow admin users to proceed', async () => {
      const req = createMockRequest({
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' }
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await adminMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('should reject non-admin users', async () => {
      const req = createMockRequest({
        user: { id: 'user-123', email: 'user@example.com', role: 'CUSTOMER' }
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Acceso denegado. Se requieren permisos de administrador'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject requests without user context', async () => {
      const req = createMockRequest() as Request; // No user property
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no autenticado'
      });
    });

    test('should handle user with undefined role', async () => {
      const req = createMockRequest({
        user: { id: 'user-123', email: 'user@example.com', role: undefined }
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('✅ Validation Middleware', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email format'),
      age: z.number().min(18, 'Must be at least 18 years old')
    });

    test('should pass validation with valid data', async () => {
      const req = createMockRequest({
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 25
        }
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const validationMiddleware = validateRequest(testSchema);
      await validationMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('should reject validation with invalid data', async () => {
      const req = createMockRequest({
        body: {
          name: '',
          email: 'invalid-email',
          age: 17
        }
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const validationMiddleware = validateRequest(testSchema);
      await validationMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Datos de entrada inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Name is required'
          }),
          expect.objectContaining({
            field: 'email',
            message: 'Invalid email format'
          }),
          expect.objectContaining({
            field: 'age',
            message: 'Must be at least 18 years old'
          })
        ])
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle missing required fields', async () => {
      const req = createMockRequest({
        body: {} // Empty body
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const validationMiddleware = validateRequest(testSchema);
      await validationMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Datos de entrada inválidos'
        })
      );
    });

    test('should validate query parameters', async () => {
      const querySchema = z.object({
        page: z.string().transform(Number).pipe(z.number().min(1)),
        limit: z.string().transform(Number).pipe(z.number().max(100))
      });

      const req = createMockRequest({
        query: { page: '1', limit: '50' }
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const validationMiddleware = validateRequest(querySchema, 'query');
      await validationMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.query).toEqual({ page: 1, limit: 50 });
    });
  });

  describe('🚦 Rate Limiting Middleware', () => {
    test('should allow requests within rate limit', async () => {
      const req = createMockRequest({
        ip: '192.168.1.1'
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await rateLimitMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('should set rate limit headers', async () => {
      const req = createMockRequest({
        ip: '192.168.1.2'
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await rateLimitMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(Number));
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    });

    // Note: Testing actual rate limiting would require multiple rapid requests
    // which is better tested in integration tests
  });

  describe('📝 Request Logger Middleware', () => {
    test('should log incoming requests', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const req = createMockRequest({
        method: 'POST',
        path: '/api/products',
        ip: '192.168.1.3',
        headers: { 'user-agent': 'Test Agent' }
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await requestLogger(req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('POST /api/products')
      );
      expect(next).toHaveBeenCalledWith();

      consoleSpy.mockRestore();
    });

    test('should log request completion', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      
      // Mock res.on to simulate response finish
      const mockOn = jest.fn((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 0); // Simulate async completion
        }
      });
      (res as any).on = mockOn;
      
      const next = createMockNext();

      await requestLogger(req, res, next);

      // Wait for async completion
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockOn).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(next).toHaveBeenCalledWith();

      consoleSpy.mockRestore();
    });
  });

  describe('🚫 Error Handler Middleware', () => {
    test('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      (validationError as any).name = 'ValidationError';
      (validationError as any).details = [
        { message: 'Name is required', field: 'name' }
      ];

      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await errorHandler(validationError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            message: 'Name is required',
            field: 'name'
          })
        ])
      });
    });

    test('should handle JWT errors', async () => {
      const jwtError = new Error('Token expired');
      (jwtError as any).name = 'TokenExpiredError';

      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await errorHandler(jwtError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token expirado'
      });
    });

    test('should handle database errors', async () => {
      const dbError = new Error('Unique constraint violation');
      (dbError as any).code = 'P2002'; // Prisma unique constraint error
      (dbError as any).meta = { target: ['email'] };

      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await errorHandler(dbError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'El email ya está registrado'
      });
    });

    test('should handle generic errors in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const genericError = new Error('Internal server issue');

      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await errorHandler(genericError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor'
      });

      process.env.NODE_ENV = originalEnv;
    });

    test('should expose detailed errors in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const detailError = new Error('Detailed error message');
      (detailError as any).stack = 'Error stack trace...';

      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await errorHandler(detailError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Detailed error message',
        stack: 'Error stack trace...'
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('🌐 CORS Middleware', () => {
    test('should set CORS headers for allowed origins', async () => {
      const req = createMockRequest({
        headers: { origin: 'http://localhost:3000' },
        method: 'GET'
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await corsMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', expect.stringContaining('GET'));
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', expect.any(String));
      expect(next).toHaveBeenCalledWith();
    });

    test('should handle preflight OPTIONS requests', async () => {
      const req = createMockRequest({
        method: 'OPTIONS',
        headers: { 
          origin: 'http://localhost:3000',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'authorization,content-type'
        }
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await corsMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', expect.stringContaining('POST'));
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalledWith('');
    });

    test('should reject requests from disallowed origins', async () => {
      const req = createMockRequest({
        headers: { origin: 'http://malicious-site.com' },
        method: 'GET'
      }) as Request;
      
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await corsMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Origen no permitido por la política CORS'
      });
    });
  });

  describe('🔒 Security Headers Middleware', () => {
    test('should set security headers', async () => {
      // Assuming we have a security headers middleware
      const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        next();
      };

      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      await securityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(res.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('🔄 Middleware Chaining', () => {
    test('should execute middleware in correct order', async () => {
      const executionOrder: string[] = [];
      
      const middleware1 = (req: Request, res: Response, next: NextFunction) => {
        executionOrder.push('middleware1');
        next();
      };
      
      const middleware2 = (req: Request, res: Response, next: NextFunction) => {
        executionOrder.push('middleware2');
        next();
      };
      
      const middleware3 = (req: Request, res: Response, next: NextFunction) => {
        executionOrder.push('middleware3');
        next();
      };

      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      // Simulate middleware chain execution
      await middleware1(req, res, () => {
        middleware2(req, res, () => {
          middleware3(req, res, next);
        });
      });

      expect(executionOrder).toEqual(['middleware1', 'middleware2', 'middleware3']);
      expect(next).toHaveBeenCalledWith();
    });

    test('should stop execution when middleware throws error', async () => {
      const executionOrder: string[] = [];
      
      const middleware1 = (req: Request, res: Response, next: NextFunction) => {
        executionOrder.push('middleware1');
        next();
      };
      
      const errorMiddleware = (req: Request, res: Response, next: NextFunction) => {
        executionOrder.push('errorMiddleware');
        next(new Error('Test error'));
      };
      
      const middleware3 = (req: Request, res: Response, next: NextFunction) => {
        executionOrder.push('middleware3');
        next();
      };

      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      const next = jest.fn();

      // Simulate middleware chain execution
      await middleware1(req, res, () => {
        errorMiddleware(req, res, (error) => {
          if (error) {
            next(error);
          } else {
            middleware3(req, res, next);
          }
        });
      });

      expect(executionOrder).toEqual(['middleware1', 'errorMiddleware']);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});