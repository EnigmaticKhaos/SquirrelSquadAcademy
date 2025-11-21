# Railway Judge0 Configuration

## Current Setup
- **Judge0 URL:** `http://3.80.2.110:2358`
- **Status:** ✅ Working on Ubuntu 22.04 EC2
- **Public IP:** `3.80.2.110`

## Railway Environment Variables

Go to **Railway Dashboard → Your Backend Service → Variables**

### Set These Variables:

```
JUDGE0_API_URL=http://3.80.2.110:2358
```

**Important:**
- Use `http://` not `https://` (no SSL on self-hosted instance)
- No trailing slash
- Exact IP and port: `3.80.2.110:2358`

### Remove or Leave Blank:

```
JUDGE0_API_KEY=
JUDGE0_AUTH_TOKEN=
```

Or simply delete these variables if they exist.

## Steps to Configure

1. **Open Railway Dashboard**
   - Go to https://railway.app
   - Select your backend service

2. **Navigate to Variables**
   - Click on "Variables" tab
   - Or go to Settings → Environment Variables

3. **Update JUDGE0_API_URL**
   - Find `JUDGE0_API_URL` or create new variable
   - Set value to: `http://3.80.2.110:2358`
   - Save

4. **Remove Unnecessary Variables**
   - Delete or clear `JUDGE0_API_KEY` (not needed for self-hosted)
   - Delete or clear `JUDGE0_AUTH_TOKEN` (not configured)

5. **Redeploy**
   - Railway should auto-redeploy when you save variables
   - Or manually trigger redeploy from Deployments tab
   - Wait for deployment to complete

6. **Check Logs**
   - Go to Deployments → Latest deployment → View Logs
   - Look for: "Judge0 configuration:" log message
   - Should show: `url: http://3.80.2.110:2358`, `isSelfHosted: true`

## Verify Backend Can Reach Judge0

After redeploy, check Railway logs for:

### ✅ Success Indicators:
- No connection errors
- "Judge0 configuration:" shows correct URL
- Code execution requests succeed
- Status 200 responses from Judge0

### ❌ Error Indicators:
- `ECONNREFUSED` - Security group not allowing Railway IPs
- `ETIMEDOUT` - Network issue or Judge0 down
- `502 Bad Gateway` - Judge0 service not running
- `Status 13: Internal Error` - Check EC2 Judge0 logs

## Test from Your App

1. **Go to Code Playground**
   - Navigate to `/playground` in your app
   - Or use the sidebar navigation

2. **Test Simple Code**
   ```python
   print("Hello, World!")
   ```
   - Select Python language
   - Click Run
   - Should see output: `Hello, World!`

3. **Test with Input**
   ```python
   x = int(input())
   print(x * 2)
   ```
   - Add stdin: `21`
   - Should see output: `42`

4. **Test JavaScript**
   ```javascript
   console.log("JS works!");
   ```
   - Should see output: `JS works!`

## Troubleshooting

### If Code Playground Still Fails

1. **Check Railway Logs**
   ```bash
   # Look for Judge0-related errors
   # Check the exact error message
   ```

2. **Verify EC2 Security Group**
   - AWS Console → EC2 → Your Instance → Security
   - Inbound rule: Port 2358, Source 0.0.0.0/0
   - Or restrict to Railway IP ranges

3. **Test Judge0 from EC2**
   ```bash
   # SSH into EC2
   curl -X POST http://localhost:2358/submissions?wait=true \
     -H "Content-Type: application/json" \
     -d '{"source_code":"print(1)","language_id":71}'
   ```

4. **Check Judge0 Logs on EC2**
   ```bash
   docker compose logs workers --tail 50
   docker compose ps  # Verify all containers running
   ```

5. **Verify Environment Variables in Railway**
   - Double-check `JUDGE0_API_URL` is exactly `http://3.80.2.110:2358`
   - No extra spaces or characters
   - Case-sensitive

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Security group blocking | Open port 2358 in EC2 Security Group |
| `ETIMEDOUT` | Judge0 down or slow | Check `docker compose ps` on EC2 |
| `502 Bad Gateway` | Judge0 not responding | Restart: `docker compose restart` |
| `Status 13` | Isolate/cgroup issue | Check workers logs for cgroup errors |
| No output | Backend not using wait=true | Already fixed in code |

## Success Checklist

- [ ] Railway `JUDGE0_API_URL` set to `http://3.80.2.110:2358`
- [ ] `JUDGE0_API_KEY` and `JUDGE0_AUTH_TOKEN` removed/blank
- [ ] Backend redeployed successfully
- [ ] Railway logs show no connection errors
- [ ] EC2 Security Group allows port 2358
- [ ] Code Playground executes Python code successfully
- [ ] Code Playground executes JavaScript code successfully
- [ ] Code Playground handles stdin correctly

## Next Steps After Configuration

Once working:
1. ✅ Monitor Railway logs for any issues
2. ✅ Set up EC2 instance auto-restart on reboot (optional)
3. ✅ Consider setting up a domain name and SSL (optional)
4. ✅ Monitor Judge0 resource usage on EC2
5. ✅ Set up backups for PostgreSQL data (optional)

## Support

If issues persist:
1. Check `JUDGE0_FINAL_FIX.md` for setup details
2. Check `JUDGE0_22_04_SUCCESS.md` for test results
3. Review EC2 workers logs: `docker compose logs workers --tail 100`
4. Review Railway backend logs for connection errors

