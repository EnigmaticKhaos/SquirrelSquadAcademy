import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as DiscordStrategy } from 'passport-discord';
import User from '../models/User';
import { config } from './env';
import { generateToken } from '../utils/jwt';

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (config.googleClientId && config.googleClientSecret) {
  // Build full callback URL
  const backendUrl = process.env.BACKEND_URL || process.env.API_URL || `http://localhost:${config.port}`;
  const googleCallbackURL = `${backendUrl}/api/auth/oauth/google/callback`;
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL: googleCallbackURL,
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          let user = await User.findOne({ 'oauthProviders.google': profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with this email
          user = await User.findOne({ email: profile.emails?.[0]?.value });

          if (user) {
            // Link Google account
            user.oauthProviders = user.oauthProviders || {};
            user.oauthProviders.google = profile.id;
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            email: profile.emails?.[0]?.value || '',
            username: profile.displayName?.replace(/\s+/g, '').toLowerCase() + Math.random().toString(36).substring(2, 8),
            oauthProviders: {
              google: profile.id,
            },
            isEmailVerified: true, // OAuth emails are pre-verified
          });

          done(null, user);
        } catch (error) {
          done(error, false);
        }
      }
    )
  );
}

// GitHub OAuth Strategy
if (config.githubClientId && config.githubClientSecret) {
  // Build full callback URL
  const backendUrl = process.env.BACKEND_URL || process.env.API_URL || `http://localhost:${config.port}`;
  const githubCallbackURL = `${backendUrl}/api/auth/oauth/github/callback`;
  
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.githubClientId,
        clientSecret: config.githubClientSecret,
        callbackURL: githubCallbackURL,
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          let user = await User.findOne({ 'oauthProviders.github': profile.id });

          if (user) {
            // Update access token if it exists
            if (accessToken) {
              user.oauthTokens = user.oauthTokens || {};
              user.oauthTokens.github = accessToken;
              await user.save();
            }
            return done(null, user);
          }

          // Check if user exists with this email
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email });

            if (user) {
              // Link GitHub account
              user.oauthProviders = user.oauthProviders || {};
              user.oauthProviders.github = profile.id;
              user.oauthTokens = user.oauthTokens || {};
              user.oauthTokens.github = accessToken; // Store access token for API operations
              if (profile.username) {
                user.socialLinks = user.socialLinks || {};
                user.socialLinks.github = `https://github.com/${profile.username}`;
              }
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          user = await User.create({
            email: email || `${profile.username}@github.local`,
            username: profile.username || profile.displayName?.replace(/\s+/g, '').toLowerCase() + Math.random().toString(36).substring(2, 8),
            oauthProviders: {
              github: profile.id,
            },
            oauthTokens: {
              github: accessToken, // Store access token for API operations
            },
            socialLinks: {
              github: `https://github.com/${profile.username}`,
            },
            isEmailVerified: !!email, // Only verified if email is available
          });

          done(null, user);
        } catch (error) {
          done(error, false);
        }
      }
    )
  );
}

// Discord OAuth Strategy
if (config.discordClientId && config.discordClientSecret) {
  // Build full callback URL
  const backendUrl = process.env.BACKEND_URL || process.env.API_URL || `http://localhost:${config.port}`;
  const discordCallbackURL = `${backendUrl}/api/auth/oauth/discord/callback`;
  
  passport.use(
    new DiscordStrategy(
      {
        clientID: config.discordClientId,
        clientSecret: config.discordClientSecret,
        callbackURL: discordCallbackURL,
        scope: ['identify', 'email'],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          let user = await User.findOne({ 'oauthProviders.discord': profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with this email
          const email = profile.email;
          if (email) {
            user = await User.findOne({ email });

            if (user) {
              // Link Discord account
              user.oauthProviders = user.oauthProviders || {};
              user.oauthProviders.discord = profile.id;
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          user = await User.create({
            email: email || `${profile.username}@discord.local`,
            username: profile.username + Math.random().toString(36).substring(2, 8),
            oauthProviders: {
              discord: profile.id,
            },
            isEmailVerified: !!email,
          });

          done(null, user);
        } catch (error) {
          done(error, false);
        }
      }
    )
  );
}

export default passport;

