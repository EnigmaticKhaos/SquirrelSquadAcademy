import express from 'express';
import {
  getReferralCode,
  useReferral,
  getReferralStats,
  getReferrals,
  createCustomReferral,
} from '../controllers/referralController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/code', getReferralCode);
router.post('/use', useReferral);
router.get('/stats', getReferralStats);
router.get('/', getReferrals);
router.post('/create', createCustomReferral);

export default router;

