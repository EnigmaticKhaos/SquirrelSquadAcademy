import express from 'express';
import {
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
  discordAuth,
  discordCallback,
} from '../controllers/oauthController';

const router = express.Router();

// Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// GitHub OAuth
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);

// Discord OAuth
router.get('/discord', discordAuth);
router.get('/discord/callback', discordCallback);

export default router;

