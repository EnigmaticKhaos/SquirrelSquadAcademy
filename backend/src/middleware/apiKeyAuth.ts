import { Request, Response, NextFunction } from 'express';
import ApiKey from '../models/ApiKey';
import logger from '../utils/logger';

export interface ApiKeyRequest extends Request {
  apiKey?: any;
}

/**
 * Middleware to authenticate API key
 */
export const authenticateApiKey = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKeyHeader = req.headers['x-api-key'] || req.headers['authorization'];

    if (!apiKeyHeader) {
      res.status(401).json({
        success: false,
        message: 'API key is required',
      });
      return;
    }

    // Extract key from header (handle "Bearer sk_..." format)
    const apiKey = typeof apiKeyHeader === 'string'
      ? apiKeyHeader.replace(/^Bearer\s+/i, '').replace(/^sk_/, '')
      : apiKeyHeader[0]?.replace(/^Bearer\s+/i, '').replace(/^sk_/, '');

    if (!apiKey) {
      res.status(401).json({
        success: false,
        message: 'Invalid API key format',
      });
      return;
    }

    // Find API key by prefix (first 8 characters)
    const keyPrefix = apiKey.substring(0, 8);
    const apiKeyDoc = await ApiKey.findOne({ keyPrefix, isActive: true })
      .select('+key');

    if (!apiKeyDoc) {
      res.status(401).json({
        success: false,
        message: 'Invalid API key',
      });
      return;
    }

    // Check expiration
    if (apiKeyDoc.expiresAt && apiKeyDoc.expiresAt < new Date()) {
      res.status(401).json({
        success: false,
        message: 'API key has expired',
      });
      return;
    }

    // Verify key
    if (!apiKeyDoc.compareKey(apiKey)) {
      res.status(401).json({
        success: false,
        message: 'Invalid API key',
      });
      return;
    }

    // Check IP restrictions
    if (apiKeyDoc.allowedIPs && apiKeyDoc.allowedIPs.length > 0) {
      const clientIP = req.ip || req.socket.remoteAddress || '';
      if (!apiKeyDoc.allowedIPs.includes(clientIP)) {
        res.status(403).json({
          success: false,
          message: 'IP address not allowed',
        });
        return;
      }
    }

    // Update usage statistics
    apiKeyDoc.requestCount += 1;
    apiKeyDoc.lastUsedAt = new Date();
    apiKeyDoc.lastRequestIP = req.ip || req.socket.remoteAddress || undefined;
    await apiKeyDoc.save();

    // Attach API key to request
    req.apiKey = apiKeyDoc;
    req.user = { _id: apiKeyDoc.user } as any; // Set user for compatibility

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

/**
 * Middleware to check API key permissions
 */
export const requirePermission = (permission: string) => {
  return (req: ApiKeyRequest, res: Response, next: NextFunction): void => {
    if (!req.apiKey) {
      res.status(401).json({
        success: false,
        message: 'API key authentication required',
      });
      return;
    }

    if (!req.apiKey.permissions.includes(permission) && !req.apiKey.permissions.includes('*')) {
      res.status(403).json({
        success: false,
        message: `Permission denied: ${permission} required`,
      });
      return;
    }

    next();
  };
};

