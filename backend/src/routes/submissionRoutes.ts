import express from 'express';
import { protect } from '../middleware/auth';
import {
  submitAssignment,
  getUserSubmissions,
  getSubmission,
} from '../controllers/submissionController';

const router = express.Router({ mergeParams: true });

router.post('/:id/submit', protect, submitAssignment);
router.get('/:id/submissions', protect, getUserSubmissions);
router.get('/submissions/:id', protect, getSubmission);

export default router;

