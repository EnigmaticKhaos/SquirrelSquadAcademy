import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Badge from '../models/Badge';
import UserBadge from '../models/UserBadge';
import { IUser } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import {
  getUserBadges,
  checkAndAwardBadge,
  setProfileCardBadge,
  removeProfileCardBadge,
  calculateBadgeProgress,
} from '../services/badgeService';

// @desc    Get all badges
// @route   GET /api/badges
// @access  Public
export const getBadges = asyncHandler(async (req: Request, res: Response) => {
  const { category, isActive, page = 1, limit = 50 } = req.query;

  const query: any = {};
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const skip = (Number(page) - 1) * Number(limit);

  const badges = await Badge.find(query)
    .sort({ category: 1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Badge.countDocuments(query);

  res.json({
    success: true,
    count: badges.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    badges,
  });
});

// @desc    Get single badge
// @route   GET /api/badges/:id
// @access  Public
export const getBadge = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.query;

  const badge = await Badge.findById(id);

  if (!badge) {
    return res.status(404).json({
      success: false,
      message: 'Badge not found',
    });
  }

  let unlocked = false;
  let progress = null;

  if (userId) {
    const userIdStr = typeof userId === 'string' ? userId : String(userId);
    // Check if user has unlocked this badge
    const userBadge = await UserBadge.findOne({
      user: userIdStr,
      badge: id,
    });
    unlocked = !!userBadge;

    // Calculate progress if not unlocked
    if (!unlocked) {
      progress = await calculateBadgeProgress(userIdStr, badge.unlockCriteria);
    }
  }

  res.json({
    success: true,
    badge: {
      ...badge.toObject(),
      unlocked,
      progress,
    },
  });
});

// @desc    Create badge (Admin only)
// @route   POST /api/badges
// @access  Private/Admin
export const createBadge = asyncHandler(async (req: Request, res: Response) => {
  const badge = await Badge.create(req.body);

  res.status(201).json({
    success: true,
    badge,
  });
});

// @desc    Update badge (Admin only)
// @route   PUT /api/badges/:id
// @access  Private/Admin
export const updateBadge = asyncHandler(async (req: Request, res: Response) => {
  const badge = await Badge.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!badge) {
    return res.status(404).json({
      success: false,
      message: 'Badge not found',
    });
  }

  res.json({
    success: true,
    badge,
  });
});

// @desc    Delete badge (Admin only)
// @route   DELETE /api/badges/:id
// @access  Private/Admin
export const deleteBadge = asyncHandler(async (req: Request, res: Response) => {
  const badge = await Badge.findById(req.params.id);

  if (!badge) {
    return res.status(404).json({
      success: false,
      message: 'Badge not found',
    });
  }

  await badge.deleteOne();

  res.json({
    success: true,
    message: 'Badge deleted successfully',
  });
});

// @desc    Get user's badges
// @route   GET /api/badges/user/:userId
// @access  Public
export const getUserBadgesList = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { category, includeProgress } = req.query;

  let query: any = { user: userId };
  
  // If filtering by category, we need to join with Badge
  if (category) {
    const badges = await Badge.find({ category }).select('_id');
    const badgeIds = badges.map(b => b._id);
    query.badge = { $in: badgeIds };
  }

  const userBadges = await UserBadge.find(query)
    .populate('badge')
    .sort({ unlockedAt: -1 });

  // Optionally include progress for all badges (including locked ones)
  let badgesWithProgress: any[] = userBadges;
  if (includeProgress === 'true') {
    const allBadges = await Badge.find({ isActive: true });
    const unlockedBadgeIds = userBadges.map(ub => ub.badge._id.toString());
    
    badgesWithProgress = await Promise.all(
      allBadges.map(async (badge) => {
        const unlocked = unlockedBadgeIds.includes(badge._id.toString());
        const userBadge = userBadges.find(
          ub => ub.badge._id.toString() === badge._id.toString()
        );

        if (unlocked && userBadge) {
          return {
            ...userBadge.toObject(),
            progress: { current: badge.unlockCriteria.value || 1, target: badge.unlockCriteria.value || 1, percentage: 100 },
          };
        } else {
          const progress = await calculateBadgeProgress(userId, badge.unlockCriteria);
          return {
            badge: badge.toObject(),
            unlocked: false,
            progress,
          };
        }
      })
    );
  }

  res.json({
    success: true,
    count: badgesWithProgress.length,
    badges: badgesWithProgress,
  });
});

// @desc    Get badge gallery (all badges with user's unlock status and progress)
// @route   GET /api/badges/gallery/:userId?
// @access  Public
export const getBadgeGallery = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { category } = req.query;

  const query: any = { isActive: true };
  if (category) query.category = category;

  const badges = await Badge.find(query).sort({ category: 1 });

  let userBadgeIds: string[] = [];
  let profileCardBadgeId: string | null = null;
  if (userId) {
    const userBadges = await UserBadge.find({ user: userId }).select('badge isProfileCardBadge');
    userBadgeIds = userBadges.map(ub => ub.badge.toString());
    const profileCardBadge = userBadges.find(ub => ub.isProfileCardBadge);
    profileCardBadgeId = profileCardBadge ? profileCardBadge.badge.toString() : null;
  }

  // Calculate progress for each badge
  const gallery = await Promise.all(
    badges.map(async (badge) => {
      const unlocked = userId ? userBadgeIds.includes(badge._id.toString()) : false;
      const isProfileCardBadge = userId ? badge._id.toString() === profileCardBadgeId : false;
      
      let progress = null;
      if (userId && !unlocked) {
        // Only calculate progress for locked badges
        progress = await calculateBadgeProgress(userId, badge.unlockCriteria);
      }

      return {
        ...badge.toObject(),
        unlocked,
        isProfileCardBadge,
        progress,
      };
    })
  );

  res.json({
    success: true,
    count: gallery.length,
    gallery,
  });
});

// @desc    Set profile card badge
// @route   PUT /api/badges/:id/set-profile-card
// @access  Private
export const setProfileCard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  await setProfileCardBadge(userId, id);

  res.json({
    success: true,
    message: 'Profile card badge updated successfully',
  });
});

// @desc    Remove profile card badge
// @route   DELETE /api/badges/profile-card
// @access  Private
export const removeProfileCard = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  await removeProfileCardBadge(userId);

  res.json({
    success: true,
    message: 'Profile card badge removed successfully',
  });
});

// @desc    Manually check and award badge (Admin only, for testing)
// @route   POST /api/badges/:id/check/:userId
// @access  Private/Admin
export const manuallyCheckBadge = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId } = req.params;
  const { triggerData } = req.body;

  const unlocked = await checkAndAwardBadge(id, userId, triggerData);

  if (unlocked) {
    res.json({
      success: true,
      message: 'Badge unlocked',
    });
  } else {
    res.json({
      success: false,
      message: 'Badge criteria not met or already unlocked',
    });
  }
});

