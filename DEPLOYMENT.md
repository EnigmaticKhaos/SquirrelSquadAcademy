# Deployment Guide

This guide covers deploying SquirrelSquad Academy to production.

## Architecture

- **Frontend**: Next.js on Vercel
- **Backend**: Node.js/Express on Railway or Render
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary (images/videos) + AWS S3 (documents)
- **Domain**: squirrelsquadacademy.com

## Prerequisites

1. GitHub repository set up
2. MongoDB Atlas account and cluster
3. Vercel account
4. Railway or Render account
5. Domain name (squirrelsquadacademy.com) configured on GoDaddy
6. All service accounts configured (see ENV_SETUP.md)

## Frontend Deployment (Vercel)

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the repository and click "Import"

### 2. Configure Project Settings

**Framework Preset**: Next.js
**Root Directory**: `frontend` (if monorepo) or `.` (if separate repo)
**Build Command**: `npm run build` (or `cd frontend && npm run build`)
**Output Directory**: `.next` (or `frontend/.next`)

### 3. Environment Variables

Add the following environment variables in Vercel:

```env
NEXT_PUBLIC_API_URL=https://api.squirrelsquadacademy.com
NEXT_PUBLIC_APP_URL=https://squirrelsquadacademy.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
```

### 4. Domain Configuration

1. In Vercel project settings, go to "Domains"
2. Add `squirrelsquadacademy.com`
3. Add `www.squirrelsquadacademy.com` (optional)
4. Follow DNS configuration instructions

### 5. DNS Configuration (GoDaddy)

Add the following DNS records:

**Type A Record:**
- Name: `@`
- Value: Vercel's IP address (provided by Vercel)
- TTL: 3600

**Type CNAME Record:**
- Name: `www`
- Value: `cname.vercel-dns.com`
- TTL: 3600

**Type CNAME Record (for subdomains):**
- Name: `api`
- Value: Your backend domain (Railway/Render)
- TTL: 3600

## Backend Deployment (Railway)

### 1. Connect Repository to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 2. Configure Service

1. Railway will auto-detect Node.js
2. Set **Root Directory**: `backend`
3. Set **Start Command**: `npm start`
4. Set **Build Command**: `npm run build`

### 3. Environment Variables

Add all environment variables from `backend/.env.example`:

```env
# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://squirrelsquadacademy.com

# Database
MONGODB_URI=your_mongodb_atlas_connection_string

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@squirrelsquadacademy.com

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_s3_bucket_name

# GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_ACCESS_TOKEN=your_github_access_token
GITHUB_ORG_NAME=your_github_org_name

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Judge0 (if self-hosted)
JUDGE0_API_URL=your_judge0_api_url

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:support@squirrelsquadacademy.com
```

### 4. Domain Configuration

1. In Railway project settings, go to "Settings" → "Networking"
2. Generate a domain or add custom domain
3. For custom domain, add `api.squirrelsquadacademy.com`
4. Update DNS records in GoDaddy:

**Type CNAME Record:**
- Name: `api`
- Value: Railway's provided domain
- TTL: 3600

### 5. Webhook Configuration

Update Stripe webhook URL:
- URL: `https://api.squirrelsquadacademy.com/api/stripe/webhook`
- Events: All relevant Stripe events

## Backend Deployment (Render - Alternative)

### 1. Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository

### 2. Configure Service

- **Name**: squirrelsquadacademy-api
- **Environment**: Node
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm start`
- **Plan**: Free or Starter

### 3. Environment Variables

Add all environment variables (same as Railway section above)

### 4. Domain Configuration

1. In service settings, go to "Custom Domains"
2. Add `api.squirrelsquadacademy.com`
3. Update DNS records in GoDaddy (same as Railway)

## MongoDB Atlas Setup

### 1. Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (M0 Free tier for development)
3. Choose a cloud provider and region

### 2. Network Access

1. Go to "Network Access"
2. Add IP address: `0.0.0.0/0` (allow all) or specific IPs
3. For production, restrict to Railway/Render IPs

### 3. Database Access

1. Go to "Database Access"
2. Create a database user
3. Set username and password
4. Grant "Atlas Admin" role (or custom role)

### 4. Connection String

1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` with your database user password
5. Add to environment variables as `MONGODB_URI`

## Auto-Deploy Configuration

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Railway/Render Auto-Deploy

Both Railway and Render automatically deploy on push to the main branch when connected to GitHub.

## Subdomain Configuration

### Recommended Subdomains

- `squirrelsquadacademy.com` - Main frontend (Vercel)
- `www.squirrelsquadacademy.com` - WWW redirect (Vercel)
- `api.squirrelsquadacademy.com` - Backend API (Railway/Render)
- `admin.squirrelsquadacademy.com` - Admin dashboard (optional, Vercel)
- `docs.squirrelsquadacademy.com` - Documentation (optional, Vercel)

### DNS Configuration (GoDaddy)

1. Log in to GoDaddy
2. Go to "DNS Management"
3. Add the following records:

**Type A Records:**
- `@` → Vercel IP (for main domain)
- `www` → Vercel IP (or CNAME to Vercel)

**Type CNAME Records:**
- `api` → Railway/Render domain
- `admin` → Vercel domain (if using)
- `docs` → Vercel domain (if using)

## SSL/HTTPS

Both Vercel and Railway/Render provide automatic SSL certificates via Let's Encrypt. No additional configuration needed.

## Environment-Specific Configuration

### Development
- Use local MongoDB or MongoDB Atlas free tier
- Use test Stripe keys
- Use development API keys

### Staging
- Use separate MongoDB cluster
- Use test Stripe keys
- Use staging subdomain: `staging.squirrelsquadacademy.com`

### Production
- Use production MongoDB cluster
- Use live Stripe keys
- Use production domain: `squirrelsquadacademy.com`

## Monitoring and Logs

### Vercel
- View logs in Vercel dashboard
- Set up Vercel Analytics
- Configure error tracking (Sentry, etc.)

### Railway
- View logs in Railway dashboard
- Set up Railway Metrics
- Configure alerts

### Render
- View logs in Render dashboard
- Set up Render Metrics
- Configure health checks

## Post-Deployment Checklist

- [ ] Verify frontend is accessible at main domain
- [ ] Verify backend API is accessible at api subdomain
- [ ] Test authentication (login, register)
- [ ] Test course enrollment
- [ ] Test payment processing (Stripe)
- [ ] Verify email sending (Resend)
- [ ] Test file uploads (Cloudinary, S3)
- [ ] Verify webhooks (Stripe, course completion)
- [ ] Check error logs
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Document API endpoints
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Enable security headers

## Troubleshooting

### Frontend Issues

**Build Fails:**
- Check environment variables
- Verify Node.js version
- Check build logs in Vercel

**API Connection Errors:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS configuration on backend
- Verify backend is running

### Backend Issues

**Database Connection Errors:**
- Verify MongoDB Atlas network access
- Check connection string
- Verify database user credentials

**Environment Variable Errors:**
- Check all required variables are set
- Verify variable names match exactly
- Check for typos

**Port Issues:**
- Railway/Render automatically assigns PORT
- Use `process.env.PORT || 5000` in code
- Don't hardcode port numbers

## Scaling Considerations

### Frontend (Vercel)
- Vercel automatically scales
- Consider upgrading plan for higher traffic
- Use Edge Functions for global distribution

### Backend (Railway/Render)
- Start with free/starter plan
- Upgrade as traffic increases
- Consider horizontal scaling
- Use load balancer for multiple instances

### Database (MongoDB Atlas)
- Start with M0 (Free) tier
- Upgrade to M10+ for production
- Enable auto-scaling
- Set up read replicas for high read traffic

## Backup Strategy

1. **Database Backups:**
   - MongoDB Atlas provides automatic backups
   - Configure backup schedule
   - Test restore procedures

2. **File Backups:**
   - Cloudinary and S3 provide redundancy
   - Consider cross-region replication
   - Set up versioning

3. **Code Backups:**
   - GitHub is the source of truth
   - Tag releases
   - Keep deployment history

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set secure environment variables
- [ ] Enable MongoDB authentication
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Regular security updates
- [ ] Monitor for vulnerabilities
- [ ] Set up DDoS protection
- [ ] Configure firewall rules

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [GoDaddy DNS Help](https://www.godaddy.com/help)

