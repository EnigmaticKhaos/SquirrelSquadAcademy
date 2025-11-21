# Clean Judge0 Installation on Ubuntu 24.04 EC2

## Step 1: Clean Up Existing Installation

```bash
# Stop and remove Judge0
cd ~/judge0
docker-compose down -v  # -v removes volumes too

# Remove isolate (optional, Judge0 image might have it)
sudo apt-get remove --purge isolate 2>/dev/null || true
sudo rm -f /usr/local/bin/isolate /usr/local/sbin/isolate-cg-keeper
sudo rm -rf /var/local/lib/isolate

# Or keep your isolate installation if you want
```

## Step 2: Use Official Judge0 Setup

The easiest approach is to use the official Judge0 docker-compose setup:

```bash
# Clone fresh Judge0
cd ~
rm -rf judge0
git clone https://github.com/judge0/judge0.git
cd judge0

# Use the official docker-compose
cp docker-compose.yml docker-compose.yml.backup
```

## Step 3: Configure for Your Environment

```bash
# Edit judge0.conf
nano judge0.conf

# Key settings:
# - REDIS_PASSWORD= (leave empty or comment out)
# - POSTGRES_PASSWORD= (set a secure password)
# - Other settings as needed
```

## Step 4: Handle cgroups v2 Issue

Since Ubuntu 24.04 uses cgroups v2, you have two options:

### Option A: Enable cgroups v1 (Recommended for Judge0)
```bash
sudo nano /etc/default/grub
# Add: GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0 cgroup_enable=memory"
sudo update-grub
sudo reboot
```

### Option B: Use Judge0 without cgroups (Less secure)
Modify docker-compose.yml to disable cgroups in isolate calls, or use a different Judge0 configuration.

## Step 5: Start Judge0

```bash
cd ~/judge0
docker-compose up -d
sleep 20

# Check logs
docker logs judge0_worker_1 --tail 50
docker logs judge0_server_1 --tail 50
```

## Step 6: Test

```bash
curl -X POST http://localhost:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(1)","language_id":71}' \
  --max-time 30
```

## Alternative: Use Judge0 CE (Cloud Edition) Official Setup

The official Judge0 repository has a proper docker-compose that should handle isolate and cgroups automatically. Follow their official installation guide at: https://github.com/judge0/judge0

## Key Points

1. **Official image includes isolate** - You might not need to install it separately
2. **cgroups v1 is recommended** - Judge0 works better with cgroups v1
3. **Follow official docs** - The Judge0 GitHub has proper setup instructions
4. **Redis password** - Leave empty unless you specifically need it

