import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { generateTwoFactorSecret, verifyTwoFactorToken, verifyBackupCode } from '../utils/twoFactor';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import mongoose from 'mongoose';

// @desc    Enable 2FA
// @route   POST /api/auth/2fa/enable
// @access  Private
export const enable2FA = asyncHandler(async (req: Request, res: Response) => {
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

  if (user.twoFactorEnabled) {
    return res.status(400).json({
      success: false,
      message: '2FA is already enabled',
    });
  }

  const twoFactorData = await generateTwoFactorSecret(user.email);

  // Store secret temporarily (user needs to verify before enabling)
  user.twoFactorSecret = twoFactorData.secret;
  user.twoFactorBackupCodes = twoFactorData.backupCodes;
  await user.save();

  res.json({
    success: true,
    message: '2FA secret generated. Please verify to enable.',
    qrCodeUrl: twoFactorData.qrCodeUrl,
    backupCodes: twoFactorData.backupCodes,
  });
});

// @desc    Verify and enable 2FA
// @route   POST /api/auth/2fa/verify
// @access  Private
export const verifyAndEnable2FA = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a verification token',
    });
  }

  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const user = await User.findById(userDoc._id);

  if (!user || !user.twoFactorSecret) {
    return res.status(400).json({
      success: false,
      message: '2FA secret not found. Please generate a new one.',
    });
  }

  const isValid = verifyTwoFactorToken(token, user.twoFactorSecret);

  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification token',
    });
  }

  user.twoFactorEnabled = true;
  await user.save();

  res.json({
    success: true,
    message: '2FA enabled successfully',
    backupCodes: user.twoFactorBackupCodes,
  });
});

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
export const disable2FA = asyncHandler(async (req: Request, res: Response) => {
  const { password, token } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your password',
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
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password',
    });
  }

  // If 2FA is enabled, require token
  if (user.twoFactorEnabled && token) {
    if (user.twoFactorSecret) {
      const isValidToken = verifyTwoFactorToken(token, user.twoFactorSecret);
      const isValidBackup = user.twoFactorBackupCodes?.some(code => verifyBackupCode(token, [code]));

      if (!isValidToken && !isValidBackup) {
        return res.status(401).json({
          success: false,
          message: 'Invalid 2FA token',
        });
      }
    }
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorBackupCodes = undefined;
  await user.save();

  res.json({
    success: true,
    message: '2FA disabled successfully',
  });
});

// @desc    Get 2FA status
// @route   GET /api/auth/2fa/status
// @access  Private
export const get2FAStatus = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const user = await User.findById(userDoc._id);

  res.json({
    success: true,
    twoFactorEnabled: user?.twoFactorEnabled || false,
  });
});

