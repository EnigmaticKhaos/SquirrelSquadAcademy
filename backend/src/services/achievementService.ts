import Achievement from '../models/Achievement';
import UserAchievement from '../models/UserAchievement';
import User from '../models/User';
import Submission from '../models/Submission';
import Project from '../models/Project';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Course from '../models/Course';
import { awardXP, XP_AMOUNTS } from './xpService';
import logger from '../utils/logger';

interface CheckAchievementOptions {
  userId: string;
  triggerType: string; // e.g., 'lesson_completed', 'course_completed', 'project_shared'
  triggerData?: any; // Additional data for checking criteria
}

/**
 * Check if user meets achievement criteria and award if eligible
 */
export const checkAndAwardAchievement = async (
  achievementId: string,
  userId: string,
  triggerData?: any
): Promise<boolean> => {
  try {
    // Check if user already has this achievement
    const existing = await UserAchievement.findOne({
      user: userId,
      achievement: achievementId,
    });

    if (existing) {
      return false; // Already unlocked
    }

    // Get achievement
    const achievement = await Achievement.findById(achievementId);
    if (!achievement || !achievement.isActive) {
      return false;
    }

    // Validate unlock criteria
    const isValid = await validateAchievementCriteria(
      userId,
      achievement.unlockCriteria,
      triggerData
    );

    if (!isValid) {
      return false;
    }

    // Award achievement
    await UserAchievement.create({
      user: userId,
      achievement: achievementId,
      unlockedAt: new Date(),
    });

    // Award XP for achievement
    if (achievement.xpReward > 0) {
      await awardXP({
        userId,
        amount: achievement.xpReward,
        source: 'achievement_unlocked',
        sourceId: achievementId,
        description: `Achievement unlocked: ${achievement.name}`,
      });
    }

    logger.info(`Achievement unlocked: ${achievement.name} by user ${userId}`);

    // Send achievement notification
    import('./notificationService').then(({ createNotification }) => {
      createNotification(userId, 'achievement_unlocked', {
        title: '🏆 Achievement Unlocked!',
        message: `You've unlocked the achievement: ${achievement.name}`,
        actionUrl: `/achievements/${achievementId}`,
        relatedAchievement: achievementId,
        priority: 'high',
        sendEmail: true,
      }).catch((error) => {
        logger.error('Error sending achievement notification:', error);
      });
    });

    return true;
  } catch (error) {
    logger.error('Error checking/awarding achievement:', error);
    return false;
  }
};

/**
 * Validate achievement unlock criteria
 */
export const validateAchievementCriteria = async (
  userId: string,
  criteria: any,
  triggerData?: any
): Promise<boolean> => {
  const { type, value, ...additionalCriteria } = criteria;

  try {
    switch (type) {
      case 'reach_level':
        const user = await User.findById(userId).select('level');
        if (!user) return false;
        return user.level >= value;

      case 'earn_xp':
        const userXP = await User.findById(userId).select('xp');
        if (!userXP) return false;
        return userXP.xp >= value;

      case 'complete_course':
        // Check if user has completed a specific course or any course
        if (value && typeof value === 'string') {
          // Specific course
          const submissions = await Submission.find({
            user: userId,
            course: value,
            status: 'graded',
          }).distinct('course');
          return submissions.length > 0;
        } else {
          // Any course - count completed courses
          const completedCourses = await Submission.find({
            user: userId,
            status: 'graded',
          }).distinct('course');
          return completedCourses.length >= (value || 1);
        }

      case 'complete_lessons':
        // Count lessons completed (via submissions or other tracking)
        // For now, we'll use a placeholder - this would need lesson completion tracking
        return false; // TODO: Implement lesson completion tracking

      case 'complete_assignments':
        const assignmentCount = await Submission.countDocuments({
          user: userId,
          status: 'graded',
        });
        return assignmentCount >= value;

      case 'pass_quizzes':
        // Count passed quizzes (score >= passing threshold)
        const passedQuizzes = await Submission.countDocuments({
          user: userId,
          status: 'graded',
          score: { $gte: additionalCriteria.passingScore || 70 },
        });
        return passedQuizzes >= value;

      case 'share_projects':
        const projectCount = await Project.countDocuments({
          user: userId,
          isPublic: true,
        });
        return projectCount >= value;

      case 'create_posts':
        const postCount = await Post.countDocuments({
          user: userId,
        });
        return postCount >= value;

      case 'receive_likes':
        // Count total likes received on posts and comments
        const posts = await Post.find({ user: userId });
        const comments = await Comment.find({ user: userId });
        const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0) +
          comments.reduce((sum, c) => sum + (c.likesCount || 0), 0);
        return totalLikes >= value;

      case 'maintain_streak':
        // TODO: Implement streak tracking
        return false;

      case 'complete_course_type':
        // Complete courses of a specific type
        const courseType = value;
        const coursesOfType = await Course.find({ courseType, status: 'published' });
        const courseIds = coursesOfType.map(c => c._id);
        const completedOfType = await Submission.find({
          user: userId,
          course: { $in: courseIds },
          status: 'graded',
        }).distinct('course');
        return completedOfType.length >= (additionalCriteria.count || 1);

      case 'project_likes':
        // Projects with minimum likes
        const projectsWithLikes = await Project.countDocuments({
          user: userId,
          isPublic: true,
          likesCount: { $gte: value },
        });
        return projectsWithLikes >= (additionalCriteria.count || 1);

      case 'perfect_score':
        // Achieve perfect score on assignments
        const perfectScores = await Submission.countDocuments({
          user: userId,
          status: 'graded',
          $expr: { $eq: ['$score', '$maxScore'] },
        });
        return perfectScores >= value;

      case 'first_completion':
        // First user to complete a course
        if (triggerData?.courseId) {
          const firstCompletion = await Submission.findOne({
            course: triggerData.courseId,
            status: 'graded',
          }).sort({ gradedAt: 1 });
          return firstCompletion?.user.toString() === userId;
        }
        return false;

      default:
        logger.warn(`Unknown achievement criteria type: ${type}`);
        return false;
    }
  } catch (error) {
    logger.error('Error validating achievement criteria:', error);
    return false;
  }
};

/**
 * Check all achievements for a user based on a trigger event
 */
export const checkAchievementsForTrigger = async (
  options: CheckAchievementOptions
): Promise<string[]> => {
  const { userId, triggerType, triggerData } = options;
  const unlockedAchievementIds: string[] = [];

  try {
    // Get all active achievements that might be relevant to this trigger
    const relevantAchievements = await Achievement.find({
      isActive: true,
      'unlockCriteria.type': {
        $in: getRelevantCriteriaTypes(triggerType),
      },
    });

    // Check each achievement
    for (const achievement of relevantAchievements) {
      const unlocked = await checkAndAwardAchievement(
        achievement._id.toString(),
        userId,
        triggerData
      );
      if (unlocked) {
        unlockedAchievementIds.push(achievement._id.toString());
      }
    }

    return unlockedAchievementIds;
  } catch (error) {
    logger.error('Error checking achievements for trigger:', error);
    return unlockedAchievementIds;
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
 * Get user's achievements
 */
export const getUserAchievements = async (userId: string) => {
  const userAchievements = await UserAchievement.find({ user: userId })
    .populate('achievement')
    .sort({ unlockedAt: -1 });

  return userAchievements;
};

/**
 * Calculate progress towards an achievement
 * Returns { current: number, target: number, percentage: number }
 */
export const calculateAchievementProgress = async (
  userId: string,
  criteria: any
): Promise<{ current: number; target: number; percentage: number }> => {
  const { type, value, ...additionalCriteria } = criteria;

  try {
    let current = 0;
    let target = value || 1;

    switch (type) {
      case 'reach_level':
        const user = await User.findById(userId).select('level');
        current = user?.level || 1;
        break;

      case 'earn_xp':
        const userXP = await User.findById(userId).select('xp');
        current = userXP?.xp || 0;
        break;

      case 'complete_course':
        if (value && typeof value === 'string') {
          // Specific course - check if completed
          const submissions = await Submission.find({
            user: userId,
            course: value,
            status: 'graded',
          }).distinct('course');
          current = submissions.length > 0 ? 1 : 0;
          target = 1;
        } else {
          // Any course - count completed courses
          const completedCourses = await Submission.find({
            user: userId,
            status: 'graded',
          }).distinct('course');
          current = completedCourses.length;
        }
        break;

      case 'complete_lessons':
        // TODO: Implement lesson completion tracking
        current = 0;
        break;

      case 'complete_assignments':
        current = await Submission.countDocuments({
          user: userId,
          status: 'graded',
        });
        break;

      case 'pass_quizzes':
        current = await Submission.countDocuments({
          user: userId,
          status: 'graded',
          score: { $gte: additionalCriteria.passingScore || 70 },
        });
        break;

      case 'share_projects':
        current = await Project.countDocuments({
          user: userId,
          isPublic: true,
        });
        break;

      case 'create_posts':
        current = await Post.countDocuments({
          user: userId,
        });
        break;

      case 'receive_likes':
        const posts = await Post.find({ user: userId });
        const comments = await Comment.find({ user: userId });
        current = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0) +
          comments.reduce((sum, c) => sum + (c.likesCount || 0), 0);
        break;

      case 'maintain_streak':
        // TODO: Implement streak tracking
        current = 0;
        break;

      case 'complete_course_type':
        const courseType = value;
        const coursesOfType = await Course.find({ courseType, status: 'published' });
        const courseIds = coursesOfType.map(c => c._id);
        const completedOfType = await Submission.find({
          user: userId,
          course: { $in: courseIds },
          status: 'graded',
        }).distinct('course');
        current = completedOfType.length;
        target = additionalCriteria.count || 1;
        break;

      case 'project_likes':
        current = await Project.countDocuments({
          user: userId,
          isPublic: true,
          likesCount: { $gte: value },
        });
        target = additionalCriteria.count || 1;
        break;

      case 'perfect_score':
        current = await Submission.countDocuments({
          user: userId,
          status: 'graded',
          $expr: { $eq: ['$score', '$maxScore'] },
        });
        break;

      case 'first_completion':
        // This is a one-time achievement, so progress is either 0 or 1
        current = 0;
        target = 1;
        break;

      default:
        current = 0;
        target = 1;
    }

    // Calculate percentage (capped at 100%)
    const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

    return {
      current,
      target,
      percentage,
    };
  } catch (error) {
    logger.error('Error calculating achievement progress:', error);
    return {
      current: 0,
      target: value || 1,
      percentage: 0,
    };
  }
};

/**
 * Get achievement statistics for a user
 */
export const getUserAchievementStats = async (userId: string) => {
  const totalAchievements = await Achievement.countDocuments({ isActive: true });
  const userAchievements = await UserAchievement.countDocuments({ user: userId });

  const achievementsByTier = await UserAchievement.aggregate([
    { $match: { user: userId } },
    {
      $lookup: {
        from: 'achievements',
        localField: 'achievement',
        foreignField: '_id',
        as: 'achievementData',
      },
    },
    { $unwind: '$achievementData' },
    {
      $group: {
        _id: '$achievementData.tier',
        count: { $sum: 1 },
      },
    },
  ]);

  const achievementsByCategory = await UserAchievement.aggregate([
    { $match: { user: userId } },
    {
      $lookup: {
        from: 'achievements',
        localField: 'achievement',
        foreignField: '_id',
        as: 'achievementData',
      },
    },
    { $unwind: '$achievementData' },
    {
      $group: {
        _id: '$achievementData.category',
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    total: totalAchievements,
    unlocked: userAchievements,
    progress: totalAchievements > 0 ? (userAchievements / totalAchievements) * 100 : 0,
    byTier: achievementsByTier.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as { [key: string]: number }),
    byCategory: achievementsByCategory.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as { [key: string]: number }),
  };
};

