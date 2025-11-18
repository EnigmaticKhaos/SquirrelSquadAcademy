import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { generateToken, JWTPayload } from '../utils/jwt';
import { generateEmailVerificationToken, generatePasswordResetToken, hashToken } from '../utils/generateTokens';
import { asyncHandler } from '../middleware/errorHandler';
import logger from '../utils/logger';
import crypto from 'crypto';
import mongoose from 'mongoose';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, username, password, confirmPassword } = req.body;

  // Validation
  if (!email || !username || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters',
    });
  }

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email or username already exists',
    });
  }

  // Generate email verification token
  const emailVerificationToken = generateEmailVerificationToken();
  const hashedToken = hashToken(emailVerificationToken);

  // Create user
  const user = await User.create({
    email,
    username,
    password,
    emailVerificationToken: hashedToken,
    isEmailVerified: false,
  });

  // Send verification email
  try {
    const { sendVerificationEmail } = await import('../services/email/emailService');
    await sendVerificationEmail(user.email, emailVerificationToken);
  } catch (error) {
    // Log error but don't fail registration
    console.error('Error sending verification email:', error);
  }

  // Generate token
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your email.',
    token,
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      isEmailVerified: user.isEmailVerified,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, username, password, twoFactorToken } = req.body;

  // Validation
  if ((!email && !username) || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email/username and password',
    });
  }

  // Find user
  const user = await User.findOne({
    $or: [{ email }, { username }],
  }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    if (!twoFactorToken) {
      return res.status(200).json({
        success: false,
        requiresTwoFactor: true,
        message: '2FA token required',
      });
    }

    // Verify 2FA token
    const { verifyTwoFactorToken, verifyBackupCode } = await import('../utils/twoFactor');
    
    if (user.twoFactorSecret) {
      const isValidToken = verifyTwoFactorToken(twoFactorToken, user.twoFactorSecret);
      const isValidBackup = user.twoFactorBackupCodes?.some(code => 
        verifyBackupCode(twoFactorToken, [code])
      );

      if (!isValidToken && !isValidBackup) {
        return res.status(401).json({
          success: false,
          message: 'Invalid 2FA token',
        });
      }
    }
  }

  // Update online status
  user.onlineStatus = 'online';
  user.lastSeen = new Date();
  await user.save();

  // Generate token
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Update login streak
  import('../services/learningAnalyticsService').then(({ updateLoginStreak }) => {
    updateLoginStreak(user._id.toString()).catch((error) => {
      logger.error('Error updating login streak:', error);
    });
  });

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params;

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token',
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email',
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists for security
    return res.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent',
    });
  }

  // Generate reset token
  const resetToken = generatePasswordResetToken();
  const hashedToken = hashToken(resetToken);

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  // Send password reset email
  try {
    const { sendPasswordResetEmail } = await import('../services/email/emailService');
    await sendPasswordResetEmail(user.email, resetToken);
  } catch (error) {
    // Log error but don't reveal if user exists
    console.error('Error sending password reset email:', error);
  }

  res.json({
    success: true,
    message: 'If an account exists, a password reset email has been sent',
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide password and confirmation',
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters',
    });
  }

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token',
    });
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successful',
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userDoc = req.user as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const user = await User.findById(userDoc._id);

  res.json({
    success: true,
    user,
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userDoc = req.user as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  // Update online status
  const user = await User.findById(userDoc._id);
  if (user) {
    user.onlineStatus = 'offline';
    user.lastSeen = new Date();
    await user.save();
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

