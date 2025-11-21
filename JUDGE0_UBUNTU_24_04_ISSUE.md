# Ubuntu 24.04 Memory Cgroup Issue - Solutions

## Problem
Ubuntu 24.04 does not enable the memory cgroup controller by default, even with kernel parameters. This is required for Judge0's `isolate` sandbox to work properly.

**Symptoms:**
- `Status 13: Internal Error` from Judge0
- `Failed to create control group /sys/fs/cgroup/memory/box-*`
- `ls /sys/fs/cgroup/` shows no `memory` directory

**Root Cause:**
Ubuntu 24.04 uses a newer kernel that may have the memory cgroup controller disabled or requires different configuration than previous versions.

## Solutions (Ranked by Ease)

### ✅ Option 1: Use RapidAPI Judge0 (RECOMMENDED - Easiest)

**Why this is best:**
- No server management
- No cgroups issues
- Reliable and maintained
- Free tier available
- Works immediately

**Steps:**
1. Sign up at [RapidAPI](https://rapidapi.com)
2. Subscribe to [Judge0 API](https://rapidapi.com/judge0-official/api/judge0-ce)
3. Get your API key from RapidAPI dashboard
4. In Railway, set:
   ```
   JUDGE0_API_KEY=your-rapidapi-key-here
   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
   ```
5. Remove or leave blank `JUDGE0_AUTH_TOKEN`
6. Redeploy backend

**Cost:** Free tier available, then pay-as-you-go

---

### Option 2: Use Ubuntu 22.04 EC2 Instance

Ubuntu 22.04 has better cgroups v1 support and the memory controller can be enabled more reliably.

**Steps:**
1. Launch new EC2 instance with Ubuntu 22.04 LTS
2. Follow the same Judge0 setup steps
3. Enable cgroups v1:
   ```bash
   sudo nano /etc/default/grub
   # Add: GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0 cgroup_enable=memory swapaccount=1"
   sudo update-grub
   sudo reboot
   ```
4. Verify: `ls /sys/fs/cgroup/memory/` should exist
5. Install Judge0 as before
6. Update Railway `JUDGE0_API_URL` to new instance IP

---

### Option 3: Try Alternative Kernel Parameters (Advanced)

If you want to keep Ubuntu 24.04, try these additional kernel parameters:

```bash
sudo nano /etc/default/grub
```

Change `GRUB_CMDLINE_LINUX` to:
```bash
GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0 cgroup_enable=memory cgroup_memory=1 swapaccount=1 cgroup_no_v1=none"
```

Then:
```bash
sudo update-grub
sudo reboot
```

After reboot, check:
```bash
ls /sys/fs/cgroup/memory/ && echo "✅ Success" || echo "❌ Still missing"
```

**Note:** This may still not work on Ubuntu 24.04 depending on your kernel version.

---

### Option 4: Check Kernel Support

Verify if your kernel even supports memory cgroup:

```bash
# Check kernel version
uname -r

# Check if memory cgroup is compiled in
zgrep CONFIG_MEMCG /proc/config.gz 2>/dev/null || echo "Cannot check"

# Try loading cgroup module
sudo modprobe cgroup_memory 2>&1
ls /sys/fs/cgroup/memory/ && echo "✅ Module loaded" || echo "❌ Not available"
```

If the module doesn't exist or can't be loaded, your kernel doesn't support it and you need Option 1 or 2.

---

## Recommendation

**Use RapidAPI Judge0 (Option 1)** - It's the fastest, most reliable solution and eliminates all infrastructure headaches. The free tier is generous for development and testing.

If you specifically need self-hosting for compliance/security reasons, use **Ubuntu 22.04 (Option 2)**.

---

## Quick Switch to RapidAPI

If you want to switch to RapidAPI right now:

1. **Get RapidAPI key:**
   - Go to https://rapidapi.com/judge0-official/api/judge0-ce
   - Click "Subscribe to Test" (free tier)
   - Copy your API key from the dashboard

2. **Update Railway:**
   - Go to Railway → Your Backend Service → Variables
   - Set `JUDGE0_API_KEY` to your RapidAPI key
   - Set `JUDGE0_API_URL` to `https://judge0-ce.p.rapidapi.com`
   - Remove or leave blank `JUDGE0_AUTH_TOKEN`
   - Save and redeploy

3. **Test:**
   - Go to Code Playground
   - Run `print("Hello, World!")`
   - Should work immediately! 🎉

---

## What to Do with EC2 Instance

If you switch to RapidAPI:
- You can **terminate the EC2 instance** to save costs
- Or **keep it** for other services
- Or **reinstall with Ubuntu 22.04** if you want to try self-hosting again later

