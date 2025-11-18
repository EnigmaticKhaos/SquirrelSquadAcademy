import express from 'express';
import { protect } from '../middleware/auth';
import {
  enable2FA,
  verifyAndEnable2FA,
  disable2FA,
  get2FAStatus,
} from '../controllers/twoFactorController';

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/status', get2FAStatus);
router.post('/enable', enable2FA);
router.post('/verify', verifyAndEnable2FA);
router.post('/disable', disable2FA);

export default router;

