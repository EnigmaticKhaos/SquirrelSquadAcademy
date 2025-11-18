import { Request, Response, NextFunction } from 'express';
import { PerformanceMonitor } from '../utils/performance';
import logger from '../utils/logger';

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const label = `${req.method} ${req.path}`;
  PerformanceMonitor.start(label);

  res.on('finish', () => {
    const duration = PerformanceMonitor.end(label, false);
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn(`Slow request: ${label} took ${duration}ms`, {
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode,
      });
    }
  });

  next();
};

