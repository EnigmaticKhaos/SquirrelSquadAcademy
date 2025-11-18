import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { asyncHandler } from './errorHandler';
import mongoose from 'mongoose';

/**
 * Middleware to enforce privacy settings
 */
export const enforcePrivacySettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Only apply to routes that access user data
  const userId = req.params.id || req.params.userId;
  
  if (!userId || !req.user) {
    return next();
  }

  // Don't enforce privacy for own profile
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId; friends?: mongoose.Types.ObjectId[] };
  if (!userDoc || !userDoc._id) {
    return next();
  }

  if (userId === userDoc._id.toString()) {
    return next();
  }

  const targetUser = await User.findById(userId).select('privacySettings');

  if (!targetUser || !targetUser.privacySettings) {
    return next();
  }

  const privacySettings = targetUser.privacySettings;
  // TODO: Implement friends functionality - for now, assume not friends
  const friendsList = userDoc.friends?.map((f: any) => f.toString()) || [];
  const isFriend = friendsList.includes(userId) || false;

  // Check profile visibility
  if (privacySettings.profileVisibility === 'private' && !isFriend) {
    return res.status(403).json({
      success: false,
      message: 'This profile is private',
    });
  }

  if (privacySettings.profileVisibility === 'friends' && !isFriend) {
    return res.status(403).json({
      success: false,
      message: 'This profile is only visible to friends',
    });
  }

  next();
});

/**
 * Middleware to check if user can message another user
 */
export const canMessageUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  
  if (!userId || !req.user) {
    return next();
  }

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId; friends?: mongoose.Types.ObjectId[] };
  if (!userDoc) {
    return next();
  }

  const targetUser = await User.findById(userId).select('privacySettings');

  if (!targetUser || !targetUser.privacySettings) {
    return next();
  }

  const privacySettings = targetUser.privacySettings;
  // TODO: Implement friends functionality - for now, assume not friends
  const friendsList = userDoc.friends?.map((f: any) => f.toString()) || [];
  const isFriend = friendsList.includes(userId) || false;

  if (privacySettings.whoCanMessage === 'none') {
    return res.status(403).json({
      success: false,
      message: 'This user does not accept messages',
    });
  }

  if (privacySettings.whoCanMessage === 'friends' && !isFriend) {
    return res.status(403).json({
      success: false,
      message: 'This user only accepts messages from friends',
    });
  }

  next();
});

/**
 * Middleware to check activity visibility
 */
export const checkActivityVisibility = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.id || req.params.userId;
  
  if (!userId || !req.user) {
    return next();
  }

  // Don't check for own activity
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId; friends?: mongoose.Types.ObjectId[] };
  if (!userDoc || !userDoc._id) {
    return next();
  }

  if (userId === userDoc._id.toString()) {
    return next();
  }

  const targetUser = await User.findById(userId).select('privacySettings');

  if (!targetUser || !targetUser.privacySettings) {
    return next();
  }

  const privacySettings = targetUser.privacySettings;
  // TODO: Implement friends functionality - for now, assume not friends
  const friendsList = userDoc.friends?.map((f: any) => f.toString()) || [];
  const isFriend = friendsList.includes(userId) || false;

  if (privacySettings.activityVisibility === 'private') {
    return res.status(403).json({
      success: false,
      message: 'This user\'s activity is private',
    });
  }

  if (privacySettings.activityVisibility === 'friends' && !isFriend) {
    return res.status(403).json({
      success: false,
      message: 'This user\'s activity is only visible to friends',
    });
  }

  next();
});

