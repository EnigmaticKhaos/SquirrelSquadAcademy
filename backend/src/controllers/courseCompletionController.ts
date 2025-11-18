import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import {
  getCourseCompletion,
  shareCourseCompletion,
  markCelebrationViewed,
  getCourseCompletionAnalytics,
  getEstimatedTimeRemaining,
  updateEnrollmentProgress,
  completeCourse,
} from '../services/courseCompletionService';
import CourseEnrollment from '../models/CourseEnrollment';

// @desc    Get course completion details
// @route   GET /api/course-completions/:courseId
// @access  Private
export const getCompletion = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();

  const completion = await getCourseCompletion(userId, courseId);

  if (!completion) {
    return res.status(404).json({
      success: false,
      message: 'Course completion not found',
    });
  }

  res.json({
    success: true,
    completion,
  });
});

// @desc    Share course completion
// @route   POST /api/course-completions/:courseId/share
// @access  Private
export const shareCompletion = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();

  const result = await shareCourseCompletion(userId, courseId);

  if (!result.success) {
    return res.status(404).json({
      success: false,
      message: 'Course completion not found',
    });
  }

  res.json({
    success: true,
    shareableLink: result.shareableLink,
  });
});

// @desc    Mark celebration as viewed
// @route   POST /api/course-completions/:courseId/celebration-viewed
// @access  Private
export const markCelebration = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();

  const success = await markCelebrationViewed(userId, courseId);

  if (!success) {
    return res.status(404).json({
      success: false,
      message: 'Course completion not found',
    });
  }

  res.json({
    success: true,
    message: 'Celebration marked as viewed',
  });
});

// @desc    Get course completion analytics
// @route   GET /api/course-completions/:courseId/analytics
// @access  Private
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();

  const analytics = await getCourseCompletionAnalytics(userId, courseId);

  if (!analytics) {
    return res.status(404).json({
      success: false,
      message: 'Enrollment not found',
    });
  }

  res.json({
    success: true,
    analytics,
  });
});

// @desc    Get estimated time remaining
// @route   GET /api/course-completions/:courseId/time-remaining
// @access  Private
export const getTimeRemaining = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();

  const timeRemaining = await getEstimatedTimeRemaining(userId, courseId);

  if (timeRemaining === null) {
    return res.status(404).json({
      success: false,
      message: 'Enrollment not found',
    });
  }

  res.json({
    success: true,
    timeRemaining, // in minutes
    timeRemainingHours: Math.round((timeRemaining / 60) * 10) / 10,
  });
});

// @desc    Update enrollment progress
// @route   POST /api/course-completions/:courseId/update-progress
// @access  Private
export const updateProgress = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();

  await updateEnrollmentProgress(userId, courseId);

  const enrollment = await CourseEnrollment.findOne({
    user: userId,
    course: courseId,
  });

  res.json({
    success: true,
    enrollment,
  });
});

// @desc    Get user's course enrollments
// @route   GET /api/course-completions/user/enrollments
// @access  Private
export const getUserEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { status } = req.query;

  const query: any = { user: userId };
  if (status) {
    query.status = status;
  }

  const enrollments = await CourseEnrollment.find(query)
    .populate('course', 'title thumbnail difficulty estimatedDuration')
    .sort({ lastAccessedAt: -1, enrolledAt: -1 });

  res.json({
    success: true,
    count: enrollments.length,
    enrollments,
  });
});

// @desc    Get user's completed courses
// @route   GET /api/course-completions/user/completed
// @access  Private
export const getUserCompletedCourses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { limit = 20, offset = 0 } = req.query;

  const CourseCompletion = (await import('../models/CourseCompletion')).default;
  const completions = await CourseCompletion.find({ user: userId })
    .populate('course', 'title thumbnail difficulty category')
    .sort({ completedAt: -1 })
    .skip(Number(offset))
    .limit(Number(limit));

  res.json({
    success: true,
    count: completions.length,
    completions,
  });
});

// @desc    Manually trigger course completion check
// @route   POST /api/course-completions/:courseId/complete
// @access  Private
export const triggerCompletion = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();

  try {
    const completion = await completeCourse(userId, courseId);

    if (!completion) {
      return res.status(400).json({
        success: false,
        message: 'Course requirements not met or already completed',
      });
    }

    res.json({
      success: true,
      completion,
      message: 'Course completed successfully!',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to complete course',
    });
  }
});

