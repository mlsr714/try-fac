#!/bin/bash
set -e

# Install Node.js 22 if not available
if ! command -v node &> /dev/null; then
  echo "Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

cd /root/try-fac/try-fac

# Install dependencies if node_modules doesn't exist or package.json changed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Ensure .env.local exists with placeholder structure
# Actual credentials are pre-configured on this machine
if [ ! -f ".env.local" ]; then
  echo "ERROR: .env.local not found. Please create it with the required credentials."
  echo "Required variables: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, DATABASE_URL, AI_GATEWAY_API_KEY"
  echo "See .factory/library/environment.md for details."
  exit 1
fi

echo "Init complete."
