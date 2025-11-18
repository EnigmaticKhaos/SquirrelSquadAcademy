import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../controllers/assignmentController';
import submissionRoutes from './submissionRoutes';

const router = express.Router({ mergeParams: true });

router.get('/', getAssignments);
router.get('/:id', getAssignment);
router.post('/', protect, authorize('admin'), createAssignment);
router.put('/:id', protect, authorize('admin'), updateAssignment);
router.delete('/:id', protect, authorize('admin'), deleteAssignment);

// Submission routes
router.use('/', submissionRoutes);

export default router;

