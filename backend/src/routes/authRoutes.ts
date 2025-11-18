import express from 'express';
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import twoFactorRoutes from './twoFactorRoutes';
import oauthRoutes from './oauthRoutes';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, resetPassword);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// 2FA routes
router.use('/2fa', twoFactorRoutes);

// OAuth routes
router.use('/oauth', oauthRoutes);

export default router;

