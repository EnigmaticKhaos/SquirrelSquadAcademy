import CourseTestSession from '../models/CourseTestSession';
import Course from '../models/Course';
import { validateCourse } from './courseValidationService';
import { calculateLevel } from '../utils/levelCalculator';
import logger from '../utils/logger';

/**
 * Start test session for a course
 */
export const startTestSession = async (
  userId: string,
  courseId: string
): Promise<CourseTestSession> => {
  try {
    // Check if test session already exists
    let testSession = await CourseTestSession.findOne({
      user: userId,
      course: courseId,
    });

    if (testSession) {
      // Reset existing session
      testSession.simulatedXP = 0;
      testSession.simulatedLevel = 1;
      testSession.simulatedProgress = 0;
      testSession.simulatedAchievements = [];
      testSession.simulatedBadges = [];
      testSession.completedModules = [];
      testSession.completedLessons = [];
      testSession.completedAssignments = [];
      testSession.startedAt = new Date();
      testSession.lastAccessedAt = new Date();
      testSession.completedAt = undefined;
      testSession.validationReport = undefined;
      await testSession.save();
      return testSession;
    }

    // Create new test session
    testSession = await CourseTestSession.create({
      user: userId,
      course: courseId,
      simulatedXP: 0,
      simulatedLevel: 1,
      simulatedProgress: 0,
      startedAt: new Date(),
      lastAccessedAt: new Date(),
    });

    return testSession;
  } catch (error) {
    logger.error('Error starting test session:', error);
    throw error;
  }
};

/**
 * Award simulated XP (test mode only)
 */
export const awardSimulatedXP = async (
  userId: string,
  courseId: string,
  amount: number,
  reason: string
): Promise<{ xp: number; level: number; levelUp: boolean; message: string }> => {
  try {
    const testSession = await CourseTestSession.findOne({
      user: userId,
      course: courseId,
    });

    if (!testSession) {
      throw new Error('Test session not found');
    }

    const oldLevel = testSession.simulatedLevel;
    testSession.simulatedXP += amount;
    testSession.simulatedLevel = calculateLevel(testSession.simulatedXP);
    testSession.lastAccessedAt = new Date();
    await testSession.save();

    const levelUp = testSession.simulatedLevel > oldLevel;
    const message = levelUp
      ? `🎉 Level Up! You reached level ${testSession.simulatedLevel}! (+${amount} XP for ${reason})`
      : `+${amount} XP for ${reason}`;

    return {
      xp: testSession.simulatedXP,
      level: testSession.simulatedLevel,
      levelUp,
      message,
    };
  } catch (error) {
    logger.error('Error awarding simulated XP:', error);
    throw error;
  }
};

/**
 * Simulate achievement unlock (test mode only)
 */
export const simulateAchievementUnlock = async (
  userId: string,
  courseId: string,
  achievementId: string,
  achievementName?: string
): Promise<{ unlocked: boolean; message: string }> => {
  try {
    const testSession = await CourseTestSession.findOne({
      user: userId,
      course: courseId,
    });

    if (!testSession) {
      return { unlocked: false, message: 'Test session not found' };
    }

    if (!testSession.simulatedAchievements.includes(achievementId as any)) {
      testSession.simulatedAchievements.push(achievementId as any);
      testSession.lastAccessedAt = new Date();
      await testSession.save();
    }

    const message = `🏆 Achievement Unlocked: ${achievementName || 'Achievement'}`;
    return { unlocked: true, message };
  } catch (error) {
    logger.error('Error simulating achievement unlock:', error);
    return { unlocked: false, message: 'Error simulating achievement' };
  }
};

/**
 * Simulate badge unlock (test mode only)
 */
export const simulateBadgeUnlock = async (
  userId: string,
  courseId: string,
  badgeId: string,
  badgeName?: string
): Promise<{ unlocked: boolean; message: string }> => {
  try {
    const testSession = await CourseTestSession.findOne({
      user: userId,
      course: courseId,
    });

    if (!testSession) {
      return { unlocked: false, message: 'Test session not found' };
    }

    if (!testSession.simulatedBadges.includes(badgeId as any)) {
      testSession.simulatedBadges.push(badgeId as any);
      testSession.lastAccessedAt = new Date();
      await testSession.save();
    }

    const message = `🎖️ Badge Earned: ${badgeName || 'Badge'}`;
    return { unlocked: true, message };
  } catch (error) {
    logger.error('Error simulating badge unlock:', error);
    return { unlocked: false, message: 'Error simulating badge' };
  }
};

/**
 * Update test session progress
 */
export const updateTestProgress = async (
  userId: string,
  courseId: string,
  progress: {
    completedModules?: string[];
    completedLessons?: string[];
    completedAssignments?: string[];
    progressPercentage?: number;
  }
): Promise<CourseTestSession | null> => {
  try {
    const testSession = await CourseTestSession.findOne({
      user: userId,
      course: courseId,
    });

    if (!testSession) {
      return null;
    }

    if (progress.completedModules) {
      testSession.completedModules = progress.completedModules as any;
    }
    if (progress.completedLessons) {
      testSession.completedLessons = progress.completedLessons as any;
    }
    if (progress.completedAssignments) {
      testSession.completedAssignments = progress.completedAssignments as any;
    }
    if (progress.progressPercentage !== undefined) {
      testSession.simulatedProgress = progress.progressPercentage;
    }

    testSession.lastAccessedAt = new Date();
    await testSession.save();

    return testSession;
  } catch (error) {
    logger.error('Error updating test progress:', error);
    return null;
  }
};

/**
 * Run course validation and generate report
 */
export const runCourseValidation = async (
  courseId: string
): Promise<any> => {
  try {
    const validationReport = await validateCourse(courseId);
    return validationReport;
  } catch (error) {
    logger.error('Error running course validation:', error);
    throw error;
  }
};

/**
 * Get test session
 */
export const getTestSession = async (
  userId: string,
  courseId: string
): Promise<CourseTestSession | null> => {
  try {
    return await CourseTestSession.findOne({
      user: userId,
      course: courseId,
    });
  } catch (error) {
    logger.error('Error getting test session:', error);
    return null;
  }
};

/**
 * Complete test session
 */
export const completeTestSession = async (
  userId: string,
  courseId: string
): Promise<CourseTestSession | null> => {
  try {
    const testSession = await CourseTestSession.findOne({
      user: userId,
      course: courseId,
    });

    if (!testSession) {
      return null;
    }

    testSession.completedAt = new Date();
    testSession.lastAccessedAt = new Date();
    await testSession.save();

    return testSession;
  } catch (error) {
    logger.error('Error completing test session:', error);
    return null;
  }
};

