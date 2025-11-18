import express from 'express';
import { protect } from '../middleware/auth';
import { enforcePrivacySettings, checkActivityVisibility } from '../middleware/privacyEnforcement';
import {
  getUserProfile,
  updateProfile,
  updateSettings,
  deleteAccount,
  getUserStats,
} from '../controllers/userController';

const router = express.Router();

router.get('/:id', enforcePrivacySettings, getUserProfile);
router.get('/:id/stats', enforcePrivacySettings, checkActivityVisibility, getUserStats);
router.put('/profile', protect, updateProfile);
router.put('/settings', protect, updateSettings);
router.delete('/account', protect, deleteAccount);

export default router;

