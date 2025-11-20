# Judge0 Connection Troubleshooting Guide

## You're Getting 502 Bad Gateway - Here's How to Debug

### Step 1: Check Your Railway Backend Logs

The backend now logs detailed error information. Check your Railway logs to see the exact error:

1. Go to Railway dashboard → Your backend service → **Logs** tab
2. Look for lines starting with `[ERROR]` when you try to run code
3. You should see detailed error information including:
   - Error code (ECONNREFUSED, ETIMEDOUT, EPROTO, etc.)
   - The exact URL being called
   - Response status if any
   - Whether it's detected as self-hosted

### Step 2: Common Issues and Solutions

#### Issue: `ECONNREFUSED` or `ETIMEDOUT`
**Meaning**: Cannot connect to Judge0 service

**Check:**
1. Is Judge0 running on your EC2 instance?
   ```bash
   ssh into your EC2 instance
   docker ps  # or check if Judge0 process is running
   ```

2. Is the port correct? (You're using `:2358`)
   - Default Judge0 port is usually `2358` for API
   - Check your Judge0 configuration

3. Is the EC2 security group allowing inbound traffic on port 2358?
   - AWS Console → EC2 → Security Groups
   - Ensure port 2358 is open from Railway's IP or 0.0.0.0/0

4. Can Railway reach your EC2 instance?
   - Railway runs in the cloud and needs to reach your EC2 public IP
   - Test from Railway's network if possible

#### Issue: `EPROTO` or SSL/TLS errors
**Meaning**: SSL certificate problem

**Solutions:**
1. **Try HTTP instead of HTTPS** if you don't have SSL configured:
   ```env
   JUDGE0_API_URL=http://18.210.22.226:2358
   ```
   
2. If you need HTTPS, ensure your Judge0 has valid SSL certificates
3. The code already has `rejectUnauthorized: false` to handle self-signed certs

#### Issue: `ENOTFOUND` or `EAI_AGAIN`
**Meaning**: Cannot resolve hostname

**Check:**
- If using a domain name, ensure DNS is configured
- If using IP address (like you are), this shouldn't happen
- Double-check the URL has no typos

#### Issue: `404 Not Found`
**Meaning**: Judge0 is reachable but endpoint is wrong

**Check:**
- Judge0 API endpoint should be: `{URL}/submissions`
- Ensure your Judge0 is running the API service, not just the web UI
- Check Judge0 documentation for correct API path

#### Issue: `401 Unauthorized`
**Meaning**: Authentication is required

**Solution:**
- Set `JUDGE0_AUTH_TOKEN` environment variable
- See `JUDGE0_AUTH_GUIDE.md` for details

### Step 3: Test Your Judge0 Instance Directly

Test if your Judge0 is accessible from outside:

```bash
# Test if the service is reachable
curl -v https://18.210.22.226:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"hello\")","language_id":71,"stdin":""}'

# Or try HTTP if HTTPS fails
curl -v http://18.210.22.226:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"hello\")","language_id":71,"stdin":""}'
```

**Expected response**: Should return a JSON with a `token` field
**If it fails**: The issue is with Judge0 accessibility, not the backend

### Step 4: Verify Environment Variables

Double-check in Railway:
1. `JUDGE0_API_URL` is set (not `JUDGEO_API_URL` - note the zero, not letter O)
2. Value is exactly: `https://18.210.22.226:2358` or `http://18.210.22.226:2358`
3. No trailing slashes
4. `JUDGE0_AUTH_TOKEN` is set ONLY if you get 401 errors
5. `JUDGE0_API_KEY` should be empty/not set for self-hosted

### Step 5: Common Configuration Mistakes

1. **Wrong protocol**: Using `https://` when Judge0 is `http://`
   - **Fix**: Try `http://18.210.22.226:2358`

2. **Wrong port**: Judge0 might be on a different port
   - **Check**: SSH into EC2 and check what port Judge0 is listening on
   - Common ports: `2358` (API), `80` (HTTP), `443` (HTTPS)

3. **Security group blocking**: EC2 security group not allowing port 2358
   - **Fix**: AWS Console → EC2 → Security Groups → Add inbound rule for port 2358

4. **Judge0 not running**: Service stopped or crashed
   - **Fix**: SSH into EC2 and restart Judge0
   ```bash
   docker restart <judge0-container>
   # or
   sudo systemctl restart judge0
   ```

5. **Firewall blocking**: EC2 instance firewall blocking the port
   - **Fix**: Check `ufw` or `iptables` on the EC2 instance

### Step 6: Check Railway Logs for Specific Error

After deploying the updated code, the logs will show:
```
[INFO] Judge0 configuration: { url: '...', isSelfHosted: true, ... }
[ERROR] Error executing code with Judge0: { detailed error info }
```

Look for the specific error code and message to identify the exact issue.

### Quick Diagnostic Checklist

- [ ] Judge0 is running on EC2 (check `docker ps` or process)
- [ ] EC2 security group allows inbound on port 2358
- [ ] `JUDGE0_API_URL` is set correctly in Railway (with zero, not O)
- [ ] Try both `http://` and `https://` protocols
- [ ] Test with `curl` from your local machine to verify Judge0 is accessible
- [ ] Check Railway logs for the specific error code
- [ ] Verify no firewall is blocking the connection
- [ ] Ensure Judge0 API is on the `/submissions` endpoint

### Still Not Working?

If you've checked everything above, share:
1. The exact error from Railway logs (the `[ERROR]` line)
2. Result of `curl` test to your Judge0 URL
3. Output of `docker ps` or Judge0 status on EC2
4. Your EC2 security group inbound rules

