# Railway Environment Variables Setup

## Required Variables (Minimum to Deploy)

These are the **absolute minimum** variables needed for the backend to start:

```env
# Server Configuration
NODE_ENV=production
PORT=5000  # Railway will set this automatically, but you can override

# Database (REQUIRED)
MONGODB_URI=your_mongodb_atlas_connection_string

# JWT (REQUIRED)
JWT_SECRET=your_strong_random_secret_key_here
JWT_EXPIRE=30d

# Frontend URL (REQUIRED for CORS)
FRONTEND_URL=https://squirrelsquadacademy.com
```

## Essential Variables (For Core Features)

Add these for basic functionality:

```env
# Email Service (Required for user registration/verification)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@squirrelsquadacademy.com

# Domain
DOMAIN=squirrelsquadacademy.com
```

## Optional Variables (Feature-Specific)

Add these as you enable features:

### OAuth Authentication
```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_ACCESS_TOKEN=your_github_access_token  # Optional
GITHUB_ORG_NAME=your_org_name  # Optional

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

### Payments (Stripe)
```env
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### AI Features (OpenAI)
```env
OPENAI_API_KEY=your_openai_api_key
```

### File Storage
```env
# Cloudinary (for images/videos)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AWS S3 (for documents/files)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket_name
```

### Code Execution (Required for Code Playground)
```env
# Judge0 API - Required for code playground feature
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_judge0_api_key
# Get API key from: https://rapidapi.com/judge0-official/api/judge0-ce
```

### Message Encryption (Required for Direct Messaging)
```env
ENCRYPTION_KEY=your_64_character_hex_key_here
```

### Email Verification (Optional)
```env
REQUIRE_EMAIL_VERIFICATION=true  # Set to 'false' to disable
```

## How to Set Variables in Railway

1. Go to your Railway project dashboard
2. Select your `SquirrelSquadAcademy` service
3. Click on the **Variables** tab
4. Click **+ New Variable**
5. Add each variable:
   - **Name**: The variable name (e.g., `MONGODB_URI`)
   - **Value**: The variable value
   - **Environment**: Select which environment (usually `production`)

## Quick Setup Checklist

### Minimum Setup (Backend will start):
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI` (MongoDB Atlas connection string)
- [ ] `JWT_SECRET` (generate a strong random string)
- [ ] `FRONTEND_URL` (your Vercel frontend URL)

### Recommended Setup (Core features work):
- [ ] All minimum variables
- [ ] `RESEND_API_KEY` (for email)
- [ ] `EMAIL_FROM` (email address)
- [ ] `DOMAIN` (your domain)

### Full Setup (All features enabled):
- [ ] All recommended variables
- [ ] OAuth credentials (GitHub, Google, Discord)
- [ ] Stripe keys (for payments)
- [ ] OpenAI API key (for AI features)
- [ ] Cloudinary credentials (for media)
- [ ] AWS S3 credentials (for files)
- [ ] `ENCRYPTION_KEY` (for messaging)

## Generating Secrets

### JWT Secret:
```bash
openssl rand -base64 32
```

### Encryption Key (64 character hex):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Notes

- Railway automatically sets `PORT` - you don't need to set it unless you want to override
- Variables are case-sensitive
- Never commit secrets to git
- Use Railway's environment-specific variables for different environments
- You can reference other variables using `${VARIABLE_NAME}` syntax in Railway

