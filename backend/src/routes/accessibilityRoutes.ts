import express from 'express';
import { protect } from '../middleware/auth';
import {
  getAccessibilityPreferences,
  updateAccessibilityPreferences,
  resetAccessibilityPreferences,
} from '../controllers/accessibilityController';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/preferences', getAccessibilityPreferences);
router.put('/preferences', updateAccessibilityPreferences);
router.post('/preferences/reset', resetAccessibilityPreferences);

export default router;

