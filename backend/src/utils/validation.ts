import validator from 'validator';
import { Request, Response, NextFunction } from 'express';
import logger from './logger';

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  return validator.escape(validator.trim(input));
};

/**
 * Sanitize email
 */
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') {
    return '';
  }
  return validator.normalizeEmail(validator.trim(email)) || '';
};

/**
 * Sanitize URL
 */
export const sanitizeURL = (url: string): string => {
  if (typeof url !== 'string') {
    return '';
  }
  return validator.trim(url);
};

/**
 * Validate and sanitize object recursively
 */
export const sanitizeObject = (obj: any, maxDepth: number = 10, currentDepth: number = 0): any => {
  if (currentDepth > maxDepth) {
    logger.warn('Sanitization depth exceeded');
    return {};
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, maxDepth, currentDepth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Sanitize key
        const sanitizedKey = sanitizeString(key);
        sanitized[sanitizedKey] = sanitizeObject(obj[key], maxDepth, currentDepth + 1);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

/**
 * Validate URL format
 */
export const isValidURL = (url: string): boolean => {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
  });
};

/**
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return validator.isMongoId(id);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate username
 */
export const isValidUsername = (username: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  if (username.length > 30) {
    errors.push('Username cannot exceed 30 characters');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize request body
 */
export const sanitizeRequestBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Validate file type
 */
export const isValidFileType = (
  mimetype: string,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(mimetype);
};

/**
 * Validate file size
 */
export const isValidFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

/**
 * Validate and sanitize HTML content (for rich text)
 */
export const sanitizeHTML = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  // For now, we'll do basic escaping
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

