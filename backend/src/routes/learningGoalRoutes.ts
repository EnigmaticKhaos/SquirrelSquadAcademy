import express from 'express';
import {
  getUserGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  pauseGoal,
  updateProgress,
  updateAllGoals,
  getGoalStats,
} from '../controllers/learningGoalController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/stats', getGoalStats);
router.post('/update-all', updateAllGoals);
router.get('/', getUserGoals);
router.post('/', createGoal);
router.get('/:id', getGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.put('/:id/pause', pauseGoal);
router.put('/:id/resume', pauseGoal); // Same handler, toggles pause/resume
router.post('/:id/update-progress', updateProgress);

export default router;

