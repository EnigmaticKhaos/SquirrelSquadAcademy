import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

// More lenient limits in development
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Much higher limit in development (1000 vs 100)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 5, // More lenient in development (50 vs 5)
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
    });
  },
});

/**
 * Strict rate limiter for password reset
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again later.',
    });
  },
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 200 : 20, // More lenient in development (200 vs 20)
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many file uploads, please try again later.',
    });
  },
});

/**
 * Rate limiter for AI operations (expensive)
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 500 : 50, // More lenient in development (500 vs 50)
  message: {
    success: false,
    message: 'Too many AI requests, please try again later.',
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`AI rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many AI requests, please try again later.',
    });
  },
});

/**
 * Rate limiter for public API
 */
export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for API keys
  message: {
    success: false,
    message: 'API rate limit exceeded, please try again later.',
  },
  keyGenerator: (req: Request) => {
    // Use API key if available, otherwise use IP
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    return apiKey ? `api:${apiKey}` : req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Public API rate limit exceeded`);
    res.status(429).json({
      success: false,
      message: 'API rate limit exceeded, please try again later.',
    });
  },
});

