#!/bin/bash

echo "🌐 Starting LifeSync for External IP Access (10.247.209.223)"

# Use external configuration
cp .env.external .env

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

# Test API connectivity
echo "🔍 Testing API connectivity..."
echo "  - Testing localhost..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "    ✅ Localhost: OK"
else
    echo "    ❌ Localhost: Failed"
fi

echo "  - Testing external IP..."
if curl -s http://10.247.209.223:3001/api/health --max-time 5 > /dev/null; then
    echo "    ✅ External IP: OK"
    EXTERNAL_OK=true
else
    echo "    ⚠️  External IP: Not accessible (may work from other machines)"
    EXTERNAL_OK=false
fi

# Start frontend
echo "🎨 Starting Frontend on external IP..."
if [ "$EXTERNAL_OK" = true ]; then
    echo "🌐 Frontend will be available at: http://10.247.209.223:5173"
    echo "📡 API is available at: http://10.247.209.223:3001"
else
    echo "🏠 Frontend fallback: http://localhost:5173"
    echo "📡 API fallback: http://localhost:3001"
fi
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start the frontend on all interfaces (this will block)
npm run dev:external

# If we get here, frontend was stopped, so stop API too
echo "🛑 Stopping all services..."
kill $API_PID 2>/dev/null || true
