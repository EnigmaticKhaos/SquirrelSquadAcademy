import Referral, { IReferral, ReferralStatus } from '../models/Referral';
import User from '../models/User';
import { awardXP } from './xpService';
import { createNotification } from './notificationService';
import logger from '../utils/logger';
import crypto from 'crypto';

/**
 * Generate unique referral code
 */
const generateReferralCode = (userId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  const userHash = userId.slice(-4).toUpperCase();
  return `REF-${userHash}-${random}-${timestamp.slice(-4)}`;
};

/**
 * Create referral code for user
 */
export const createReferralCode = async (
  userId: string,
  options?: {
    referrerReward?: {
      type: 'xp' | 'subscription_days' | 'badge' | 'achievement';
      amount?: number;
      itemId?: string;
    };
    referredReward?: {
      type: 'xp' | 'subscription_days' | 'badge' | 'achievement';
      amount?: number;
      itemId?: string;
    };
    requiresPurchase?: boolean;
    requiresSubscription?: boolean;
    expiresInDays?: number;
  }
): Promise<IReferral> => {
  try {
    // Check if user already has an active referral code
    const existingReferral = await Referral.findOne({
      referrer: userId,
      status: 'pending',
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });

    if (existingReferral) {
      return existingReferral;
    }

    // Generate unique code
    let code = generateReferralCode(userId);
    let codeExists = await Referral.findOne({ code });
    while (codeExists) {
      code = generateReferralCode(userId);
      codeExists = await Referral.findOne({ code });
    }

    // Calculate expiration date
    const expiresAt = options?.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    // Create referral
    const referral = await Referral.create({
      referrer: userId,
      code,
      referrerReward: options?.referrerReward
        ? {
            ...options.referrerReward,
            granted: false,
          }
        : undefined,
      referredReward: options?.referredReward
        ? {
            ...options.referredReward,
            granted: false,
          }
        : undefined,
      requiresPurchase: options?.requiresPurchase || false,
      requiresSubscription: options?.requiresSubscription || false,
      expiresAt,
      status: 'pending',
    });

    logger.info(`Referral code created: ${code} by user ${userId}`);
    return referral;
  } catch (error) {
    logger.error('Error creating referral code:', error);
    throw error;
  }
};

/**
 * Use referral code
 */
export const useReferralCode = async (
  code: string,
  referredUserId: string
): Promise<IReferral> => {
  try {
    // Find referral
    const referral = await Referral.findOne({ code: code.toUpperCase() });
    if (!referral) {
      throw new Error('Invalid referral code');
    }

    // Check if expired
    if (referral.expiresAt && referral.expiresAt < new Date()) {
      referral.status = 'expired';
      await referral.save();
      throw new Error('Referral code has expired');
    }

    // Check if already used
    if (referral.status === 'completed') {
      throw new Error('Referral code has already been used');
    }

    // Check if user is referring themselves
    if (referral.referrer.toString() === referredUserId) {
      throw new Error('You cannot use your own referral code');
    }

    // Check if user already used a referral code
    const existingReferral = await Referral.findOne({
      referredUser: referredUserId,
      status: 'completed',
    });

    if (existingReferral) {
      throw new Error('You have already used a referral code');
    }

    // Update referral
    referral.referredUser = referredUserId as any;
    referral.status = 'pending'; // Will be completed when conditions are met
    await referral.save();

    // Grant referred user reward immediately if no conditions
    if (!referral.requiresPurchase && !referral.requiresSubscription) {
      await grantReferredReward(referral);
      referral.status = 'completed';
      referral.completedAt = new Date();
      await referral.save();
    }

    logger.info(`Referral code used: ${code} by user ${referredUserId}`);
    return referral;
  } catch (error) {
    logger.error('Error using referral code:', error);
    throw error;
  }
};

/**
 * Complete referral (when conditions are met)
 */
export const completeReferral = async (referralId: string): Promise<IReferral> => {
  try {
    const referral = await Referral.findById(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.status === 'completed') {
      return referral;
    }

    // Grant rewards
    await grantReferredReward(referral);
    await grantReferrerReward(referral);

    // Update status
    referral.status = 'completed';
    referral.completedAt = new Date();
    await referral.save();

    logger.info(`Referral completed: ${referralId}`);
    return referral;
  } catch (error) {
    logger.error('Error completing referral:', error);
    throw error;
  }
};

/**
 * Grant referred user reward
 */
const grantReferredReward = async (referral: IReferral): Promise<void> => {
  try {
    if (!referral.referredReward || referral.referredReward.granted || !referral.referredUser) {
      return;
    }

    const reward = referral.referredReward;
    const userId = referral.referredUser.toString();

    switch (reward.type) {
      case 'xp':
        if (reward.amount) {
          await awardXP({
            userId,
            amount: reward.amount,
            source: 'referral',
            sourceId: referral._id.toString(),
            description: 'Referral reward - XP',
          });
        }
        break;

      case 'subscription_days':
        if (reward.amount) {
          const user = await User.findById(userId);
          if (user && user.subscription.currentPeriodEnd) {
            const newEndDate = new Date(user.subscription.currentPeriodEnd);
            newEndDate.setDate(newEndDate.getDate() + reward.amount);
            user.subscription.currentPeriodEnd = newEndDate;
            await user.save();
          }
        }
        break;

      case 'badge':
      case 'achievement':
        // Would need to integrate with badge/achievement service
        // For now, just log
        logger.info(`Referral reward: ${reward.type} ${reward.itemId} for user ${userId}`);
        break;
    }

    reward.granted = true;
    reward.grantedAt = new Date();
    await referral.save();

    // Send notification
    await createNotification(userId, 'system_announcement', {
      title: '🎁 Referral Reward!',
      message: `You've received a referral reward!`,
      actionUrl: '/profile/referrals',
      priority: 'normal',
    });
  } catch (error) {
    logger.error('Error granting referred reward:', error);
  }
};

/**
 * Grant referrer reward
 */
const grantReferrerReward = async (referral: IReferral): Promise<void> => {
  try {
    if (!referral.referrerReward || referral.referrerReward.granted) {
      return;
    }

    const reward = referral.referrerReward;
    const userId = referral.referrer.toString();

    switch (reward.type) {
      case 'xp':
        if (reward.amount) {
          await awardXP({
            userId,
            amount: reward.amount,
            source: 'referral',
            sourceId: referral._id.toString(),
            description: 'Referral reward - Referrer XP',
          });
        }
        break;

      case 'subscription_days':
        if (reward.amount) {
          const user = await User.findById(userId);
          if (user && user.subscription.currentPeriodEnd) {
            const newEndDate = new Date(user.subscription.currentPeriodEnd);
            newEndDate.setDate(newEndDate.getDate() + reward.amount);
            user.subscription.currentPeriodEnd = newEndDate;
            await user.save();
          }
        }
        break;

      case 'badge':
      case 'achievement':
        // Would need to integrate with badge/achievement service
        logger.info(`Referral reward: ${reward.type} ${reward.itemId} for user ${userId}`);
        break;
    }

    reward.granted = true;
    reward.grantedAt = new Date();
    await referral.save();

    // Send notification
    await createNotification(userId, 'system_announcement', {
      title: '🎉 Referral Successful!',
      message: `Someone used your referral code! You've received a reward.`,
      actionUrl: '/profile/referrals',
      priority: 'normal',
    });
  } catch (error) {
    logger.error('Error granting referrer reward:', error);
  }
};

/**
 * Get user's referral code
 */
export const getUserReferralCode = async (userId: string): Promise<IReferral | null> => {
  try {
    let referral = await Referral.findOne({
      referrer: userId,
      status: { $in: ['pending', 'completed'] },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });

    // Create one if doesn't exist
    if (!referral) {
      referral = await createReferralCode(userId) as any;
    }

    return referral as IReferral | null;
  } catch (error) {
    logger.error('Error getting user referral code:', error);
    return null;
  }
};

/**
 * Get user's referral statistics
 */
export const getUserReferralStats = async (userId: string): Promise<{
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsEarned: number;
  referralCode: string;
}> => {
  try {
    const referral = await getUserReferralCode(userId);
    if (!referral) {
      return {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalRewardsEarned: 0,
        referralCode: '',
      };
    }

    const totalReferrals = await Referral.countDocuments({ referrer: userId });
    const completedReferrals = await Referral.countDocuments({
      referrer: userId,
      status: 'completed',
    });
    const pendingReferrals = await Referral.countDocuments({
      referrer: userId,
      status: 'pending',
    });

    // Calculate total rewards earned (simplified - would need to sum actual rewards)
    const totalRewardsEarned = completedReferrals; // Simplified

    return {
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalRewardsEarned,
      referralCode: referral.code,
    };
  } catch (error) {
    logger.error('Error getting user referral stats:', error);
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalRewardsEarned: 0,
      referralCode: '',
    };
  }
};

/**
 * Get all referrals for a user
 */
export const getUserReferrals = async (
  userId: string,
  options?: {
    status?: ReferralStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{ referrals: IReferral[]; total: number }> => {
  try {
    const query: any = { referrer: userId };

    if (options?.status) {
      query.status = options.status;
    }

    const total = await Referral.countDocuments(query);

    const referrals = await Referral.find(query)
      .populate('referredUser', 'username profilePhoto createdAt')
      .sort({ createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { referrals, total };
  } catch (error) {
    logger.error('Error getting user referrals:', error);
    return { referrals: [], total: 0 };
  }
};

/**
 * Check if referral should be completed (called after purchase/subscription)
 */
export const checkAndCompleteReferral = async (userId: string): Promise<void> => {
  try {
    const referral = await Referral.findOne({
      referredUser: userId,
      status: 'pending',
    });

    if (referral) {
      // Check if conditions are met
      const user = await User.findById(userId);
      if (!user) return;

      let shouldComplete = true;

      if (referral.requiresPurchase) {
        // Check if user has made a purchase (would need to check Stripe/payment records)
        // For now, we'll assume it's met if user has premium subscription
        if (user.subscription.tier !== 'premium') {
          shouldComplete = false;
        }
      }

      if (referral.requiresSubscription) {
        if (user.subscription.tier !== 'premium') {
          shouldComplete = false;
        }
      }

      if (shouldComplete) {
        await completeReferral(referral._id.toString());
      }
    }
  } catch (error) {
    logger.error('Error checking and completing referral:', error);
  }
};

