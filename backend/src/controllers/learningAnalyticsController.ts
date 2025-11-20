import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import { IUser } from '../models/User';
import {
  startLearningSession,
  endLearningSession,
  getUserLearningAnalytics,
  getCourseAnalytics,
  getLearningCalendar,
  getPerformanceMetrics,
} from '../services/learningAnalyticsService';

// @desc    Start learning session
// @route   POST /api/analytics/sessions/start
// @access  Private
export const startSession = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { courseId, lessonId, moduleId, activityType } = req.body;

  if (!activityType) {
    return res.status(400).json({
      success: false,
      message: 'Activity type is required',
    });
  }

  const session = await startLearningSession(userId, {
    courseId,
    lessonId,
    moduleId,
    activityType,
  });

  res.status(201).json({
    success: true,
    message: 'Learning session started',
    session,
  });
});

// @desc    End learning session
// @route   POST /api/analytics/sessions/:id/end
// @access  Private
export const endSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const session = await endLearningSession(id, userId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found or already ended',
    });
  }

  res.json({
    success: true,
    message: 'Learning session ended',
    session,
  });
});

// @desc    Get user learning analytics
// @route   GET /api/analytics/learning
// @access  Private
export const getLearningAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { courseId, startDate, endDate } = req.query;

  const analytics = await getUserLearningAnalytics(userId, {
    courseId: courseId as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });

  res.json({
    success: true,
    analytics,
  });
});

// @desc    Get course-specific analytics
// @route   GET /api/analytics/courses/:courseId
// @access  Private
export const getCourseAnalyticsData = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const analytics = await getCourseAnalytics(userId, courseId);

  res.json({
    success: true,
    analytics,
  });
});

// @desc    Get learning calendar
// @route   GET /api/analytics/calendar
// @access  Private
export const getCalendar = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();
  const { year, month } = req.query;

  const currentDate = new Date();
  const targetYear = year ? Number(year) : currentDate.getFullYear();
  const targetMonth = month ? Number(month) : currentDate.getMonth() + 1;

  const calendar = await getLearningCalendar(userId, targetYear, targetMonth);

  res.json({
    success: true,
    year: targetYear,
    month: targetMonth,
    calendar,
  });
});

// @desc    Get performance metrics
// @route   GET /api/analytics/performance
// @access  Private
export const getPerformance = asyncHandler(async (req: Request, res: Response) => {
  const userDoc = req.user as unknown as IUser & { _id: mongoose.Types.ObjectId };
  if (!userDoc || !userDoc._id) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  const userId = userDoc._id.toString();

  const metrics = await getPerformanceMetrics(userId);

  res.json({
    success: true,
    metrics,
  });
});

