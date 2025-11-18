import { Request, Response, NextFunction } from 'express';
import { checkUserModerationStatus } from '../services/moderationService';
import { asyncHandler } from './errorHandler';

/**
 * Middleware to check if user is banned or suspended
 */
export const checkModerationStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const status = await checkUserModerationStatus(userId);

    if (!status.canAccess) {
      return res.status(403).json({
        success: false,
        message: status.reason || 'Account access restricted',
        until: status.until,
      });
    }

    next();
  }
);

