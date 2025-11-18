import express from 'express';
import {
  getAnnouncements,
  getAnnouncement,
  markAnnouncementAsRead,
  createAnnouncementHandler,
  publishAnnouncementHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
  getAllAnnouncementsHandler,
  processScheduledHandler,
} from '../controllers/announcementController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes (require authentication)
router.get('/', protect, getAnnouncements);
router.get('/:id', protect, getAnnouncement);
router.put('/:id/read', protect, markAnnouncementAsRead);

// Admin routes
router.post('/', protect, authorize('admin'), createAnnouncementHandler);
router.post('/:id/publish', protect, authorize('admin'), publishAnnouncementHandler);
router.put('/:id', protect, authorize('admin'), updateAnnouncementHandler);
router.delete('/:id', protect, authorize('admin'), deleteAnnouncementHandler);
router.get('/admin/all', protect, authorize('admin'), getAllAnnouncementsHandler);
router.post('/process-scheduled', protect, authorize('admin'), processScheduledHandler);

export default router;

