# Fix Judge0 Status 13 (Internal Error)

## The Problem
Judge0 is returning **Status 13: Internal Error** for all code submissions. This indicates an issue with the Judge0 instance itself, not the connection.

## Common Causes

### 1. Judge0 Workers Not Running
The worker containers might not be running or might be crashing.

**Check on EC2:**
```bash
docker ps
# Should show judge0_worker_1 running

# Check worker logs
docker logs judge0_worker_1 --tail 100
```

### 2. Isolate (Sandbox) Not Installed
Judge0 requires `isolate` to be installed on the host system for sandboxing.

**Check on EC2:**
```bash
# Check if isolate is installed
which isolate
isolate --version

# If not installed, install it:
sudo apt-get update
sudo apt-get install -y isolate
```

### 3. Isolate Not Configured Properly
Isolate needs proper permissions and configuration.

**Fix on EC2:**
```bash
# Check isolate configuration
sudo isolate --check

# If there are permission issues:
sudo chmod 4755 /usr/bin/isolate
sudo mkdir -p /var/lib/isolate
sudo chown root:root /var/lib/isolate
```

### 4. Judge0 Worker Can't Access Isolate
The worker container needs access to the host's isolate binary.

**Check docker-compose.yml:**
```yaml
worker:
  volumes:
    - /usr/bin/isolate:/usr/bin/isolate:ro
    - /var/lib/isolate:/var/lib/isolate
```

### 5. Check Judge0 Worker Logs
The most important step - check what the worker is actually saying:

```bash
# On EC2
docker logs judge0_worker_1 --tail 200
docker logs judge0_server_1 --tail 200 | grep -i error
```

## Quick Diagnostic Steps

Run these on your EC2 instance:

```bash
# 1. Check all containers are running
docker ps

# 2. Check worker logs for errors
docker logs judge0_worker_1 --tail 100

# 3. Check if isolate is installed
isolate --version

# 4. Check isolate can run
sudo isolate --init --box-id=1

# 5. Check Judge0 system info (if available)
curl http://localhost:2358/system_info
```

## Most Likely Fix

The issue is usually that **isolate is not installed** or **not accessible** to the worker container.

**Install isolate:**
```bash
sudo apt-get update
sudo apt-get install -y isolate
```

**Verify docker-compose.yml has proper volume mounts for isolate:**
```yaml
worker:
  volumes:
    - /usr/bin/isolate:/usr/bin/isolate:ro
    - /var/lib/isolate:/var/lib/isolate
```

**Restart Judge0:**
```bash
cd ~/judge0
docker-compose down
docker-compose up -d
```

## Check Worker Logs First

The worker logs will tell you exactly what's wrong. Share the output of:
```bash
docker logs judge0_worker_1 --tail 100
```

This will show the actual error causing Status 13.

