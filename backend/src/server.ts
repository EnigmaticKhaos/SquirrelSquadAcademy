import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import passport from './config/passport';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { initializeSocket } from './socket';
import {
  securityHeaders,
  preventNoSqlInjection,
  preventXSS,
  preventHPP,
  configureTrustProxy,
} from './middleware/security';
import { sanitizeRequestBody } from './utils/validation';
import { apiLimiter } from './middleware/rateLimiter';
import { performanceMonitor } from './middleware/performance';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Trust proxy (for rate limiting behind reverse proxy)
configureTrustProxy(app);

// Initialize Socket.io
initializeSocket(httpServer);

// CORS - Must be before other middleware to handle preflight requests
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
// Build allowed origins list
const allowedOrigins: string[] = [
  frontendUrl,
  'http://localhost:3000',
];

// Add www and non-www versions if it's an https URL
if (frontendUrl.startsWith('https://')) {
  if (frontendUrl.startsWith('https://www.')) {
    allowedOrigins.push(frontendUrl.replace('https://www.', 'https://'));
  } else {
    allowedOrigins.push(frontendUrl.replace('https://', 'https://www.'));
  }
}

console.log('CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin exactly matches or is in the allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin, 'Allowed:', allowedOrigins);
      callback(null, false); // Return false instead of error to prevent crash
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// Security middleware (after CORS)
app.use(securityHeaders);
app.use(preventNoSqlInjection);
app.use(preventXSS);
app.use(preventHPP);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeRequestBody);

// Performance monitoring
if (process.env.NODE_ENV === 'development') {
  app.use(performanceMonitor);
}

// Rate limiting (apply to all routes)
app.use('/api', apiLimiter);

// Passport middleware
app.use(passport.initialize());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SquirrelSquad Academy API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Root health check (for Railway/Render)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import courseRoutes from './routes/courseRoutes';
import rubricRoutes from './routes/rubricRoutes';
import courseSuggestionRoutes from './routes/courseSuggestionRoutes';
import postRoutes from './routes/postRoutes';
import projectRoutes from './routes/projectRoutes';
import stripeRoutes from './routes/stripeRoutes';
import messageRoutes from './routes/messageRoutes';
import searchRoutes from './routes/searchRoutes';
import achievementRoutes from './routes/achievementRoutes';
import badgeRoutes from './routes/badgeRoutes';
import learningGoalRoutes from './routes/learningGoalRoutes';
import challengeRoutes from './routes/challengeRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import courseCompletionRoutes from './routes/courseCompletionRoutes';
import videoRoutes from './routes/videoRoutes';
import noteRoutes from './routes/noteRoutes';
import forumRoutes from './routes/forumRoutes';
import savedContentRoutes from './routes/savedContentRoutes';
import learningPathRoutes from './routes/learningPathRoutes';
import courseReviewRoutes from './routes/courseReviewRoutes';
import courseComparisonRoutes from './routes/courseComparisonRoutes';
import courseBundleRoutes from './routes/courseBundleRoutes';
import courseWaitlistRoutes from './routes/courseWaitlistRoutes';
import notificationRoutes from './routes/notificationRoutes';
import uploadRoutes from './routes/uploadRoutes';
import announcementRoutes from './routes/announcementRoutes';
import moderationRoutes from './routes/moderationRoutes';
import referralRoutes from './routes/referralRoutes';
import certificateRoutes from './routes/certificateRoutes';
import learningAnalyticsRoutes from './routes/learningAnalyticsRoutes';
import collaborativeProjectRoutes from './routes/collaborativeProjectRoutes';
import mentorshipRoutes from './routes/mentorshipRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import mentorApplicationRoutes from './routes/mentorApplicationRoutes';
import adminRoutes from './routes/adminRoutes';
import codePlaygroundRoutes from './routes/codePlaygroundRoutes';
import githubRoutes from './routes/githubRoutes';
import flashcardRoutes from './routes/flashcardRoutes';
import studyToolsRoutes from './routes/studyToolsRoutes';
import liveSessionRoutes from './routes/liveSessionRoutes';
import helpSupportRoutes from './routes/helpSupportRoutes';
import accessibilityRoutes from './routes/accessibilityRoutes';
import translationRoutes from './routes/translationRoutes';
import pwaRoutes from './routes/pwaRoutes';
import dataPrivacyRoutes from './routes/dataPrivacyRoutes';
import publicApiRoutes from './routes/publicApiRoutes';
import apiKeyRoutes from './routes/apiKeyRoutes';
import webhookRoutes from './routes/webhookRoutes';
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/rubrics', rubricRoutes);
app.use('/api/course-suggestions', courseSuggestionRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/learning-goals', learningGoalRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/course-completions', courseCompletionRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/saved-content', savedContentRoutes);
app.use('/api/learning-paths', learningPathRoutes);
app.use('/api/course-reviews', courseReviewRoutes);
app.use('/api/course-comparison', courseComparisonRoutes);
app.use('/api/course-bundles', courseBundleRoutes);
app.use('/api/course-waitlist', courseWaitlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/analytics', learningAnalyticsRoutes);
app.use('/api/projects/collaborative', collaborativeProjectRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/mentor-applications', mentorApplicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/playground', codePlaygroundRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/study-tools', studyToolsRoutes);
app.use('/api/live-sessions', liveSessionRoutes);
app.use('/api/help', helpSupportRoutes);
app.use('/api/accessibility', accessibilityRoutes);
app.use('/api/i18n', translationRoutes);
app.use('/api/pwa', pwaRoutes);
app.use('/api/privacy', dataPrivacyRoutes);
app.use('/api/public', publicApiRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/webhooks', webhookRoutes);
// etc.

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

