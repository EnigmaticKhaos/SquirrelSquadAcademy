import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { protect, authorize } from '../middleware/auth';
import {
  getDashboardAnalytics,
  getUserAnalytics,
  getCourseAnalytics,
  getRevenueAnalytics,
  getGamificationAnalytics,
  getSocialAnalytics,
  getLearningAnalytics,
  getReferralAnalytics,
  getProjectAnalytics,
  getModerationAnalytics,
  getMentorApplicationAnalytics,
} from '../services/adminAnalyticsService';
import logger from '../utils/logger';

// @desc    Get comprehensive dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const options: any = {};
  if (startDate) {
    options.startDate = new Date(startDate as string);
  }
  if (endDate) {
    options.endDate = new Date(endDate as string);
  }

  const analytics = await getDashboardAnalytics(options);

  res.json({
    success: true,
    data: analytics,
  });
});

// @desc    Get user analytics
// @route   GET /api/admin/analytics/users
// @access  Private/Admin
export const getUserAnalyticsEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const options: any = {};
  if (startDate) {
    options.startDate = new Date(startDate as string);
  }
  if (endDate) {
    options.endDate = new Date(endDate as string);
  }

  const analytics = await getUserAnalytics(options);

  res.json({
    success: true,
    data: analytics,
  });
});

// @desc    Get course analytics
// @route   GET /api/admin/analytics/courses
// @access  Private/Admin
export const getCourseAnalyticsEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const options: any = {};
  if (startDate) {
    options.startDate = new Date(startDate as string);
  }
  if (endDate) {
    options.endDate = new Date(endDate as string);
  }

  const analytics = await getCourseAnalytics(options);

  res.json({
    success: true,
    data: analytics,
  });
});

// @desc    Get revenue analytics
// @route   GET /api/admin/analytics/revenue
// @access  Private/Admin
export const getRevenueAnalyticsEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const options: any = {};
  if (startDate) {
    options.startDate = new Date(startDate as string);
  }
  if (endDate) {
    options.endDate = new Date(endDate as string);
  }

  const analytics = await getRevenueAnalytics(options);

  res.json({
    success: true,
    data: analytics,
  });
});

// @desc    Get gamification analytics
// @route   GET /api/admin/analytics/gamification
// @access  Private/Admin
export const getGamificationAnalyticsEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await getGamificationAnalytics();

  res.json({
    success: true,
    data: analytics,
  });
});

// @desc    Get social analytics
// @route   GET /api/admin/analytics/social
// @access  Private/Admin
export const getSocialAnalyticsEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const options: any = {};
  if (startDate) {
    options.startDate = new Date(startDate as string);
  }
  if (endDate) {
    options.endDate = new Date(endDate as string);
  }

  const analytics = await getSocialAnalytics(options);

  res.json({
    success: true,
    data: analytics,
  });
});

// @desc    Get learning analytics
// @route   GET /api/admin/analytics/learning
// @access  Private/Admin
export const getLearningAnalyticsEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const options: any = {};
  if (startDate) {
    options.startDate = new Date(startDate as string);
  }
  if (endDate) {
    options.endDate = new Date(endDate as string);
  }

  const analytics = await getLearningAnalytics(options);

  res.json({
    success: true,
    data: analytics,
  });
});

// @desc    Get referral analytics
// @route   GET /api/admin/analytics/referrals
// @access  Private/Admin
export const getReferralAnalyticsEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await getReferralAnalytics();

  res.json({
    success: true,
    data: analytics,
  });
});

// @desc    Get project analytics
// @route   GET /api/admin/analytics/projects
// @access  Private/Admin
export const getProjectAnalyticsEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await getProjectAnalytics();

  res.json({
    success: true,
    data: analytics,
  });
});

// @desc    Get moderation analytics
// @route   GET /api/admin/analytics/moderation
// @access  Private/Admin
export const getModerationAnalyticsEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await getModerationAnalytics();

  res.json({
    success: true,
    data: analytics,
  });
});

// @desc    Get mentor application analytics
// @route   GET /api/admin/analytics/mentor-applications
// @access  Private/Admin
export const getMentorApplicationAnalyticsEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await getMentorApplicationAnalytics();

  res.json({
    success: true,
    data: analytics,
  });
});

