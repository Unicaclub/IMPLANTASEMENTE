#!/bin/bash
# Copalite Visual Audit — Runner Script
# Usage: bash rodar-auditoria.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Copalite Visual Audit ==="
echo ""

# Check if playwright is installed
if ! node -e "require('playwright')" 2>/dev/null; then
  echo "Installing Playwright..."
  npm install playwright --no-save
  npx playwright install chromium
fi

# Check backend
echo "Checking backend..."
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/docs | grep -q "200"; then
  echo "ERROR: Backend not running on port 3000"
  echo "Start it with: cd copalite-backend && npm run start:dev"
  exit 1
fi
echo "Backend: OK"

# Check frontend
echo "Checking frontend..."
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -qE "200|307"; then
  echo "ERROR: Frontend not running on port 3001"
  echo "Start it with: cd copalite-frontend && npm run dev"
  exit 1
fi
echo "Frontend: OK"

echo ""
echo "Running audit..."
node copalite-audit.js

echo ""
echo "Done. Check the report for results."
