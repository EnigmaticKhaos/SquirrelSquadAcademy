import express from 'express';
import {
  createContentReport,
  getModerationReports,
  getReport,
  reviewContentReport,
  issueUserWarning,
  getUserWarningsList,
  suspendUserAccount,
  banUserAccount,
  unbanUserAccount,
  getModerationStats,
} from '../controllers/moderationController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// User routes (require authentication)
router.post('/reports', protect, createContentReport);

// Admin routes
router.get('/reports', protect, authorize('admin'), getModerationReports);
router.get('/reports/:id', protect, authorize('admin'), getReport);
router.put('/reports/:id/review', protect, authorize('admin'), reviewContentReport);

router.post('/warnings', protect, authorize('admin'), issueUserWarning);
router.get('/warnings/user/:userId', protect, authorize('admin'), getUserWarningsList);

router.post('/users/:userId/suspend', protect, authorize('admin'), suspendUserAccount);
router.post('/users/:userId/ban', protect, authorize('admin'), banUserAccount);
router.post('/users/:userId/unban', protect, authorize('admin'), unbanUserAccount);

router.get('/stats', protect, authorize('admin'), getModerationStats);

export default router;

