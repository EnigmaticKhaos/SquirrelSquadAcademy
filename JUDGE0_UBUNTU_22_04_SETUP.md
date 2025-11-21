# Judge0 Setup on Ubuntu 22.04 EC2 - Complete Guide

This guide will help you set up Judge0 on a fresh Ubuntu 22.04 EC2 instance, avoiding the cgroups issues we encountered with Ubuntu 24.04.

## Prerequisites

- Fresh Ubuntu 22.04 LTS EC2 instance
- SSH access to the instance
- Security group with port 2358 open (inbound from 0.0.0.0/0 or Railway IPs)
- At least 2GB RAM, 2 vCPU recommended

## Step 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git curl ca-certificates gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker and docker-compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add ubuntu user to docker group (avoid sudo)
sudo usermod -aG docker ubuntu

# Log out and back in, or run:
newgrp docker
```

## Step 2: Enable cgroups v1 (Critical for Judge0)

Ubuntu 22.04 uses cgroups v2 by default, but Judge0's `isolate` needs cgroups v1.

```bash
# Edit grub configuration
sudo nano /etc/default/grub
```

Find the line starting with `GRUB_CMDLINE_LINUX` and modify it to:

```bash
GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0 cgroup_enable=memory swapaccount=1"
```

**Important:** Keep any existing parameters, just add these to the end.

Then apply the changes:

```bash
# Update grub
sudo update-grub

# Reboot (required for cgroups changes)
sudo reboot
```

After reboot, SSH back in and verify:

```bash
# Check if memory cgroup exists
ls /sys/fs/cgroup/memory/ && echo "✅ Memory cgroup enabled!" || echo "❌ Still missing"

# Check cgroup version
stat -fc %T /sys/fs/cgroup/
# Should show: tmpfs (cgroups v1) or cgroup2fs (cgroups v2)
# We want tmpfs for v1

# List available controllers
ls /sys/fs/cgroup/ | grep -E "memory|cpu|pids"
# Should include: memory, cpu, pids, etc.
```

If `/sys/fs/cgroup/memory/` exists, you're good! If not, see troubleshooting below.

## Step 3: Install Judge0

```bash
# Clone Judge0
cd ~
git clone https://github.com/judge0/judge0.git
cd judge0

# Checkout stable version (optional, but recommended)
git checkout v1.13.0
```

## Step 4: Configure Judge0

```bash
# Edit configuration
nano judge0.conf
```

**Key settings to check/modify:**

```bash
# Redis - leave password empty for simplicity
REDIS_PASSWORD=

# PostgreSQL - set a secure password
POSTGRES_PASSWORD=your_secure_password_here

# Judge0 server settings
MAX_QUEUE_SIZE=10000
ENABLE_WAIT_RESULT=true
ENABLE_COMPILER_OPTIONS=true

# Worker settings
WORKER_TIMEOUT=60
```

Save and exit (Ctrl+X, Y, Enter).

## Step 5: Configure docker-compose.yml

```bash
# Backup original
cp docker-compose.yml docker-compose.yml.backup

# Edit docker-compose
nano docker-compose.yml
```

**Important checks:**

1. **Redis service** - Should NOT have `--requirepass` in command:
   ```yaml
   redis:
     image: redis:7-alpine
     command: redis-server --appendonly yes
     # NOT: command: redis-server --appendonly yes --requirepass "$$REDIS_PASSWORD"
   ```

2. **Worker service** - Should have cgroup mount:
   ```yaml
   worker:
     volumes:
       - /sys/fs/cgroup:/sys/fs/cgroup:ro
       # Or :rw if needed
   ```

3. **Ports** - Server should expose 2358:
   ```yaml
   server:
     ports:
       - "2358:2358"
   ```

If you made changes, save and exit.

## Step 6: Start Judge0

```bash
# Make sure you're in the judge0 directory
cd ~/judge0

# Start services
docker compose up -d

# Wait for services to start
sleep 30

# Check status
docker compose ps
```

All services should show "Up" or "Up (healthy)".

## Step 7: Check Logs

```bash
# Check server logs
docker compose logs server --tail 50

# Check worker logs (most important for execution)
docker compose logs worker --tail 50

# Watch logs in real-time
docker compose logs -f worker
```

**Look for:**
- ✅ "Judge0 is running" in server logs
- ✅ No "Failed to create control group" errors in worker logs
- ✅ No "Redis::CommandError" errors
- ❌ If you see cgroup errors, see troubleshooting

## Step 8: Test Judge0

```bash
# Test from EC2 instance
curl -X POST http://localhost:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(1)",
    "language_id": 71
  }' \
  --max-time 30 | jq .
```

**Expected response:**
```json
{
  "token": "some-uuid-here",
  "stdout": "1\n",
  "stderr": null,
  "status": {
    "id": 3,
    "description": "Accepted"
  }
}
```

If you get a token but no stdout immediately, wait a moment and fetch the result:

```bash
# Get the token from above response
TOKEN="your-token-here"

# Fetch result
curl http://localhost:2358/submissions/$TOKEN | jq .
```

## Step 9: Test External Access

Get your EC2 instance's public IP:

```bash
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

From YOUR local machine (not EC2), test:

```bash
# Replace with your EC2 public IP
curl -X POST http://YOUR_EC2_IP:2358/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello from outside!\")",
    "language_id": 71
  }' \
  --max-time 30
```

**If this fails:**
- Check EC2 Security Group - port 2358 must be open
- Check if Judge0 is listening: `sudo netstat -tlnp | grep 2358` on EC2
- Check firewall: `sudo ufw status`

## Step 10: Configure Railway

Go to Railway → Your Backend Service → Variables

**Set:**
```
JUDGE0_API_URL=http://YOUR_EC2_IP:2358
```

**Remove or leave blank:**
- `JUDGE0_API_KEY` (not needed for self-hosted)
- `JUDGE0_AUTH_TOKEN` (unless you enabled auth in judge0.conf)

**Important:** Use `http://` not `https://` unless you configured SSL.

Save and redeploy backend.

## Step 11: Test from Your App

1. Go to your app's Code Playground
2. Try running: `print("Hello, World!")`
3. Should work! 🎉

## Troubleshooting

### Memory cgroup still missing after reboot

```bash
# Check kernel version
uname -r

# Check if memory cgroup is available
ls /sys/fs/cgroup/ | grep memory

# Try loading cgroup module
sudo modprobe cgroup_memory

# Check grub was updated
sudo cat /boot/grub/grub.cfg | grep "cgroup_enable=memory"
```

If still missing, try:
```bash
# Add more explicit parameters
sudo nano /etc/default/grub
# Change to: GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0 cgroup_enable=memory cgroup_memory=1 swapaccount=1"
sudo update-grub
sudo reboot
```

### Status 13: Internal Error

Check worker logs:
```bash
docker compose logs worker --tail 100 | grep -i "error\|fail\|cgroup"
```

Common causes:
- Missing memory cgroup (see above)
- Isolate not working
- Permission issues

### Redis Authentication Error

```bash
# Check judge0.conf
grep REDIS_PASSWORD ~/judge0/judge0.conf

# Should be empty or commented
# REDIS_PASSWORD=

# Check docker-compose.yml
grep -A 5 "redis:" ~/judge0/docker-compose.yml | grep requirepass
# Should NOT show --requirepass

# Restart
cd ~/judge0
docker compose down
docker compose up -d
```

### Can't connect from outside

```bash
# Check if Judge0 is listening
sudo netstat -tlnp | grep 2358

# Check firewall
sudo ufw status
sudo ufw allow 2358/tcp

# Check Security Group in AWS Console
# Port 2358 should be open from 0.0.0.0/0 or specific IPs
```

### Docker permission denied

```bash
# Make sure you're in docker group
groups | grep docker

# If not, add and relogin
sudo usermod -aG docker ubuntu
newgrp docker
```

## Maintenance Commands

```bash
# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v

# Update Judge0
cd ~/judge0
git pull
docker compose pull
docker compose up -d
```

## Success Checklist

- [ ] Ubuntu 22.04 instance running
- [ ] cgroups v1 enabled (`/sys/fs/cgroup/memory/` exists)
- [ ] Docker and docker-compose installed
- [ ] Judge0 cloned and configured
- [ ] `docker compose up -d` successful
- [ ] No cgroup errors in worker logs
- [ ] Local test returns stdout
- [ ] External test from your machine works
- [ ] Railway configured with `JUDGE0_API_URL`
- [ ] Code Playground in app works!

## Next Steps

Once Judge0 is working:
1. Consider setting up a domain name and SSL (optional)
2. Set up monitoring/alerting (optional)
3. Configure backups for PostgreSQL (optional)
4. Set up auto-restart on reboot: `sudo systemctl enable docker`

