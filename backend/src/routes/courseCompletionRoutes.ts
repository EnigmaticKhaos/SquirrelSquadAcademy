import express from 'express';
import {
  getCompletion,
  shareCompletion,
  markCelebration,
  getAnalytics,
  getTimeRemaining,
  updateProgress,
  getUserEnrollments,
  getUserCompletedCourses,
  triggerCompletion,
} from '../controllers/courseCompletionController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/user/enrollments', getUserEnrollments);
router.get('/user/completed', getUserCompletedCourses);
router.get('/:courseId', getCompletion);
router.get('/:courseId/analytics', getAnalytics);
router.get('/:courseId/time-remaining', getTimeRemaining);
router.post('/:courseId/share', shareCompletion);
router.post('/:courseId/celebration-viewed', markCelebration);
router.post('/:courseId/update-progress', updateProgress);
router.post('/:courseId/complete', triggerCompletion);

export default router;

