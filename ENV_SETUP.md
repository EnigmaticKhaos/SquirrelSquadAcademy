# Environment Variables Setup Guide

This guide will help you set up all the necessary environment variables for SquirrelSquad Academy.

## Quick Start

1. Copy the example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Fill in your credentials in the `.env` file

3. Never commit the `.env` file to version control!

## Required Services & API Keys

### 1. MongoDB Database
- **Local**: Install MongoDB locally or use Docker
- **Cloud**: Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Variable**: `MONGODB_URI`

### 2. JWT Secret
- Generate a strong random secret:
  ```bash
  openssl rand -base64 32
  ```
- **Variable**: `JWT_SECRET`

### 3. Resend (Email Service)
- Sign up at [Resend](https://resend.com)
- Get API key from [API Keys](https://resend.com/api-keys)
- Verify your domain for sending emails
- **Variables**: `RESEND_API_KEY`, `EMAIL_FROM`

### 4. OpenAI API
- Sign up at [OpenAI](https://platform.openai.com)
- Get API key from [API Keys](https://platform.openai.com/api-keys)
- **Variable**: `OPENAI_API_KEY`

### 5. Stripe (Payments)
- Sign up at [Stripe](https://stripe.com)
- Get test keys from [API Keys](https://dashboard.stripe.com/test/apikeys)
- Set up webhook endpoint for production
- **Variables**: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

### 6. GitHub OAuth
- Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
- Create new OAuth App
- Set Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
- For production: `https://api.squirrelsquadacademy.com/api/auth/github/callback`
- **Variables**: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- **Optional**: `GITHUB_ORG_NAME`, `GITHUB_ACCESS_TOKEN` (for GitHub integration features)

### 7. Google OAuth
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create new project
- Enable Google+ API
- Create OAuth 2.0 credentials
- Set authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
- **Variables**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### 8. Discord OAuth
- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Create new application
- Go to OAuth2 section
- Add redirect URI: `http://localhost:5000/api/auth/discord/callback`
- **Variables**: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`

### 9. Cloudinary (Media Storage)
- Sign up at [Cloudinary](https://cloudinary.com)
- Get credentials from [Dashboard](https://cloudinary.com/console)
- **Variables**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 10. AWS S3 (File Storage)
- Sign up at [AWS](https://aws.amazon.com)
- Create S3 bucket
- Create IAM user with S3 permissions
- Get access keys
- **Variables**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`

### 11. Code Execution Service (Judge0 - Required for Code Playground)

Choose one option:

**Option A: RapidAPI-Hosted Judge0 (Easiest)**
- Sign up at [RapidAPI](https://rapidapi.com)
- Subscribe to [Judge0 API](https://rapidapi.com/judge0-official/api/judge0-ce)
- Get API key from RapidAPI dashboard
- **Variables**: 
  - `JUDGE0_API_KEY` (required - get from RapidAPI)
  - `JUDGE0_API_URL` is optional (defaults to `https://judge0-ce.p.rapidapi.com`)

**Option B: Self-Hosted Judge0**
- Deploy your own Judge0 instance (see [Judge0 GitHub](https://github.com/judge0/judge0))
- **Variables**:
  - `JUDGE0_API_URL` (required - set to your self-hosted instance URL, e.g., `https://judge0.yourdomain.com`)
  - `JUDGE0_AUTH_TOKEN` (optional - only if your self-hosted instance requires authentication)
  - `JUDGE0_API_KEY` is NOT needed for self-hosted instances

**How to know if you need `JUDGE0_AUTH_TOKEN`:**
1. **By default, Judge0 does NOT require authentication** - try without the token first
2. **Test your instance**: Make a request to `https://your-judge0-url.com/submissions` without auth
   - If you get `401 Unauthorized`, authentication is enabled and you need a token
   - If the request succeeds, no token is needed
3. **Where to find the auth token** (if enabled):
   - Check your Judge0 `config.yml` file for the `auth_token` field
   - Or check your Docker environment variables if using Docker: `AUTH_TOKEN` or `JUDGE0_AUTH_TOKEN`
   - If you set it up yourself, it's the value you configured when enabling authentication
   - Check your Judge0 deployment configuration files

**Note**: The code playground requires Judge0 to be configured. Set either `JUDGE0_API_KEY` (for RapidAPI) or `JUDGE0_API_URL` (for self-hosted).

### 12. Encryption Key (Required for Message Encryption)

Generate a 64-character hex encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env`:
```env
ENCRYPTION_KEY=your_64_character_hex_key_here
```

**Important**: This key is used to encrypt/decrypt direct messages. Keep it secure and never commit it to version control.

## Optional Configuration

### Domain Setup
- Update `DOMAIN` with your actual domain
- Subdomains: `api.squirrelsquadacademy.com` (backend), `www.squirrelsquadacademy.com` (frontend)

### Rate Limiting
- Adjust `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` as needed

### File Upload Limits
- Adjust `MAX_FILE_SIZE` (in bytes) as needed

## Production Checklist

Before deploying to production:

- [ ] Change `NODE_ENV` to `production`
- [ ] Use production MongoDB URI (MongoDB Atlas)
- [ ] Generate strong `JWT_SECRET` (never use default)
- [ ] Use production Stripe keys (live keys, not test)
- [ ] Update OAuth callback URLs to production domains
- [ ] Verify email domain in Resend
- [ ] Set up production S3 bucket
- [ ] Update `FRONTEND_URL` to production URL
- [ ] Set up proper CORS origins
- [ ] Enable rate limiting
- [ ] Set `SKIP_EMAIL_VERIFICATION=false`
- [ ] Set `DEBUG=false`

## Security Notes

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use strong secrets** - Generate random strings for JWT_SECRET
3. **Rotate keys regularly** - Especially in production
4. **Use environment-specific keys** - Different keys for dev/staging/prod
5. **Limit API key permissions** - Only grant necessary permissions
6. **Monitor API usage** - Set up alerts for unusual activity

## Testing Without All Services

You can start development with minimal setup:
- MongoDB (required)
- JWT_SECRET (required)
- Other services can be added as you implement features

The app will work with placeholder values, but features requiring those services won't function until proper credentials are added.

