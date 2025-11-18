import { Request, Response } from 'express';
import Achievement from '../models/Achievement';
import UserAchievement from '../models/UserAchievement';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import {
  getUserAchievements,
  getUserAchievementStats,
  checkAndAwardAchievement,
  calculateAchievementProgress,
} from '../services/achievementService';

// @desc    Get all achievements
// @route   GET /api/achievements
// @access  Public
export const getAchievements = asyncHandler(async (req: Request, res: Response) => {
  const { tier, category, isActive, page = 1, limit = 50 } = req.query;

  const query: any = {};
  if (tier) query.tier = tier;
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const skip = (Number(page) - 1) * Number(limit);

  const achievements = await Achievement.find(query)
    .sort({ tier: 1, category: 1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Achievement.countDocuments(query);

  res.json({
    success: true,
    count: achievements.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    achievements,
  });
});

// @desc    Get single achievement
// @route   GET /api/achievements/:id
// @access  Public
export const getAchievement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.query;

  const achievement = await Achievement.findById(id);

  if (!achievement) {
    return res.status(404).json({
      success: false,
      message: 'Achievement not found',
    });
  }

  let unlocked = false;
  let progress = null;

  if (userId) {
    const userIdStr = typeof userId === 'string' ? userId : String(userId);
    // Check if user has unlocked this achievement
    const userAchievement = await UserAchievement.findOne({
      user: userIdStr,
      achievement: id,
    });
    unlocked = !!userAchievement;

    // Calculate progress if not unlocked
    if (!unlocked) {
      progress = await calculateAchievementProgress(userIdStr, achievement.unlockCriteria);
    }
  }

  res.json({
    success: true,
    achievement: {
      ...achievement.toObject(),
      unlocked,
      progress,
    },
  });
});

// @desc    Create achievement (Admin only)
// @route   POST /api/achievements
// @access  Private/Admin
export const createAchievement = asyncHandler(async (req: Request, res: Response) => {
  const achievement = await Achievement.create(req.body);

  res.status(201).json({
    success: true,
    achievement,
  });
});

// @desc    Update achievement (Admin only)
// @route   PUT /api/achievements/:id
// @access  Private/Admin
export const updateAchievement = asyncHandler(async (req: Request, res: Response) => {
  const achievement = await Achievement.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!achievement) {
    return res.status(404).json({
      success: false,
      message: 'Achievement not found',
    });
  }

  res.json({
    success: true,
    achievement,
  });
});

// @desc    Delete achievement (Admin only)
// @route   DELETE /api/achievements/:id
// @access  Private/Admin
export const deleteAchievement = asyncHandler(async (req: Request, res: Response) => {
  const achievement = await Achievement.findById(req.params.id);

  if (!achievement) {
    return res.status(404).json({
      success: false,
      message: 'Achievement not found',
    });
  }

  await achievement.deleteOne();

  res.json({
    success: true,
    message: 'Achievement deleted successfully',
  });
});

// @desc    Get user's achievements
// @route   GET /api/achievements/user/:userId
// @access  Public
export const getUserAchievementsList = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { tier, category, includeProgress } = req.query;

  let query: any = { user: userId };
  
  // If filtering by tier or category, we need to join with Achievement
  if (tier || category) {
    const achievementQuery: any = {};
    if (tier) achievementQuery.tier = tier;
    if (category) achievementQuery.category = category;

    const achievements = await Achievement.find(achievementQuery).select('_id');
    const achievementIds = achievements.map(a => a._id);
    query.achievement = { $in: achievementIds };
  }

  const userAchievements = await UserAchievement.find(query)
    .populate('achievement')
    .sort({ unlockedAt: -1 });

  // Optionally include progress for all achievements (including locked ones)
  let achievementsWithProgress: any[] = userAchievements;
  if (includeProgress === 'true') {
    const allAchievements = await Achievement.find({ isActive: true });
    const unlockedAchievementIds = userAchievements.map(ua => ua.achievement._id.toString());
    
    achievementsWithProgress = await Promise.all(
      allAchievements.map(async (achievement) => {
        const unlocked = unlockedAchievementIds.includes(achievement._id.toString());
        const userAchievement = userAchievements.find(
          ua => ua.achievement._id.toString() === achievement._id.toString()
        );

        if (unlocked && userAchievement) {
          return {
            ...userAchievement.toObject(),
            progress: { current: achievement.unlockCriteria.value || 1, target: achievement.unlockCriteria.value || 1, percentage: 100 },
          };
        } else {
          const progress = await calculateAchievementProgress(userId, achievement.unlockCriteria);
          return {
            achievement: achievement.toObject(),
            unlocked: false,
            progress,
          };
        }
      })
    );
  }

  res.json({
    success: true,
    count: achievementsWithProgress.length,
    achievements: achievementsWithProgress,
  });
});

// @desc    Get user's achievement statistics
// @route   GET /api/achievements/user/:userId/stats
// @access  Public
export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const stats = await getUserAchievementStats(userId);

  res.json({
    success: true,
    stats,
  });
});

// @desc    Get achievement gallery (all achievements with user's unlock status and progress)
// @route   GET /api/achievements/gallery/:userId?
// @access  Public
export const getAchievementGallery = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { tier, category } = req.query;

  const query: any = { isActive: true };
  if (tier) query.tier = tier;
  if (category) query.category = category;

  const achievements = await Achievement.find(query).sort({ tier: 1, category: 1 });

  let userAchievementIds: string[] = [];
  if (userId) {
    const userAchievements = await UserAchievement.find({ user: userId }).select('achievement');
    userAchievementIds = userAchievements.map(ua => ua.achievement.toString());
  }

  // Calculate progress for each achievement
  const gallery = await Promise.all(
    achievements.map(async (achievement) => {
      const unlocked = userId ? userAchievementIds.includes(achievement._id.toString()) : false;
      
      let progress = null;
      if (userId && !unlocked) {
        // Only calculate progress for locked achievements
        progress = await calculateAchievementProgress(userId, achievement.unlockCriteria);
      }

      return {
        ...achievement.toObject(),
        unlocked,
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

// @desc    Manually check and award achievement (Admin only, for testing)
// @route   POST /api/achievements/:id/check/:userId
// @access  Private/Admin
export const manuallyCheckAchievement = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId } = req.params;
  const { triggerData } = req.body;

  const unlocked = await checkAndAwardAchievement(id, userId, triggerData);

  if (unlocked) {
    res.json({
      success: true,
      message: 'Achievement unlocked',
    });
  } else {
    res.json({
      success: false,
      message: 'Achievement criteria not met or already unlocked',
    });
  }
});

