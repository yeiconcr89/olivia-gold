import { Request, Response, NextFunction } from 'express';
import { queryPerformanceService } from '../services/query-performance.service';
import { logger } from '../utils/logger';

interface PerformanceRequest extends Request {
  startTime?: number;
  queryName?: string;
}

/**
 * Middleware to automatically measure API endpoint performance
 */
export const measureEndpointPerformance = (queryName?: string) => {
  return (req: PerformanceRequest, res: Response, next: NextFunction) => {
    req.startTime = Date.now();
    req.queryName = queryName || `${req.method} ${req.route?.path || req.path}`;

    // Override res.json to capture when response is sent
    const originalJson = res.json;
    res.json = function(body: any) {
      if (req.startTime && req.queryName) {
        const executionTime = Date.now() - req.startTime;
        
        // Determine if this was likely a cache hit based on response time
        const cacheHit = executionTime < 50; // Assume cache hit if < 50ms
        
        // Log the performance metric
        queryPerformanceService.measureQuery(
          req.queryName,
          async () => body, // Dummy async function since we already have the result
          cacheHit
        ).catch(error => {
          logger.error('Failed to record performance metric:', error);
        });

        // Log slow endpoints
        if (executionTime > 2000) { // > 2 seconds
          logger.warn(`Slow endpoint: ${req.queryName} took ${executionTime}ms`);
        }
      }

      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Middleware to measure database query performance
 */
export const measureDatabaseQuery = async <T>(
  queryName: string,
  queryFn: () => Promise<T>,
  cacheHit: boolean = false
): Promise<T> => {
  return queryPerformanceService.measureQuery(queryName, queryFn, cacheHit);
};

/**
 * Decorator for service methods to automatically measure performance
 */
export function MeasurePerformance(queryName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const finalQueryName = queryName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return queryPerformanceService.measureQuery(
        finalQueryName,
        () => method.apply(this, args),
        false
      );
    };
  };
}

/**
 * Express middleware to add performance headers
 */
export const addPerformanceHeaders = (req: PerformanceRequest, res: Response, next: NextFunction) => {
  req.startTime = Date.now();

  // Override res.end to add timing header
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    if (req.startTime) {
      const duration = Date.now() - req.startTime;
      res.set('X-Response-Time', `${duration}ms`);
      
      // Add cache status header if available
      if (res.locals.cacheHit !== undefined) {
        res.set('X-Cache-Status', res.locals.cacheHit ? 'HIT' : 'MISS');
      }
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Middleware to detect and log N+1 query patterns
 */
export const detectN1Queries = (req: Request, res: Response, next: NextFunction) => {
  const originalQuery = (global as any).prismaQueryCount || 0;
  
  // Track query count (this would need to be implemented in Prisma middleware)
  res.on('finish', () => {
    const queryCount = (global as any).prismaQueryCount || 0;
    const queriesExecuted = queryCount - originalQuery;
    
    if (queriesExecuted > 10) { // Threshold for potential N+1
      logger.warn(`Potential N+1 query pattern detected: ${queriesExecuted} queries for ${req.method} ${req.path}`);
    }
  });

  next();
};