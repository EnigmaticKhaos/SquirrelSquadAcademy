# Judge0 Setup Complete - Final Steps

## ✅ What's Fixed
- Judge0 is running on EC2 at `18.210.22.226:2358`
- Redis authentication issue resolved
- Internal test successful: Got token `{"token":"0e7f32fa-6f26-4f4e-bcea-ec5ed25ebdcb"}`

## 🔍 Next Steps

### 1. Test from Your Local Machine (External Access)
Run this from YOUR computer (not EC2) to verify Railway can reach it:

```bash
# Test HTTP (most likely)
curl -v http://18.210.22.226:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(1)","language_id":71}' \
  --max-time 10

# If HTTP works, you'll get a token back
# If it fails, check EC2 Security Group
```

### 2. Check EC2 Security Group
AWS Console → EC2 → Your Instance → Security Tab

**Ensure inbound rule exists:**
- Type: Custom TCP
- Port: 2358
- Source: 0.0.0.0/0 (or Railway IP range)
- Description: Judge0 API

### 3. Update Railway Environment Variables
Go to Railway → Your Backend Service → Variables

**Set:**
```
JUDGE0_API_URL=http://18.210.22.226:2358
```

**Important:**
- Use `http://` not `https://` (unless you configured SSL)
- Remove or leave blank `JUDGE0_API_KEY` (not needed for self-hosted)
- Remove or leave blank `JUDGE0_AUTH_TOKEN` (unless you enabled auth)

### 4. Redeploy Backend on Railway
After updating environment variables, Railway should auto-redeploy, or manually trigger a redeploy.

### 5. Test from Frontend
1. Go to your app's Code Playground
2. Try running `console.log("Hello, World!");`
3. Should work now! 🎉

## Troubleshooting

If external test fails:
1. **Check Security Group** - Port 2358 must be open
2. **Try HTTP vs HTTPS** - Start with HTTP
3. **Check Railway logs** - Look for the detailed error we added
4. **Verify URL** - No trailing slash, correct IP and port

## Summary of What Was Fixed
1. ✅ Fixed typo: `JUDGEO_API_URL` → `JUDGE0_API_URL` (zero not O)
2. ✅ Removed `--requirepass` from Redis in docker-compose.yml
3. ✅ Commented out `REDIS_PASSWORD=` in judge0.conf
4. ✅ Judge0 now working internally
5. ⏳ Next: Test external access and update Railway

