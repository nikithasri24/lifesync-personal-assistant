#!/bin/bash

echo "🏠 Starting LifeSync for Local Development"

# Use local configuration
cp .env.local .env

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Wait for cleanup
sleep 2

# Start API (TS server) in background
echo "🔧 Starting API Server (TS)..."
npm run api:start &
API_PID=$!

# Wait for API to start
echo "⏳ Waiting for API to start..."
sleep 10

# Test API
echo "🔍 Testing API connectivity..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ API is responding on http://localhost:3001"
else
    echo "❌ API failed to start"
    exit 1
fi

# Start frontend
echo "🎨 Starting Frontend for local development..."
echo "🌐 Frontend will be available at: http://localhost:5173"
echo "📡 API is available at: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start the frontend (this will block)
npm run dev

# If we get here, frontend was stopped, so stop API too
echo "🛑 Stopping all services..."
kill $API_PID 2>/dev/null || true
