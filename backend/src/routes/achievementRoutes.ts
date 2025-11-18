import express from 'express';
import {
  getAchievements,
  getAchievement,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  getUserAchievementsList,
  getUserStats,
  getAchievementGallery,
  manuallyCheckAchievement,
} from '../controllers/achievementController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getAchievements);
router.get('/gallery/:userId?', getAchievementGallery);
router.get('/:id', getAchievement);
router.get('/user/:userId', getUserAchievementsList);
router.get('/user/:userId/stats', getUserStats);

// Admin routes
router.post('/', protect, authorize('admin'), createAchievement);
router.put('/:id', protect, authorize('admin'), updateAchievement);
router.delete('/:id', protect, authorize('admin'), deleteAchievement);
router.post('/:id/check/:userId', protect, authorize('admin'), manuallyCheckAchievement);

export default router;

