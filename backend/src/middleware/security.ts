import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import logger from '../utils/logger';

/**
 * Security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
      frameSrc: ["'self'", 'https://www.youtube.com', 'https://player.vimeo.com'],
      mediaSrc: ["'self'", 'https:', 'blob:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for videos
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow resources from different origins
});

/**
 * Prevent NoSQL injection attacks
 */
export const preventNoSqlInjection = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn(`NoSQL injection attempt detected: ${key} in ${req.path}`);
  },
});

/**
 * Prevent XSS attacks
 */
export const preventXSS = xss();

/**
 * Prevent HTTP Parameter Pollution
 */
export const preventHPP = hpp({
  whitelist: [
    'page',
    'limit',
    'sort',
    'fields',
    'search',
    'courseType',
    'difficulty',
    'category',
    'tags',
  ],
});

/**
 * Configure trust proxy setting (for rate limiting behind reverse proxy)
 * This should be called on the Express app instance, not used as middleware
 */
export const configureTrustProxy = (app: any) => {
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
};

