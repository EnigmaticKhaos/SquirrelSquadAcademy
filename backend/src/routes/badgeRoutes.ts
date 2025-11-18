import express from 'express';
import {
  getBadges,
  getBadge,
  createBadge,
  updateBadge,
  deleteBadge,
  getUserBadgesList,
  getBadgeGallery,
  setProfileCard,
  removeProfileCard,
  manuallyCheckBadge,
} from '../controllers/badgeController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getBadges);
router.get('/gallery/:userId?', getBadgeGallery);
router.get('/:id', getBadge);
router.get('/user/:userId', getUserBadgesList);

// Private routes
router.put('/:id/set-profile-card', protect, setProfileCard);
router.delete('/profile-card', protect, removeProfileCard);

// Admin routes
router.post('/', protect, authorize('admin'), createBadge);
router.put('/:id', protect, authorize('admin'), updateBadge);
router.delete('/:id', protect, authorize('admin'), deleteBadge);
router.post('/:id/check/:userId', protect, authorize('admin'), manuallyCheckBadge);

export default router;

