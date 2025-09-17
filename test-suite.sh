#!/bin/bash

# LifeSync Feature Testing Suite
# Automated tests to verify all functionality works correctly

echo "🧪 LifeSync Feature Testing Suite"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
pass_test() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

fail_test() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

warn_test() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
    ((TOTAL_TESTS++))
}

info_test() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

# Test API connectivity
test_api_connectivity() {
    echo -e "\n${BLUE}Testing API Connectivity...${NC}"
    
    if curl -s http://10.247.209.223:3001/api/health > /dev/null 2>&1; then
        pass_test "API health endpoint responding"
    else
        fail_test "API health endpoint not responding"
    fi
    
    # Test main API endpoints
    for endpoint in tasks projects habits "financial/transactions" "focus/sessions" "shopping/lists" recipes "analytics/dashboard"; do
        if curl -s "http://10.247.209.223:3001/api/$endpoint" > /dev/null 2>&1; then
            pass_test "API endpoint /$endpoint responding"
        else
            fail_test "API endpoint /$endpoint not responding"
        fi
    done
    
    # Test critical Focus API endpoints (these were missing and caused 404 errors)
    echo -e "\n${BLUE}Testing Critical Focus API Endpoints...${NC}"
    for endpoint in "focus/profile" "focus/achievements" "focus/analytics"; do
        if curl -s "http://10.247.209.223:3001/api/$endpoint" > /dev/null 2>&1; then
            pass_test "Focus endpoint /$endpoint responding"
        else
            fail_test "Focus endpoint /$endpoint responding - CRITICAL: Frontend expects this!"
        fi
    done
}

# Test frontend accessibility
test_frontend_accessibility() {
    echo -e "\n${BLUE}Testing Frontend Accessibility...${NC}"
    
    if curl -s -I http://10.247.209.223:5173 > /dev/null 2>&1; then
        pass_test "Frontend server responding"
    else
        fail_test "Frontend server not responding"
        return
    fi
    
    # Check if main JavaScript bundle loads
    if curl -s http://10.247.209.223:5173 | grep -q "vite"; then
        pass_test "Vite development server detected"
    else
        warn_test "Could not detect Vite dev server"
    fi
}

# Test database connectivity
test_database_connectivity() {
    echo -e "\n${BLUE}Testing Database Connectivity...${NC}"
    
    if docker exec lifesync-postgres psql -U postgres -d lifesync -c "SELECT NOW();" > /dev/null 2>&1; then
        pass_test "PostgreSQL database responding"
    else
        fail_test "PostgreSQL database not responding"
        return
    fi
    
    # Test main tables exist
    for table in tasks projects habits financial_transactions focus_sessions shopping_lists recipes; do
        if docker exec lifesync-postgres psql -U postgres -d lifesync -c "SELECT COUNT(*) FROM $table;" > /dev/null 2>&1; then
            pass_test "Database table '$table' exists and accessible"
        else
            fail_test "Database table '$table' missing or inaccessible"
        fi
    done
}

# Test environment configuration
test_environment_config() {
    echo -e "\n${BLUE}Testing Environment Configuration...${NC}"
    
    # Check for environment files
    if [ -f ".env" ]; then
        pass_test ".env file exists"
    else
        fail_test ".env file missing"
    fi
    
    # Check for API URL configuration
    if grep -q "VITE_API_BASE_URL.*10.247.209.223:3001" .env* 2>/dev/null; then
        pass_test "API URL correctly configured for external access"
    else
        if grep -q "VITE_API_BASE_URL.*localhost:3001" .env* 2>/dev/null; then
            fail_test "API URL still using localhost (should use 10.247.209.223)"
        else
            fail_test "API URL configuration not found"
        fi
    fi
    
    # Check for .env.local override issues
    if [ -f ".env.local" ]; then
        warn_test ".env.local exists (may override .env settings)"
        if grep -q "localhost:3001" .env.local 2>/dev/null; then
            fail_test ".env.local contains localhost URLs (overrides .env)"
        fi
    fi
}

# Test process status
test_process_status() {
    echo -e "\n${BLUE}Testing Process Status...${NC}"
    
    VITE_PROCESSES=$(pgrep -f vite | wc -l)
    if [ "$VITE_PROCESSES" -gt 0 ]; then
        pass_test "Vite development server running ($VITE_PROCESSES processes)"
    else
        fail_test "Vite development server not running"
    fi
    
    API_PROCESSES=$(pgrep -f "node.*3001" | wc -l)
    if [ "$API_PROCESSES" -gt 0 ]; then
        pass_test "API server running ($API_PROCESSES processes)"
    else
        fail_test "API server not running"
    fi
    
    DOCKER_POSTGRES=$(docker ps | grep postgres | wc -l)
    if [ "$DOCKER_POSTGRES" -gt 0 ]; then
        pass_test "PostgreSQL Docker container running"
    else
        fail_test "PostgreSQL Docker container not running"
    fi
}

# Test critical file structure
test_file_structure() {
    echo -e "\n${BLUE}Testing File Structure...${NC}"
    
    # Critical files
    critical_files=(
        "src/App.tsx"
        "src/components/Layout.tsx"
        "src/pages/TodosWorkingFollowUp.tsx"
        "src/pages/Habits.tsx"
        "src/pages/Dashboard.tsx"
        "src/services/api.ts"
        "src/services/apiClient.ts"
        "vite.config.ts"
        "package.json"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            pass_test "Critical file '$file' exists"
        else
            fail_test "Critical file '$file' missing"
        fi
    done
}

# Test drag and drop dependencies
test_dnd_dependencies() {
    echo -e "\n${BLUE}Testing Drag & Drop Dependencies...${NC}"
    
    if npm list @dnd-kit/core > /dev/null 2>&1; then
        pass_test "@dnd-kit/core installed"
    else
        fail_test "@dnd-kit/core not installed"
    fi
    
    if npm list @dnd-kit/sortable > /dev/null 2>&1; then
        pass_test "@dnd-kit/sortable installed"
    else
        fail_test "@dnd-kit/sortable not installed"
    fi
    
    if npm list @dnd-kit/utilities > /dev/null 2>&1; then
        pass_test "@dnd-kit/utilities installed"
    else
        fail_test "@dnd-kit/utilities not installed"
    fi
}

# Test TypeScript compilation
test_typescript_compilation() {
    echo -e "\n${BLUE}Testing TypeScript Compilation...${NC}"
    
    if command -v tsc > /dev/null 2>&1; then
        if npx tsc --noEmit > /dev/null 2>&1; then
            pass_test "TypeScript compilation successful"
        else
            fail_test "TypeScript compilation errors found"
        fi
    else
        warn_test "TypeScript compiler not available for testing"
    fi
}

# Main test execution
main() {
    echo "Starting comprehensive feature testing..."
    echo "Target: http://10.247.209.223:5173"
    echo ""
    
    test_environment_config
    test_process_status
    test_file_structure
    test_api_connectivity
    test_frontend_accessibility
    test_database_connectivity
    test_dnd_dependencies
    test_typescript_compilation
    
    # Summary
    echo -e "\n${BLUE}Test Summary${NC}"
    echo "============"
    echo -e "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All tests passed! LifeSync is ready to use.${NC}"
        exit 0
    else
        echo -e "\n${RED}⚠️  Some tests failed. Check the output above for issues.${NC}"
        echo -e "${YELLOW}💡 Try running ./fix-api-connection.sh to resolve common issues.${NC}"
        exit 1
    fi
}

# Run the tests
main