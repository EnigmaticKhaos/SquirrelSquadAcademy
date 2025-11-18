import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { generateToken } from '../utils/jwt';
import { asyncHandler } from '../middleware/errorHandler';

// OAuth callback handler
export const oauthCallback = (provider: string) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(provider, { session: false }, (err: any, user: any) => {
      if (err || !user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
      }

      // Generate token
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Update online status
      user.onlineStatus = 'online';
      user.lastSeen = new Date();
      user.save();

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    })(req, res, next);
  });
};

// Google OAuth
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

export const googleCallback = oauthCallback('google');

// GitHub OAuth
export const githubAuth = passport.authenticate('github', {
  scope: ['user:email', 'repo', 'read:org'], // Request repo and org permissions for GitHub integration
});

export const githubCallback = oauthCallback('github');

// Discord OAuth
export const discordAuth = passport.authenticate('discord', {
  scope: ['identify', 'email'],
});

export const discordCallback = oauthCallback('discord');

