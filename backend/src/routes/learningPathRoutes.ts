import express from 'express';
import {
  getLearningPaths,
  getLearningPath,
  createLearningPath,
  updateLearningPath,
  deleteLearningPath,
  start,
  getProgress,
  updateProgress,
  getUserPaths,
  toggleStatus,
  getNext,
  generate,
  checkCanStart,
} from '../controllers/learningPathController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getLearningPaths);
router.get('/:id', getLearningPath);

// Private routes
router.get('/user/paths', protect, getUserPaths);
router.get('/:id/progress', protect, getProgress);
router.get('/:id/next-course', protect, getNext);
router.get('/:id/can-start', protect, checkCanStart);
router.post('/:id/start', protect, start);
router.post('/:id/update-progress', protect, updateProgress);
router.post('/:id/toggle-status', protect, toggleStatus);
router.post('/generate', protect, generate);

// Admin routes
router.post('/', protect, authorize('admin'), createLearningPath);
router.put('/:id', protect, authorize('admin'), updateLearningPath);
router.delete('/:id', protect, authorize('admin'), deleteLearningPath);

export default router;

