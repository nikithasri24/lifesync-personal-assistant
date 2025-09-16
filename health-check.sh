#!/bin/bash

# LifeSync Health Check Script
# Run this when you encounter API connection issues

echo "=== LifeSync Health Check ==="

echo "1. Environment Files:"
find . -name ".env*" -type f | while read file; do
  echo "  $file:"
  grep "API_BASE_URL" "$file" 2>/dev/null || echo "    No API_BASE_URL found"
done

echo -e "\n2. API Server:"
if curl -s http://10.247.209.223:3001/api/health > /dev/null 2>&1; then
  echo "  ✅ API server responding"
else
  echo "  ❌ API server not responding"
fi

echo -e "\n3. Frontend Server:"
if curl -s -I http://10.247.209.223:5173 > /dev/null 2>&1; then
  echo "  ✅ Frontend server responding"
else
  echo "  ❌ Frontend server not responding"
fi

echo -e "\n4. Database:"
if docker exec lifesync-postgres psql -U postgres -d lifesync -c "SELECT NOW();" > /dev/null 2>&1; then
  echo "  ✅ Database responding"
else
  echo "  ❌ Database not responding"
fi

echo -e "\n5. Processes:"
VITE_COUNT=$(pgrep -f vite | wc -l)
NODE_COUNT=$(pgrep -f "node.*3001" | wc -l)
echo "  Vite processes: $VITE_COUNT"
echo "  API processes: $NODE_COUNT"

echo -e "\n6. Environment Variable Priority Check:"
if [ -f ".env.local" ]; then
  echo "  ⚠️  .env.local exists (overrides .env)"
  echo "     API URL: $(grep VITE_API_BASE_URL .env.local 2>/dev/null || echo 'Not found')"
else
  echo "  ✅ No .env.local (using .env)"
  echo "     API URL: $(grep VITE_API_BASE_URL .env 2>/dev/null || echo 'Not found')"
fi

echo -e "\n=== Summary ==="
if curl -s http://10.247.209.223:3001/api/health > /dev/null 2>&1 && curl -s -I http://10.247.209.223:5173 > /dev/null 2>&1; then
  echo "✅ System appears healthy"
else
  echo "❌ Issues detected - check above for details"
  echo "💡 Quick fix: Check .env.local file and restart dev server"
fi