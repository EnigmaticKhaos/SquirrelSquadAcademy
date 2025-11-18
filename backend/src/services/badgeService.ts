import Badge from '../models/Badge';
import UserBadge from '../models/UserBadge';
import User from '../models/User';
import Submission from '../models/Submission';
import Project from '../models/Project';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Course from '../models/Course';
import { awardXP, XP_AMOUNTS } from './xpService';
import { validateAchievementCriteria } from './achievementService'; // Reuse validation logic
import logger from '../utils/logger';

interface CheckBadgeOptions {
  userId: string;
  triggerType: string;
  triggerData?: any;
}

/**
 * Check if user meets badge criteria and award if eligible
 */
export const checkAndAwardBadge = async (
  badgeId: string,
  userId: string,
  triggerData?: any
): Promise<boolean> => {
  try {
    // Check if user already has this badge
    const existing = await UserBadge.findOne({
      user: userId,
      badge: badgeId,
    });

    if (existing) {
      return false; // Already unlocked
    }

    // Get badge
    const badge = await Badge.findById(badgeId);
    if (!badge || !badge.isActive) {
      return false;
    }

    // Validate unlock criteria (reuse achievement validation logic)
    const isValid = await validateAchievementCriteria(
      userId,
      badge.unlockCriteria,
      triggerData
    );

    if (!isValid) {
      return false;
    }

    // Award badge
    await UserBadge.create({
      user: userId,
      badge: badgeId,
      unlockedAt: new Date(),
    });

    // Award XP for badge
    await awardXP({
      userId,
      amount: XP_AMOUNTS.BADGE_EARNED,
      source: 'badge_earned',
      sourceId: badgeId,
      description: `Badge earned: ${badge.name}`,
    });

    logger.info(`Badge earned: ${badge.name} by user ${userId}`);

    // Send badge notification
    import('./notificationService').then(({ createNotification }) => {
      createNotification(userId, 'badge_earned', {
        title: '🎖️ Badge Earned!',
        message: `You've earned the badge: ${badge.name}`,
        actionUrl: `/badges/${badgeId}`,
        relatedBadge: badgeId,
        priority: 'high',
        sendEmail: true,
      }).catch((error) => {
        logger.error('Error sending badge notification:', error);
      });
    });

    return true;
  } catch (error) {
    logger.error('Error checking/awarding badge:', error);
    return false;
  }
};

/**
 * Check all badges for a user based on a trigger event
 */
export const checkBadgesForTrigger = async (
  options: CheckBadgeOptions
): Promise<string[]> => {
  const { userId, triggerType, triggerData } = options;
  const unlockedBadgeIds: string[] = [];

  try {
    // Get all active badges that might be relevant to this trigger
    const relevantBadges = await Badge.find({
      isActive: true,
      'unlockCriteria.type': {
        $in: getRelevantCriteriaTypes(triggerType),
      },
    });

    // Check each badge
    for (const badge of relevantBadges) {
      const unlocked = await checkAndAwardBadge(
        badge._id.toString(),
        userId,
        triggerData
      );
      if (unlocked) {
        unlockedBadgeIds.push(badge._id.toString());
      }
    }

    return unlockedBadgeIds;
  } catch (error) {
    logger.error('Error checking badges for trigger:', error);
    return unlockedBadgeIds;
  }
};

/**
 * Get relevant criteria types based on trigger type
 */
const getRelevantCriteriaTypes = (triggerType: string): string[] => {
  const mapping: { [key: string]: string[] } = {
    lesson_completed: ['complete_lessons', 'earn_xp', 'reach_level'],
    course_completed: ['complete_course', 'complete_course_type', 'first_completion'],
    assignment_submitted: ['complete_assignments', 'perfect_score'],
    quiz_passed: ['pass_quizzes', 'perfect_score'],
    project_shared: ['share_projects', 'project_likes'],
    post_created: ['create_posts'],
    like_received: ['receive_likes'],
    daily_login: ['maintain_streak', 'earn_xp'],
    xp_earned: ['earn_xp', 'reach_level'],
    level_up: ['reach_level'],
  };

  return mapping[triggerType] || [];
};

/**
 * Get user's badges
 */
export const getUserBadges = async (userId: string) => {
  const userBadges = await UserBadge.find({ user: userId })
    .populate('badge')
    .sort({ unlockedAt: -1 });

  return userBadges;
};

/**
 * Set profile card badge
 */
export const setProfileCardBadge = async (
  userId: string,
  badgeId: string
): Promise<boolean> => {
  try {
    // Check if user has this badge
    const userBadge = await UserBadge.findOne({
      user: userId,
      badge: badgeId,
    });

    if (!userBadge) {
      throw new Error('User does not have this badge');
    }

    // Unset all other profile card badges for this user
    await UserBadge.updateMany(
      { user: userId, isProfileCardBadge: true },
      { isProfileCardBadge: false }
    );

    // Set this badge as profile card badge
    userBadge.isProfileCardBadge = true;
    await userBadge.save();

    // Update user's profileCardBadge reference
    await User.findByIdAndUpdate(userId, {
      profileCardBadge: badgeId,
    });

    return true;
  } catch (error) {
    logger.error('Error setting profile card badge:', error);
    throw error;
  }
};

/**
 * Remove profile card badge
 */
export const removeProfileCardBadge = async (userId: string): Promise<boolean> => {
  try {
    // Unset all profile card badges for this user
    await UserBadge.updateMany(
      { user: userId, isProfileCardBadge: true },
      { isProfileCardBadge: false }
    );

    // Remove from user's profileCardBadge reference
    await User.findByIdAndUpdate(userId, {
      $unset: { profileCardBadge: '' },
    });

    return true;
  } catch (error) {
    logger.error('Error removing profile card badge:', error);
    throw error;
  }
};

/**
 * Calculate progress towards a badge (similar to achievements)
 */
export const calculateBadgeProgress = async (
  userId: string,
  criteria: any
): Promise<{ current: number; target: number; percentage: number }> => {
  // Reuse achievement progress calculation logic
  const { calculateAchievementProgress } = await import('./achievementService');
  return calculateAchievementProgress(userId, criteria);
};

