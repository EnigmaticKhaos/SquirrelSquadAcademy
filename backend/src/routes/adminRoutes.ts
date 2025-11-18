import express from 'express';
import {
  getDashboard,
  getUserAnalyticsEndpoint,
  getCourseAnalyticsEndpoint,
  getRevenueAnalyticsEndpoint,
  getGamificationAnalyticsEndpoint,
  getSocialAnalyticsEndpoint,
  getLearningAnalyticsEndpoint,
  getReferralAnalyticsEndpoint,
  getProjectAnalyticsEndpoint,
  getModerationAnalyticsEndpoint,
  getMentorApplicationAnalyticsEndpoint,
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Analytics endpoints
router.get('/analytics/users', getUserAnalyticsEndpoint);
router.get('/analytics/courses', getCourseAnalyticsEndpoint);
router.get('/analytics/revenue', getRevenueAnalyticsEndpoint);
router.get('/analytics/gamification', getGamificationAnalyticsEndpoint);
router.get('/analytics/social', getSocialAnalyticsEndpoint);
router.get('/analytics/learning', getLearningAnalyticsEndpoint);
router.get('/analytics/referrals', getReferralAnalyticsEndpoint);
router.get('/analytics/projects', getProjectAnalyticsEndpoint);
router.get('/analytics/moderation', getModerationAnalyticsEndpoint);
router.get('/analytics/mentor-applications', getMentorApplicationAnalyticsEndpoint);

export default router;

