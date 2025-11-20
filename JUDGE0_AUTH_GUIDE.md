# Judge0 Authentication Guide

## Do You Need an Auth Token?

**Short answer: Probably NOT.** By default, self-hosted Judge0 does NOT require authentication.

## How to Check if You Need `JUDGE0_AUTH_TOKEN`

### Method 1: Test Without Token (Easiest)
1. Set up your environment with just `JUDGE0_API_URL` (no `JUDGE0_AUTH_TOKEN`)
2. Try running code in the playground
3. **If you get `401 Unauthorized` error** → Authentication is enabled, you need a token
4. **If it works** → No token needed! ✅

### Method 2: Check Your Judge0 Configuration

#### If using Docker:
```bash
# Check your docker-compose.yml or environment variables
docker exec <judge0-container> env | grep AUTH_TOKEN
# or
docker exec <judge0-container> cat /judge0/config.yml | grep auth_token
```

#### If using config.yml:
Look for these settings in your Judge0 `config.yml`:
```yaml
enable_authentication: true  # If this is true, auth is required
auth_token: "your-token-here"  # This is your auth token
```

#### Common locations:
- Docker environment variable: `AUTH_TOKEN` or `JUDGE0_AUTH_TOKEN`
- Config file: `config.yml` → `auth_token` field
- Kubernetes: Check your deployment YAML for `AUTH_TOKEN` env var

## Where to Find Your Auth Token

If authentication is enabled, the token is typically:

1. **In your Judge0 deployment configuration:**
   - Docker: `docker-compose.yml` or environment variables
   - Kubernetes: Deployment YAML or ConfigMap
   - Direct install: `config.yml` file

2. **Check your EC2 instance** (if that's where you deployed):
   ```bash
   # SSH into your EC2 instance
   ssh -i your-key.pem ubuntu@18.210.22.226
   
   # If using Docker
   docker ps  # Find your Judge0 container
   docker exec <container-id> env | grep AUTH
   
   # If using config file
   cat /path/to/judge0/config.yml | grep auth_token
   ```

3. **If you set it up yourself:**
   - It's whatever value you set when you configured Judge0
   - Check your deployment scripts or setup notes

4. **If you can't find it:**
   - You can regenerate it by updating your Judge0 configuration
   - Or disable authentication if you don't need it

## Quick Test Command

Test if your Judge0 instance requires auth:

```bash
# Test without auth token
curl -X POST https://18.210.22.226:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"hello\")","language_id":71}'

# If you get 401, auth is required
# If you get a token back, no auth needed!
```

## For Your Setup (18.210.22.226:2358)

Based on your EC2 instance, try this:

1. **First, try WITHOUT `JUDGE0_AUTH_TOKEN`** - just set `JUDGE0_API_URL=https://18.210.22.226:2358`
2. If you get `401 Unauthorized` errors, then:
   - SSH into your EC2 instance
   - Check your Judge0 configuration
   - Look for `AUTH_TOKEN` or `auth_token` in your setup
3. If you can't find it and get 401 errors, you may need to either:
   - Disable authentication in your Judge0 config
   - Or set a new auth token in your Judge0 configuration

## Summary

- **Default**: No auth token needed
- **Test**: Try without token first, check for 401 errors
- **Find token**: Check your Judge0 config files or Docker env vars
- **Your case**: Start without `JUDGE0_AUTH_TOKEN`, add it only if you get 401 errors

