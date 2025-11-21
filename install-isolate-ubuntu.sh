#!/bin/bash
# Install isolate on Ubuntu for Judge0

set -e

echo "Installing dependencies for isolate..."
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  git \
  libcap-dev \
  pkg-config

echo "Cloning isolate repository..."
cd /tmp
if [ -d "isolate" ]; then
  rm -rf isolate
fi
git clone https://github.com/ioi/isolate.git
cd isolate

echo "Building isolate..."
make

echo "Installing isolate..."
sudo make install

echo "Setting up isolate..."
sudo mkdir -p /var/lib/isolate
sudo chown root:root /var/lib/isolate
sudo chmod 4755 /usr/local/bin/isolate

echo "Testing isolate installation..."
/usr/local/bin/isolate --version || /usr/bin/isolate --version

echo "Initializing isolate box 1..."
sudo /usr/local/bin/isolate --init --box-id=1 || sudo /usr/bin/isolate --init --box-id=1

echo "Isolate installation complete!"
echo "Location: $(which isolate)"
echo "Version: $(isolate --version 2>/dev/null || echo 'Check manually')"

