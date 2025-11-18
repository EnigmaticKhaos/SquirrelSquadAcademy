import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public (with privacy checks)
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const user = await User.findById(id)
    .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires -twoFactorSecret -twoFactorBackupCodes');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // TODO: Check privacy settings
  // If profile is private and user is not the owner or a friend, return limited info

  // Populate profile card badge
  const userObj = user.toObject();
  if (user.profileCardBadge) {
    const Badge = (await import('../models/Badge')).default;
    const profileCardBadge = await Badge.findById(user.profileCardBadge);
    userObj.profileCardBadge = profileCardBadge?._id || user.profileCardBadge;
  }

  // Get user badges
  const UserBadge = (await import('../models/UserBadge')).default;
  const userBadges = await UserBadge.find({ user: id })
    .populate('badge')
    .sort({ unlockedAt: -1 })
    .limit(10); // Limit to recent badges for profile

  res.json({
    success: true,
    user: userObj,
    badges: userBadges,
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const {
    bio,
    socialLinks,
    profilePhoto,
    backgroundImage,
  } = req.body;

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const user = await User.findById(userDoc._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Update fields
  if (bio !== undefined) user.bio = bio;
  if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
  if (backgroundImage !== undefined) user.backgroundImage = backgroundImage;
  if (socialLinks) {
    user.socialLinks = {
      ...user.socialLinks,
      ...socialLinks,
    };
  }

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user,
  });
});

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const {
    privacySettings,
    notificationPreferences,
    theme,
    language,
    accessibilityPreferences,
  } = req.body;

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const user = await User.findById(userDoc._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (privacySettings) {
    user.privacySettings = {
      ...user.privacySettings,
      ...privacySettings,
    };
  }

  if (notificationPreferences) {
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...notificationPreferences,
    };
  }

  if (theme) user.theme = theme;
  if (language) user.language = language;

  if (accessibilityPreferences) {
    user.accessibilityPreferences = {
      ...user.accessibilityPreferences,
      ...accessibilityPreferences,
    };
  }

  await user.save();

  res.json({
    success: true,
    message: 'Settings updated successfully',
    settings: {
      privacySettings: user.privacySettings,
      notificationPreferences: user.notificationPreferences,
      theme: user.theme,
      language: user.language,
      accessibilityPreferences: user.accessibilityPreferences,
    },
  });
});

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your password to confirm account deletion',
    });
  }

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const user = await User.findById(userDoc._id).select('+password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Verify password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password',
    });
  }

  // Use the comprehensive deletion service
  const { deleteUserAccount } = await import('../services/dataPrivacyService');
  await deleteUserAccount(userDoc._id.toString());

  res.json({
    success: true,
    message: 'Account and all associated data deleted successfully',
  });
});

// @desc    Get user stats
// @route   GET /api/users/:id/stats
// @access  Public
export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // TODO: Get actual stats from database
  // For now, return basic structure
  const stats = {
    xp: 0,
    achievements: 0,
    badges: 0,
    coursesCompleted: 0,
    // Add more stats as needed
  };

  res.json({
    success: true,
    stats,
  });
});

