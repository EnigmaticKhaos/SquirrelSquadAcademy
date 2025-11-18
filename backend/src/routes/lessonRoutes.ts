import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
} from '../controllers/lessonController';
import assignmentRoutes from './assignmentRoutes';

const router = express.Router({ mergeParams: true });

router.get('/', getLessons);
router.get('/:id', getLesson);
router.post('/', protect, authorize('admin'), createLesson);
router.put('/:id', protect, authorize('admin'), updateLesson);
router.delete('/:id', protect, authorize('admin'), deleteLesson);

// Nested routes
router.use('/:lessonId/assignments', assignmentRoutes);

export default router;

