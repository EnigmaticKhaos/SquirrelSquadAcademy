import LearningPath from '../models/LearningPath';
import LearningPathProgress from '../models/LearningPathProgress';
import Course from '../models/Course';
import CourseEnrollment from '../models/CourseEnrollment';
import CourseCompletion from '../models/CourseCompletion';
import { awardXP } from './xpService';
import { checkAchievementsForTrigger } from './achievementService';
import { checkBadgesForTrigger } from './badgeService';
import { checkGoalsForTrigger } from './learningGoalService';
import { checkChallengesForTrigger } from './challengeService';
import logger from '../utils/logger';

/**
 * Check if user can start a learning path
 */
export const canStartLearningPath = async (
  userId: string,
  pathId: string
): Promise<{ canStart: boolean; reason?: string }> => {
  try {
    const path = await LearningPath.findById(pathId);
    if (!path) {
      return { canStart: false, reason: 'Learning path not found' };
    }

    if (!path.isActive) {
      return { canStart: false, reason: 'Learning path is not active' };
    }

    // Check prerequisites (other learning paths)
    if (path.prerequisites && path.prerequisites.length > 0) {
      const userProgress = await LearningPathProgress.find({
        user: userId,
        learningPath: { $in: path.prerequisites },
        status: 'completed',
      });

      if (userProgress.length < path.prerequisites.length) {
        return { canStart: false, reason: 'Prerequisites not met' };
      }
    }

    // Check required courses
    if (path.requiredCourses && path.requiredCourses.length > 0) {
      const completedCourses = await CourseCompletion.find({
        user: userId,
        course: { $in: path.requiredCourses },
        passed: true,
      });

      if (completedCourses.length < path.requiredCourses.length) {
        return { canStart: false, reason: 'Required courses not completed' };
      }
    }

    return { canStart: true };
  } catch (error) {
    logger.error('Error checking if user can start learning path:', error);
    return { canStart: false, reason: 'Error checking prerequisites' };
  }
};

/**
 * Start a learning path
 */
export const startLearningPath = async (
  userId: string,
  pathId: string
): Promise<LearningPathProgress> => {
  try {
    const canStart = await canStartLearningPath(userId, pathId);
    if (!canStart.canStart) {
      throw new Error(canStart.reason || 'Cannot start learning path');
    }

    // Check if already started
    let progress = await LearningPathProgress.findOne({
      user: userId,
      learningPath: pathId,
    });

    if (progress) {
      if (progress.status === 'paused') {
        progress.status = 'in_progress';
        progress.lastAccessedAt = new Date();
        await progress.save();
      }
      return progress;
    }

    // Create new progress
    progress = await LearningPathProgress.create({
      user: userId,
      learningPath: pathId,
      currentCourseIndex: 0,
      completedCourses: [],
      progressPercentage: 0,
      status: 'in_progress',
      startedAt: new Date(),
      lastAccessedAt: new Date(),
    });

    // Increment enrollment count
    const path = await LearningPath.findById(pathId);
    if (path) {
      path.enrollmentCount += 1;
      await path.save();
    }

    logger.info(`User ${userId} started learning path ${pathId}`);
    return progress;
  } catch (error) {
    logger.error('Error starting learning path:', error);
    throw error;
  }
};

/**
 * Update learning path progress
 */
export const updateLearningPathProgress = async (
  userId: string,
  pathId: string
): Promise<LearningPathProgress | null> => {
  try {
    const path = await LearningPath.findById(pathId);
    if (!path) {
      return null;
    }

    let progress = await LearningPathProgress.findOne({
      user: userId,
      learningPath: pathId,
    });

    if (!progress || progress.status === 'completed') {
      return progress;
    }

    // Get completed courses for this path
    const pathCourseIds = path.courses.map((c) => c.course);
    const completedCourses = await CourseCompletion.find({
      user: userId,
      course: { $in: pathCourseIds },
      passed: true,
    }).distinct('course');

    // Calculate progress
    const totalCourses = path.courses.length;
    const completedCount = completedCourses.length;
    const progressPercentage = totalCourses > 0
      ? Math.round((completedCount / totalCourses) * 100)
      : 0;

    // Find current course index (first incomplete course)
    let currentCourseIndex = 0;
    for (let i = 0; i < path.courses.length; i++) {
      const courseId = path.courses[i].course.toString();
      if (!completedCourses.some((id) => id.toString() === courseId)) {
        currentCourseIndex = i;
        break;
      }
      currentCourseIndex = i + 1;
    }

    // Check for completed milestones
    if (path.milestones) {
      for (const milestone of path.milestones) {
        const alreadyCompleted = progress.completedMilestones.some(
          (m) => m.milestoneIndex === path.milestones!.indexOf(milestone)
        );

        if (!alreadyCompleted && completedCount > milestone.courseIndex) {
          progress.completedMilestones.push({
            milestoneIndex: path.milestones.indexOf(milestone),
            completedAt: new Date(),
          });

          // Award milestone XP
          if (milestone.xpReward && milestone.xpReward > 0) {
            await awardXP({
              userId,
              amount: milestone.xpReward,
              source: 'learning_path_milestone',
              sourceId: pathId,
              description: `Milestone reached: ${milestone.name}`,
            });
          }
        }
      }
    }

    // Check if path is completed
    if (progressPercentage === 100 && progress.status !== 'completed') {
      progress.status = 'completed';
      progress.completedAt = new Date();
      progress.currentCourseIndex = totalCourses;

      // Award completion XP
      const completionXP = 1000; // Base XP for completing a learning path
      await awardXP({
        userId,
        amount: completionXP,
        source: 'learning_path_completed',
        sourceId: pathId,
        description: `Completed learning path: ${path.name}`,
      });

      // Check achievements, badges, goals, and challenges
      await checkAchievementsForTrigger({
        userId,
        triggerType: 'learning_path_completed',
        triggerData: {
          pathId,
          pathName: path.name,
        },
      });

      await checkBadgesForTrigger({
        userId,
        triggerType: 'learning_path_completed',
        triggerData: {
          pathId,
        },
      });

      await checkGoalsForTrigger(userId, 'learning_path_completed');
      await checkChallengesForTrigger(userId, 'learning_path_completed');

      // Increment completion count
      path.completionCount += 1;
      await path.save();

      logger.info(`User ${userId} completed learning path ${pathId}`);
    } else {
      progress.status = 'in_progress';
    }

    progress.completedCourses = completedCourses as any;
    progress.progressPercentage = progressPercentage;
    progress.currentCourseIndex = currentCourseIndex;
    progress.lastAccessedAt = new Date();
    await progress.save();

    return progress;
  } catch (error) {
    logger.error('Error updating learning path progress:', error);
    throw error;
  }
};

/**
 * Get learning path progress for a user
 */
export const getLearningPathProgress = async (
  userId: string,
  pathId: string
): Promise<LearningPathProgress | null> => {
  try {
    return await LearningPathProgress.findOne({
      user: userId,
      learningPath: pathId,
    }).populate('learningPath');
  } catch (error) {
    logger.error('Error getting learning path progress:', error);
    return null;
  }
};

/**
 * Get user's learning paths
 */
export const getUserLearningPaths = async (
  userId: string,
  options?: {
    status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
    limit?: number;
    offset?: number;
  }
): Promise<{ paths: LearningPathProgress[]; total: number }> => {
  try {
    const query: any = { user: userId };
    if (options?.status) {
      query.status = options.status;
    }

    const total = await LearningPathProgress.countDocuments(query);

    const paths = await LearningPathProgress.find(query)
      .populate('learningPath')
      .sort({ lastAccessedAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return { paths, total };
  } catch (error) {
    logger.error('Error getting user learning paths:', error);
    return { paths: [], total: 0 };
  }
};

/**
 * Pause/resume learning path
 */
export const toggleLearningPathStatus = async (
  userId: string,
  pathId: string
): Promise<LearningPathProgress | null> => {
  try {
    const progress = await LearningPathProgress.findOne({
      user: userId,
      learningPath: pathId,
    });

    if (!progress) {
      return null;
    }

    if (progress.status === 'in_progress') {
      progress.status = 'paused';
    } else if (progress.status === 'paused') {
      progress.status = 'in_progress';
      progress.lastAccessedAt = new Date();
    }

    await progress.save();
    return progress;
  } catch (error) {
    logger.error('Error toggling learning path status:', error);
    throw error;
  }
};

/**
 * Get next course in learning path
 */
export const getNextCourse = async (
  userId: string,
  pathId: string
): Promise<{ course: any; isUnlocked: boolean } | null> => {
  try {
    const path = await LearningPath.findById(pathId);
    if (!path) {
      return null;
    }

    const progress = await LearningPathProgress.findOne({
      user: userId,
      learningPath: pathId,
    });

    if (!progress) {
      // Return first course if path not started
      if (path.courses.length > 0) {
        const firstCourse = await Course.findById(path.courses[0].course);
        return {
          course: firstCourse,
          isUnlocked: true,
        };
      }
      return null;
    }

    const nextIndex = progress.currentCourseIndex;
    if (nextIndex >= path.courses.length) {
      return null; // Path completed
    }

    const nextCourseData = path.courses[nextIndex];
    const nextCourse = await Course.findById(nextCourseData.course);

    // Check if course is unlocked (previous course completed)
    let isUnlocked = true;
    if (nextIndex > 0) {
      const previousCourseId = path.courses[nextIndex - 1].course;
      const previousCompleted = progress.completedCourses.some(
        (id) => id.toString() === previousCourseId.toString()
      );
      isUnlocked = previousCompleted;
    }

    return {
      course: nextCourse,
      isUnlocked,
    };
  } catch (error) {
    logger.error('Error getting next course:', error);
    return null;
  }
};

/**
 * Get learning path with progress
 */
export const getLearningPathWithProgress = async (
  pathId: string,
  userId?: string
): Promise<any> => {
  try {
    const path = await LearningPath.findById(pathId)
      .populate('courses.course', 'title thumbnail difficulty estimatedDuration')
      .populate('prerequisites', 'name description');

    if (!path) {
      return null;
    }

    let progress = null;
    let canStart = null;
    let nextCourse = null;

    if (userId) {
      progress = await getLearningPathProgress(userId, pathId);
      canStart = await canStartLearningPath(userId, pathId);
      nextCourse = await getNextCourse(userId, pathId);
    }

    return {
      path,
      progress,
      canStart,
      nextCourse,
    };
  } catch (error) {
    logger.error('Error getting learning path with progress:', error);
    return null;
  }
};

