import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables based on NODE_ENV
// In test mode, try to load .env.test first, then fall back to .env
if (process.env.NODE_ENV === 'test') {
  const envTestPath = path.resolve(process.cwd(), '.env.test');
  // Try to load .env.test if it exists
  if (fs.existsSync(envTestPath)) {
    dotenv.config({ path: envTestPath });
  }
  // Always load .env as fallback for any missing variables (like OPENAI_API_KEY)
  dotenv.config({ override: false });
} else {
  dotenv.config();
}

export const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/squirrelsquadacademy',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  
  // Email (Resend)
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@squirrelsquadacademy.com',
  
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // GitHub OAuth
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  githubAccessToken: process.env.GITHUB_ACCESS_TOKEN || '',
  githubOrgName: process.env.GITHUB_ORG_NAME || '',
  
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // Discord OAuth
  discordClientId: process.env.DISCORD_CLIENT_ID || '',
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET || '',
  
  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  
  // AWS S3
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsS3Bucket: process.env.AWS_S3_BUCKET || '',
  
  // Domain
  domain: process.env.DOMAIN || 'squirrelsquadacademy.com',
};

