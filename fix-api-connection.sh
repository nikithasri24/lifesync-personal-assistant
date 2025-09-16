#!/bin/bash

# Quick fix script for API connection issues
# This addresses the most common problem: .env.local overriding .env

echo "🔧 LifeSync API Connection Fix"

# Check if .env.local exists and has localhost
if [ -f ".env.local" ] && grep -q "localhost:3001" .env.local; then
  echo "❌ Found localhost:3001 in .env.local (this overrides .env)"
  echo "🔄 Fixing .env.local..."
  
  # Backup original
  cp .env.local .env.local.backup
  
  # Replace localhost with external IP
  sed -i 's/localhost:3001/10.247.209.223:3001/g' .env.local
  
  echo "✅ Updated .env.local"
  echo "📄 Backup saved as .env.local.backup"
fi

# Also fix .env just in case
if [ -f ".env" ] && grep -q "localhost:3001" .env; then
  echo "🔄 Also fixing .env..."
  sed -i 's/localhost:3001/10.247.209.223:3001/g' .env
  echo "✅ Updated .env"
fi

# Kill existing dev server
echo "🔄 Restarting development server..."
pkill -f "vite" 2>/dev/null

# Wait a moment
sleep 2

# Start new dev server in background
nohup npm run dev > dev-server.log 2>&1 &
DEV_PID=$!

# Wait for server to start
echo "⏳ Waiting for dev server to start..."
sleep 5

# Check if it's working
if curl -s -I http://10.247.209.223:5173 > /dev/null 2>&1; then
  echo "✅ Frontend server is running"
else
  echo "❌ Frontend server failed to start"
  echo "📄 Check dev-server.log for details"
fi

if curl -s http://10.247.209.223:3001/api/health > /dev/null 2>&1; then
  echo "✅ API server is responding"
else
  echo "❌ API server not responding"
  echo "💡 You may need to start the API server manually"
fi

echo ""
echo "🌐 Try accessing: http://10.247.209.223:5173"
echo "📊 Health check: ./health-check.sh"