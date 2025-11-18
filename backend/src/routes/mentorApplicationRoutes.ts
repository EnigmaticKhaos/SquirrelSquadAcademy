import express from 'express';
import {
  submitApplication,
  getMyApplication,
  getApplications,
  approveApplication,
  rejectApplication,
  bulkApprove,
  bulkReject,
  updateAvailability,
  updateStats,
} from '../controllers/mentorApplicationController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// User routes
router.post('/', protect, submitApplication);
router.get('/my-application', protect, getMyApplication);
router.put('/availability', protect, updateAvailability);

// Admin routes
router.get('/admin', protect, authorize('admin'), getApplications);
router.post('/:id/approve', protect, authorize('admin'), approveApplication);
router.post('/:id/reject', protect, authorize('admin'), rejectApplication);
router.post('/bulk-approve', protect, authorize('admin'), bulkApprove);
router.post('/bulk-reject', protect, authorize('admin'), bulkReject);
router.post('/update-stats/:mentorId', protect, authorize('admin'), updateStats);

export default router;

