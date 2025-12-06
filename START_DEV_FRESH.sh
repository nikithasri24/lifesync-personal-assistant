#!/bin/bash
# Start development server with fresh cache
# This ensures all changes are picked up

echo "🧹 Cleaning Vite cache..."
rm -rf node_modules/.vite

echo "🔪 Killing any existing dev servers..."
pkill -9 -f "npm run dev" 2>/dev/null || true
pkill -9 -f "vite" 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true

echo "⏳ Waiting for ports to free up..."
sleep 2

echo "🚀 Starting dev server..."
npm run dev
