import express from 'express';
import {
  join,
  leave,
  getPosition,
  getWaitlist,
  getUserEntries,
  getStatus,
  notifyNext,
  cleanup,
} from '../controllers/courseWaitlistController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/:courseId/status', getStatus);

// Private routes
router.post('/:courseId/join', protect, join);
router.post('/:courseId/leave', protect, leave);
router.get('/:courseId/position', protect, getPosition);
router.get('/user/entries', protect, getUserEntries);

// Admin routes
router.get('/:courseId', protect, authorize('admin'), getWaitlist);
router.post('/:courseId/notify-next', protect, authorize('admin'), notifyNext);
router.post('/cleanup', protect, authorize('admin'), cleanup);

export default router;

