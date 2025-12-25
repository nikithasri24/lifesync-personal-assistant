#!/bin/bash

# Restart Development Server
# Cleanly stops all dev processes and restarts them

echo "🛑 Stopping all development processes..."

# Kill Vite dev server (port 5173)
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "  ✓ Killed Vite (port 5173)" || echo "  ℹ No process on port 5173"

# Kill API server (port 3001)
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "  ✓ Killed API server (port 3001)" || echo "  ℹ No process on port 3001"

# Wait a moment for ports to be released
sleep 1

echo ""
echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite 2>/dev/null && echo "  ✓ Cleared Vite cache" || echo "  ℹ No cache to clear"

echo ""
echo "🚀 Starting development server..."
echo ""

# Start Vite dev server
npm run dev

