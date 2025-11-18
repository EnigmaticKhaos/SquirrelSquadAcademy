import express from 'express';
import { protect, authorize } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import {
  getCourseSuggestions,
  createCourseSuggestion,
  voteOnSuggestion,
  approveSuggestion,
  denySuggestion,
} from '../controllers/courseSuggestionController';

const router = express.Router();

router.get('/', getCourseSuggestions);
router.post('/', protect, createCourseSuggestion);
router.post('/:id/vote', protect, voteOnSuggestion);
router.post('/:id/approve', protect, authorize('admin'), aiLimiter, approveSuggestion); // AI generation
router.post('/:id/deny', protect, authorize('admin'), denySuggestion);

export default router;

