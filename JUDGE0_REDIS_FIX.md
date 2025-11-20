# Fix Judge0 Redis Authentication Error

## The Problem
```
Redis::CommandError (ERR AUTH <password> called without any password configured for the default user.
```

Judge0 is trying to authenticate with Redis, but Redis has no password configured.

## The Fix

You need to check your Judge0 configuration and either:
1. Remove Redis password from Judge0 config, OR
2. Add a password to Redis and configure Judge0 to use it

### Option 1: Remove Redis Password (Easiest)

On your EC2 instance, check your docker-compose.yml or environment:

```bash
# Check docker-compose.yml
cat docker-compose.yml | grep -A 10 redis
# or
cat docker-compose.yml | grep REDIS
```

Look for `REDIS_PASSWORD` or similar environment variables.

**Fix**: Either remove the `REDIS_PASSWORD` environment variable, or set it to empty:

```bash
# Edit your docker-compose.yml or .env file
# Remove or comment out REDIS_PASSWORD
# Or set it to empty: REDIS_PASSWORD=
```

Then restart Judge0:
```bash
cd /path/to/judge0
docker-compose down
docker-compose up -d
```

### Option 2: Configure Redis with Password

If you want Redis to have a password:

1. **Set Redis password** in docker-compose.yml:
```yaml
redis:
  image: redis:7.2.4
  command: redis-server --requirepass your_redis_password
```

2. **Set Judge0 to use the password**:
```yaml
environment:
  REDIS_PASSWORD: your_redis_password
```

### Quick Fix Commands

Run these on your EC2 instance:

```bash
# 1. Check current Redis configuration
docker exec judge0_redis_1 redis-cli CONFIG GET requirepass

# 2. Check Judge0 environment variables
docker exec judge0_server_1 env | grep REDIS

# 3. Check docker-compose.yml location
find /home -name "docker-compose.yml" 2>/dev/null
# or
ls -la ~/judge0/
ls -la /opt/judge0/
```

### Most Common Solution

Usually, you just need to remove the `REDIS_PASSWORD` environment variable from your Judge0 configuration:

```bash
# Find and edit docker-compose.yml
nano docker-compose.yml
# or
vi docker-compose.yml

# Look for lines like:
# REDIS_PASSWORD=something
# And either remove it or set to empty: REDIS_PASSWORD=

# Then restart
docker-compose down
docker-compose up -d
```

### Verify the Fix

After restarting, test again:
```bash
curl -X POST http://localhost:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(1)","language_id":71}' \
  --max-time 5
```

Should return a JSON response with a `token` field instead of 500 error.

