import mongoose from 'mongoose';
import CourseEnrollment from '../models/CourseEnrollment';
import CourseCompletion, { ICourseCompletion } from '../models/CourseCompletion';
import Course from '../models/Course';
import Assignment from '../models/Assignment';
import Submission from '../models/Submission';
import Module from '../models/Module';
import Lesson from '../models/Lesson';
import User from '../models/User';
import LearningPath from '../models/LearningPath';
import { awardXP } from './xpService';
import { checkAchievementsForTrigger } from './achievementService';
import { checkBadgesForTrigger } from './badgeService';
import { checkGoalsForTrigger } from './learningGoalService';
import { checkChallengesForTrigger } from './challengeService';
import logger from '../utils/logger';
import crypto from 'crypto';

/**
 * Check if a course is completed
 */
export const checkCourseCompletion = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  try {
    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
      status: { $in: ['enrolled', 'in_progress'] },
    });

    if (!enrollment) {
      return false;
    }

    // Get all assignments for the course
    const assignments = await Assignment.find({ course: courseId });
    if (assignments.length === 0) {
      return false; // Course has no assignments, can't be completed
    }

    // Check if all assignments are completed (graded)
    const completedSubmissions = await Submission.find({
      user: userId,
      course: courseId,
      status: 'graded',
    }).distinct('assignment');

    const allAssignmentsCompleted = assignments.every((assignment) =>
      completedSubmissions.some((submissionId) =>
        submissionId.toString() === assignment._id.toString()
      )
    );

    return allAssignmentsCompleted;
  } catch (error) {
    logger.error('Error checking course completion:', error);
    return false;
  }
};

/**
 * Calculate course progress
 */
export const calculateCourseProgress = async (
  userId: string,
  courseId: string
): Promise<{
  progressPercentage: number;
  completedModules: string[];
  completedLessons: string[];
  completedAssignments: string[];
  totalModules: number;
  totalLessons: number;
  totalAssignments: number;
}> => {
  try {
    const course = await Course.findById(courseId).populate('modules');
    if (!course) {
      throw new Error('Course not found');
    }

    const modules = await Module.find({ _id: { $in: course.modules } });
    const allLessons: any[] = [];
    const allAssignments: any[] = [];

    for (const module of modules) {
      const lessons = await Lesson.find({ module: module._id });
      allLessons.push(...lessons);

      for (const lesson of lessons) {
        const assignments = await Assignment.find({ lesson: lesson._id });
        allAssignments.push(...assignments);
      }
    }

    // Get completed items
    const completedSubmissions = await Submission.find({
      user: userId,
      course: courseId,
      status: 'graded',
    }).distinct('assignment');

    // TODO: Track lesson and module completion separately
    // For now, we'll use assignment completion as proxy
    const completedAssignments = completedSubmissions.map((id) => id.toString());
    const completedLessons: string[] = []; // TODO: Implement lesson completion tracking
    const completedModules: string[] = []; // TODO: Implement module completion tracking

    // Calculate progress percentage
    const totalItems = allAssignments.length + allLessons.length + modules.length;
    const completedItems = completedAssignments.length + completedLessons.length + completedModules.length;
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      progressPercentage,
      completedModules,
      completedLessons,
      completedAssignments,
      totalModules: modules.length,
      totalLessons: allLessons.length,
      totalAssignments: allAssignments.length,
    };
  } catch (error) {
    logger.error('Error calculating course progress:', error);
    throw error;
  }
};

/**
 * Complete a course
 */
export const completeCourse = async (
  userId: string,
  courseId: string
): Promise<ICourseCompletion | null> => {
  try {
    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    if (enrollment.status === 'completed') {
      // Course already completed
      const existingCompletion = await CourseCompletion.findOne({
        enrollment: enrollment._id,
      });
      return existingCompletion;
    }

    // Check if course is actually completed
    const isCompleted = await checkCourseCompletion(userId, courseId);
    if (!isCompleted) {
      throw new Error('Course requirements not met');
    }

    // Calculate final scores
    const submissions = await Submission.find({
      user: userId,
      course: courseId,
      status: 'graded',
    });

    const scores = submissions
      .filter((s) => s.score !== undefined)
      .map((s) => (s.score! / s.maxScore) * 100);
    
    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
    
    const finalScore = averageScore;
    const passed = finalScore >= (enrollment.passThreshold || 70);

    // Calculate time to complete
    const startedAt = enrollment.startedAt || enrollment.enrolledAt;
    const timeToComplete = Math.ceil(
      (Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get course details
    const course = await Course.findById(courseId);
    const progress = await calculateCourseProgress(userId, courseId);

    // Award XP for course completion
    const baseXP = 500; // Base XP for completing a course
    const bonusXP = passed ? 200 : 0; // Bonus XP for passing
    const totalXP = baseXP + bonusXP;

    await awardXP({
      userId,
      amount: totalXP,
      source: 'course_completed',
      sourceId: courseId,
      description: `Completed course: ${course?.title || 'Unknown'}`,
    });

    // Update enrollment
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    enrollment.progressPercentage = 100;
    enrollment.finalScore = finalScore;
    enrollment.passed = passed;
    enrollment.completedAssignments = progress.completedAssignments.map(id => new mongoose.Types.ObjectId(id)) as any;
    await enrollment.save();

    // Create completion record
    const completion = await CourseCompletion.create({
      enrollment: enrollment._id,
      user: userId,
      course: courseId,
      completedAt: new Date(),
      timeToComplete,
      totalTimeSpent: enrollment.timeSpent,
      finalScore,
      averageScore,
      passed,
      xpEarned: totalXP,
      totalAssignments: progress.totalAssignments,
      completedAssignments: progress.completedAssignments.length,
      totalModules: progress.totalModules,
      completedModules: progress.completedModules.length,
      totalLessons: progress.totalLessons,
      completedLessons: progress.completedLessons.length,
    });

    // Generate shareable link
    const shareableLink = crypto.randomBytes(16).toString('hex');
    completion.shareableLink = shareableLink;
    await completion.save();

    // Update course completion count
    if (course) {
      course.completionCount += 1;
      if (passed) {
        course.passCount += 1;
      }
      await course.save();
    }

    // Check achievements, badges, goals, and challenges
    await checkAchievementsForTrigger({
      userId,
      triggerType: 'course_completed',
      triggerData: {
        courseId,
        finalScore,
        passed,
        timeToComplete,
      },
    });

    await checkBadgesForTrigger({
      userId,
      triggerType: 'course_completed',
      triggerData: {
        courseId,
        finalScore,
        passed,
      },
    });

    await checkGoalsForTrigger(userId, 'course_completed');
    await checkChallengesForTrigger(userId, 'course_completed');

    // Update learning path progress if user is enrolled in any paths containing this course
    import('./learningPathService').then(({ updateLearningPathProgress }) => {
      LearningPath.find({ 'courses.course': courseId })
        .then((paths) => {
          paths.forEach((path) => {
            updateLearningPathProgress(userId, path._id.toString()).catch((error) => {
              logger.error('Error updating learning path progress:', error);
            });
          });
        })
        .catch((error) => {
          logger.error('Error finding learning paths:', error);
        });
    });

    // Send course completion notification
    import('./notificationService').then(({ createNotification }) => {
      createNotification(userId, 'course_completed', {
        title: '🎓 Course Completed!',
        message: `Congratulations! You've completed ${course?.title || 'the course'}${passed ? ' and passed!' : ''}`,
        actionUrl: `/courses/${courseId}/completion`,
        relatedCourse: courseId,
        priority: 'high',
        sendEmail: true,
        metadata: {
          finalScore,
          passed,
          timeToComplete,
        },
      }).catch((error) => {
        logger.error('Error sending course completion notification:', error);
      });
    });

    // Create certificate if course is completed and passed
    if (passed) {
      import('./certificateService').then(({ createCertificateFromCompletion }) => {
        createCertificateFromCompletion(completion._id.toString()).catch((error) => {
          logger.error('Error creating certificate:', error);
        });
      });
    }

    // Trigger webhook event
    try {
      const { triggerWebhookEvent } = await import('./webhookService');
      await triggerWebhookEvent('course.completed', {
        userId,
        courseId,
        completionId: completion._id.toString(),
        completedAt: completion.completedAt,
        finalScore: completion.finalScore,
        passed: completion.passed,
        timeToComplete: completion.timeToComplete,
        xpEarned: completion.xpEarned,
      }, userId);
    } catch (error) {
      logger.warn('Error triggering webhook event:', error);
    }

    // Invalidate cache
    try {
      const { delPattern } = await import('./cacheService');
      delPattern(`course:${courseId}.*`);
      delPattern(`user:${userId}:courses`);
    } catch (error) {
      logger.warn('Error invalidating cache:', error);
    }

    logger.info(`User ${userId} completed course ${courseId}`);
    return completion;
  } catch (error) {
    logger.error('Error completing course:', error);
    throw error;
  }
};

/**
 * Get course completion details
 */
export const getCourseCompletion = async (
  userId: string,
  courseId: string
): Promise<ICourseCompletion | null> => {
  try {
    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (!enrollment) {
      return null;
    }

    const completion = await CourseCompletion.findOne({
      enrollment: enrollment._id,
    }).populate('course', 'title thumbnail');

    return completion;
  } catch (error) {
    logger.error('Error getting course completion:', error);
    return null;
  }
};

/**
 * Share course completion
 */
export const shareCourseCompletion = async (
  userId: string,
  courseId: string
): Promise<{ success: boolean; shareableLink?: string }> => {
  try {
    const completion = await CourseCompletion.findOne({
      user: userId,
      course: courseId,
    });

    if (!completion) {
      return { success: false };
    }

    completion.shared = true;
    completion.sharedAt = new Date();
    await completion.save();

    return {
      success: true,
      shareableLink: completion.shareableLink,
    };
  } catch (error) {
    logger.error('Error sharing course completion:', error);
    return { success: false };
  }
};

/**
 * Mark celebration as viewed
 */
export const markCelebrationViewed = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  try {
    const completion = await CourseCompletion.findOne({
      user: userId,
      course: courseId,
    });

    if (!completion) {
      return false;
    }

    completion.celebrationViewed = true;
    completion.celebrationViewedAt = new Date();
    await completion.save();

    return true;
  } catch (error) {
    logger.error('Error marking celebration as viewed:', error);
    return false;
  }
};

/**
 * Get course completion analytics for a user
 */
export const getCourseCompletionAnalytics = async (
  userId: string,
  courseId: string
): Promise<any> => {
  try {
    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (!enrollment) {
      return null;
    }

    const completion = await CourseCompletion.findOne({
      enrollment: enrollment._id,
    });

    const submissions = await Submission.find({
      user: userId,
      course: courseId,
      status: 'graded',
    }).populate('assignment');

    const progress = await calculateCourseProgress(userId, courseId);

    return {
      enrollment,
      completion,
      progress,
      submissions: submissions.map((s) => ({
        assignmentId: s.assignment,
        score: s.score,
        maxScore: s.maxScore,
        percentage: s.score && s.maxScore ? (s.score / s.maxScore) * 100 : 0,
        gradedAt: s.gradedAt,
      })),
    };
  } catch (error) {
    logger.error('Error getting course completion analytics:', error);
    return null;
  }
};

/**
 * Get estimated time remaining
 */
export const getEstimatedTimeRemaining = async (
  userId: string,
  courseId: string
): Promise<number | null> => {
  try {
    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (!enrollment) {
      return null;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return null;
    }

    const progress = await calculateCourseProgress(userId, courseId);
    const progressPercentage = progress.progressPercentage;

    if (progressPercentage === 0) {
      return course.estimatedDuration * 60; // Return in minutes
    }

    // Estimate based on current progress
    const timeSpent = enrollment.timeSpent || 1; // Avoid division by zero
    const estimatedTotalTime = (timeSpent / progressPercentage) * 100;
    const estimatedRemaining = estimatedTotalTime - timeSpent;

    return Math.max(0, Math.round(estimatedRemaining));
  } catch (error) {
    logger.error('Error getting estimated time remaining:', error);
    return null;
  }
};

/**
 * Update enrollment progress
 */
export const updateEnrollmentProgress = async (
  userId: string,
  courseId: string
): Promise<void> => {
  try {
    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (!enrollment) {
      return;
    }

    // Update progress
    const progress = await calculateCourseProgress(userId, courseId);
    enrollment.progressPercentage = progress.progressPercentage;
    enrollment.completedModules = progress.completedModules as any;
    enrollment.completedLessons = progress.completedLessons as any;
    enrollment.completedAssignments = progress.completedAssignments as any;
    enrollment.lastAccessedAt = new Date();

    // Update status
    if (enrollment.status === 'enrolled' && progress.progressPercentage > 0) {
      enrollment.status = 'in_progress';
      if (!enrollment.startedAt) {
        enrollment.startedAt = new Date();
      }
    }

    // Update estimated time remaining
    const estimatedRemaining = await getEstimatedTimeRemaining(userId, courseId);
    if (estimatedRemaining !== null) {
      enrollment.estimatedTimeRemaining = estimatedRemaining;
    }

    await enrollment.save();

    // Check if course is completed
    const isCompleted = await checkCourseCompletion(userId, courseId);
    if (isCompleted && enrollment.status !== 'completed') {
      await completeCourse(userId, courseId);
    }
  } catch (error) {
    logger.error('Error updating enrollment progress:', error);
  }
};

