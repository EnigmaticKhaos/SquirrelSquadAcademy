import express from 'express';
import {
  getCourseRecommendationsHandler,
  getLearningPathRecommendationsHandler,
  getPricingSuggestionHandler,
} from '../controllers/recommendationController';
import { protect, authorize } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/courses', aiLimiter, getCourseRecommendationsHandler);
router.get('/learning-paths', aiLimiter, getLearningPathRecommendationsHandler);
router.get('/pricing/:courseId', authorize('admin'), aiLimiter, getPricingSuggestionHandler);

export default router;

