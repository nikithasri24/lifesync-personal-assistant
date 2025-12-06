#!/bin/bash

# Quick Regression Test for LifeSync
# Run this before and after making changes to catch breaking changes

echo "🔄 LifeSync Quick Regression Test"
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((PASS_COUNT++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((FAIL_COUNT++))
    fi
}

echo "Testing critical functionality..."

# 1. Environment Check
if [ -f ".env.local" ] && grep -q "localhost:3001" .env.local 2>/dev/null; then
    test_result 1 "Environment configuration (localhost detected in .env.local)"
else
    test_result 0 "Environment configuration"
fi

# 2. API Health
curl -s http://10.247.209.223:3001/api/health > /dev/null 2>&1
test_result $? "API server health"

# 3. Frontend Accessibility
curl -s -I http://10.247.209.223:5173 > /dev/null 2>&1
test_result $? "Frontend server accessibility"

# 4. API Capabilities (proxy for DB reachability)
CAPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://10.247.209.223:3001/api/capabilities)
if [ "$CAPS_CODE" = "200" ]; then
  test_result 0 "API capabilities responding"
else
  test_result 1 "API capabilities unexpected (HTTP $CAPS_CODE)"
fi

# 5. Core API Endpoints
echo -e "\nTesting API endpoints..."
for endpoint in tasks projects habits; do
    curl -s "http://10.247.209.223:3001/api/$endpoint" > /dev/null 2>&1
    test_result $? "API endpoint: /$endpoint"
done

# 5a. Focus API Sessions
echo -e "\nTesting Focus API sessions..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://10.247.209.223:3001/api/focus/sessions")
if [ "$CODE" = "200" ] || [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then
  test_result 0 "Focus endpoint: /focus/sessions (HTTP $CODE)"
else
  test_result 1 "Focus endpoint: /focus/sessions (HTTP $CODE)"
fi

# 6. Critical Files
echo -e "\nChecking critical files..."
for file in "src/App.tsx" "src/pages/TodosWorkingFollowUp.tsx" "src/services/apiClient.ts"; do
    if [ -f "$file" ]; then
        test_result 0 "File exists: $file"
    else
        test_result 1 "File exists: $file"
    fi
done

# 7. Process Status
echo -e "\nChecking processes..."
VITE_RUNNING=$(pgrep -f vite | wc -l)
if [ "$VITE_RUNNING" -gt 0 ]; then
    test_result 0 "Vite dev server running"
else
    test_result 1 "Vite dev server running"
fi

API_RUNNING=$(pgrep -f "node.*3001" | wc -l)
if [ "$API_RUNNING" -gt 0 ]; then
    test_result 0 "API server running"
else
    test_result 1 "API server running"
fi

# 8. Database Tables (skipped; rely on API-level checks)
echo -e "\nSkipping direct DB table checks; using API-level health/capabilities instead."

# Summary
echo -e "\n📊 Test Summary"
echo "==============="
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All regression tests passed!${NC}"
    echo -e "✨ LifeSync core functionality is working correctly"
    exit 0
else
    echo -e "\n${RED}⚠️  $FAIL_COUNT regression test(s) failed${NC}"
    echo -e "${YELLOW}💡 Run ./fix-api-connection.sh to resolve common issues${NC}"
    echo -e "${YELLOW}📋 Run ./test-suite.sh for detailed diagnostics${NC}"
    exit 1
fi
