# Judge0 EC2 Setup Checklist

Based on your Docker output, Judge0 is running. Here's what to check:

## ✅ What's Working
- Judge0 containers are running (3 days uptime)
- Port 2358 is mapped: `0.0.0.0:2358->2358/tcp`
- All required containers are up (server, worker, db, redis)

## 🔍 What to Check Next

### 1. Test from EC2 (Internal Test)
Run this ON your EC2 instance to verify Judge0 is responding:

```bash
curl -X POST http://localhost:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"hello\")","language_id":71,"stdin":""}'
```

**Expected**: Should return JSON with a `token` field
**If this fails**: Judge0 API is not working internally

### 2. Test from Your Local Machine (External Test)
Run this from YOUR computer (not EC2) to test if Railway can reach it:

```bash
# Try HTTP first (most common)
curl -v -X POST http://18.210.22.226:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"hello\")","language_id":71,"stdin":""}' \
  --max-time 10
```

**If HTTP works**: Set `JUDGE0_API_URL=http://18.210.22.226:2358` in Railway
**If HTTP fails with "Connection refused"**: Check EC2 Security Group

### 3. Check EC2 Security Group
AWS Console → EC2 → Your Instance → Security Tab → Security Groups

**Required Inbound Rule:**
- Type: Custom TCP
- Port: 2358
- Source: 0.0.0.0/0 (or Railway's IP range if you want to restrict)
- Description: Judge0 API

**If this rule is missing**: Add it! This is likely your issue.

### 4. Check if Judge0 is Listening on All Interfaces
On EC2, run:
```bash
sudo netstat -tlnp | grep 2358
# or
sudo ss -tlnp | grep 2358
```

**Should show**: `0.0.0.0:2358` or `:::2358` (listening on all interfaces)
**If shows**: `127.0.0.1:2358` (only localhost) → That's the problem!

### 5. Check Docker Network Configuration
Your docker-compose might be binding to localhost only. Check:

```bash
# On EC2
cat docker-compose.yml | grep -A 5 "ports:"
# or
docker inspect judge0_server_1 | grep -A 10 "Ports"
```

Should show: `"0.0.0.0:2358->2358/tcp"` (which it does from your output ✅)

## Most Likely Issues

### Issue 1: Security Group Not Allowing Port 2358
**Symptom**: Can't connect from outside, works on localhost
**Fix**: Add inbound rule for port 2358 in EC2 Security Group

### Issue 2: Using HTTPS Instead of HTTP
**Symptom**: SSL/TLS errors, connection refused
**Fix**: Change `JUDGE0_API_URL` to `http://` instead of `https://`

### Issue 3: Judge0 Not Exposed to External IP
**Symptom**: Works on localhost, fails from outside
**Fix**: Check docker-compose.yml ensures binding to `0.0.0.0`

## Quick Fix Steps

1. **Add Security Group Rule** (if missing):
   - AWS Console → EC2 → Security Groups
   - Select your instance's security group
   - Inbound Rules → Edit → Add Rule
   - Type: Custom TCP, Port: 2358, Source: 0.0.0.0/0

2. **Test from Local Machine**:
   ```bash
   curl http://18.210.22.226:2358/submissions \
     -H "Content-Type: application/json" \
     -d '{"source_code":"print(1)","language_id":71}'
   ```

3. **Update Railway Environment Variable**:
   - Based on test results, set:
     - `JUDGE0_API_URL=http://18.210.22.226:2358` (if HTTP works)
     - OR `JUDGE0_API_URL=https://18.210.22.226:2358` (if HTTPS works)

4. **Redeploy Backend** on Railway

## Still Not Working?

Share the output of:
1. `curl` test from your local machine
2. Security group inbound rules screenshot
3. Railway backend logs after trying to run code

