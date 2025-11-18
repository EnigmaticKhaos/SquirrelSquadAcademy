import express from 'express';
import {
  startSession,
  endSession,
  getLearningAnalytics,
  getCourseAnalyticsData,
  getCalendar,
  getPerformance,
} from '../controllers/learningAnalyticsController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/sessions/start', startSession);
router.post('/sessions/:id/end', endSession);
router.get('/learning', getLearningAnalytics);
router.get('/courses/:courseId', getCourseAnalyticsData);
router.get('/calendar', getCalendar);
router.get('/performance', getPerformance);

export default router;

