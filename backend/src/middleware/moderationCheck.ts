import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { IUser } from '../models/User';
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

    const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
    if (!userDoc || !userDoc._id) {
      return next();
    }

    const userId = userDoc._id.toString();
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

