#!/bin/bash

echo "🎯 Starting LifeSync API with monitoring..."

# Kill any existing processes on port 3001
echo "🧹 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Wait a moment for cleanup
sleep 2

# Start the API monitor which will handle starting and restarting the API
echo "🚀 Starting API Monitor..."
cd "$(dirname "$0")"
node api-monitor.js

echo "✅ API Monitor stopped"