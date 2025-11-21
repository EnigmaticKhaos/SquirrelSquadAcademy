# Fix Judge0 cgroups v2 Issue on Ubuntu 24.04

## The Problem
Error: `Cannot write /sys/fs/cgroup/memory/box-1/tasks: No such file or directory`

This happens because:
- Ubuntu 24.04 uses **cgroups v2** by default
- Isolate is trying to use **cgroups v1** API paths
- The path `/sys/fs/cgroup/memory/` doesn't exist in cgroups v2

## Solutions

### Option 1: Disable cgroups in Isolate (Easiest)
Judge0 can run without cgroups, though it's less secure for resource limiting.

**Check if Judge0 has a config to disable cgroups**, or modify how isolate is called.

### Option 2: Enable cgroups v1 (Hybrid Mode)
Enable cgroups v1 alongside v2:

```bash
# Edit grub to enable cgroups v1
sudo nano /etc/default/grub

# Add or modify:
GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0"

# Update grub
sudo update-grub

# Reboot
sudo reboot
```

**Warning**: This requires a reboot and changes system cgroup behavior.

### Option 3: Use Different Isolate Version
Some versions of isolate better support cgroups v2. The version you installed (2.2.1) should support it, but might need specific configuration.

### Option 4: Check Judge0 Docker Image
The official Judge0 Docker image might have isolate pre-configured. Check if using the official image helps:

```yaml
# In docker-compose.yml, the image is already judge0/judge0:latest
# This should have isolate configured
```

### Option 5: Mount cgroups Differently
Try mounting cgroups with different options in docker-compose.yml:

```yaml
worker:
  volumes:
    - /sys/fs/cgroup:/sys/fs/cgroup:rw  # Try rw instead of ro
    # or try
    - /sys/fs/cgroup/unified:/sys/fs/cgroup:rw
```

## Quick Test: Run Without cgroups

Test if isolate works without cgroups:

```bash
docker exec judge0_worker_1 isolate --box-id=1 --run -- /bin/echo "test"
```

If this works, the issue is purely cgroups-related.

## Recommended Next Steps

1. **First, try Option 5** - modify cgroup mount in docker-compose.yml
2. **Check Judge0 documentation** for cgroups v2 support
3. **Consider using Judge0's official deployment** which might handle this automatically
4. **If nothing works, Option 2** (enable cgroups v1) is the most reliable but requires reboot

