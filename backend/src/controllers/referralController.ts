import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import {
  createReferralCode,
  useReferralCode,
  getUserReferralCode,
  getUserReferralStats,
  getUserReferrals,
  checkAndCompleteReferral,
} from '../services/referralService';

// @desc    Get or create user referral code
// @route   GET /api/referrals/code
// @access  Private
export const getReferralCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();

  const referral = await getUserReferralCode(userId);

  if (!referral) {
    return res.status(404).json({
      success: false,
      message: 'Referral code not found',
    });
  }

  res.json({
    success: true,
    referral: {
      code: referral.code,
      status: referral.status,
      expiresAt: referral.expiresAt,
      referrerReward: referral.referrerReward,
      referredReward: referral.referredReward,
    },
  });
});

// @desc    Use referral code
// @route   POST /api/referrals/use
// @access  Private
export const useReferral = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;
  const userId = req.user._id.toString();

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Referral code is required',
    });
  }

  const referral = await useReferralCode(code, userId);

  res.json({
    success: true,
    message: 'Referral code applied successfully',
    referral: {
      code: referral.code,
      status: referral.status,
      referredReward: referral.referredReward,
    },
  });
});

// @desc    Get user referral statistics
// @route   GET /api/referrals/stats
// @access  Private
export const getReferralStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();

  const stats = await getUserReferralStats(userId);

  res.json({
    success: true,
    stats,
  });
});

// @desc    Get user referrals
// @route   GET /api/referrals
// @access  Private
export const getReferrals = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { status, limit = 50, offset = 0 } = req.query;

  const { referrals, total } = await getUserReferrals(userId, {
    status: status as any,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    count: referrals.length,
    total,
    referrals,
  });
});

// @desc    Create custom referral code (with custom rewards)
// @route   POST /api/referrals/create
// @access  Private
export const createCustomReferral = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const {
    referrerReward,
    referredReward,
    requiresPurchase,
    requiresSubscription,
    expiresInDays,
  } = req.body;

  const referral = await createReferralCode(userId, {
    referrerReward,
    referredReward,
    requiresPurchase,
    requiresSubscription,
    expiresInDays,
  });

  res.status(201).json({
    success: true,
    message: 'Referral code created successfully',
    referral,
  });
});

