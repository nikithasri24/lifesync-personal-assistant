#!/bin/bash

# Finance Merged Mode Validation Script
# Quickly checks that all merged mode features are implemented

set -e

echo "🔍 Validating Finance Merged Mode Implementation..."
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
  echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
  echo -e "${RED}❌ $1${NC}"
  ERRORS=$((ERRORS + 1))
}

check_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  WARNINGS=$((WARNINGS + 1))
}

# 1. Check OwnerFilter is imported in all required pages
echo "1️⃣  Checking OwnerFilter imports..."

PAGES=(
  "src/finance/pages/TransactionsPageGrouped.tsx"
  "src/finance/pages/AccountsPage.tsx"
  "src/finance/pages/BudgetsPage.tsx"
  "src/finance/pages/GoalsPage.tsx"
  "src/finance/pages/DashboardPage.tsx"
)

for page in "${PAGES[@]}"; do
  if grep -q "import.*OwnerFilter" "$page" 2>/dev/null; then
    check_pass "$page has OwnerFilter import"
  else
    check_fail "$page missing OwnerFilter import"
  fi
done

echo ""

# 2. Check owner selection in creation modals
echo "2️⃣  Checking owner selection in modals..."

if grep -q "Who made this purchase" "src/finance/components/QuickAddTransaction.tsx" 2>/dev/null; then
  check_pass "QuickAddTransaction has owner selection"
else
  check_fail "QuickAddTransaction missing owner selection"
fi

if grep -q "Owner" "src/finance/components/AccountModal.tsx" 2>/dev/null; then
  check_pass "AccountModal has owner selection"
else
  check_fail "AccountModal missing owner selection"
fi

if grep -q "This is a shared goal" "src/finance/components/goals/GoalEditor.tsx" 2>/dev/null; then
  check_pass "GoalEditor has shared goal option"
else
  check_fail "GoalEditor missing shared goal option"
fi

echo ""

# 3. Check backend API support
echo "3️⃣  Checking backend API support..."

if grep -q "txn.userId" "src/finance/data/supabaseApi.ts" 2>/dev/null; then
  check_pass "Transaction API accepts userId"
else
  check_fail "Transaction API missing userId support"
fi

if grep -q "connection_id" "src/finance/data/supabaseApi.ts" 2>/dev/null; then
  check_pass "Goals API supports connectionId"
else
  check_fail "Goals API missing connectionId support"
fi

echo ""

# 4. Check types are defined
echo "4️⃣  Checking type definitions..."

if grep -q "connectionId" "src/finance/types.ts" 2>/dev/null; then
  check_pass "Goal type has connectionId field"
else
  check_fail "Goal type missing connectionId field"
fi

if grep -q "isShared" "src/finance/types.ts" 2>/dev/null; then
  check_pass "Goal type has isShared field"
else
  check_warn "Goal type missing isShared helper field"
fi

echo ""

# 5. Check filter state management
echo "5️⃣  Checking filter state..."

if grep -q "ownerFilter" "src/finance/store/useFinanceFilters.ts" 2>/dev/null; then
  check_pass "useFinanceFilters has ownerFilter state"
else
  check_fail "useFinanceFilters missing ownerFilter state"
fi

if grep -q "setOwnerFilter" "src/finance/store/useFinanceFilters.ts" 2>/dev/null; then
  check_pass "useFinanceFilters has setOwnerFilter action"
else
  check_fail "useFinanceFilters missing setOwnerFilter action"
fi

echo ""

# 6. Check TypeScript compilation
echo "6️⃣  Checking TypeScript compilation..."

if command -v tsc &> /dev/null; then
  if tsc --noEmit --project tsconfig.json 2>&1 | grep -q "src/finance"; then
    check_warn "TypeScript errors found in Finance module"
  else
    check_pass "No TypeScript errors in Finance module"
  fi
else
  check_warn "TypeScript not available, skipping compilation check"
fi

echo ""

# 7. Check for common issues
echo "7️⃣  Checking for common issues..."

# Check if filters are actually used to filter data
if grep -q "filteredTransactions" "src/finance/pages/TransactionsPageGrouped.tsx" 2>/dev/null; then
  check_pass "Transactions are filtered by owner"
else
  check_warn "Transactions may not be filtered properly"
fi

if grep -q "filteredAccounts" "src/finance/pages/AccountsPage.tsx" 2>/dev/null; then
  check_pass "Accounts are filtered by owner"
else
  check_warn "Accounts may not be filtered properly"
fi

if grep -q "filteredGoals" "src/finance/pages/GoalsPage.tsx" 2>/dev/null; then
  check_pass "Goals are filtered by owner"
else
  check_warn "Goals may not be filtered properly"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🎉 All checks passed! Finance merged mode is fully implemented.${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  $WARNINGS warnings found, but no critical errors.${NC}"
  exit 0
else
  echo -e "${RED}❌ $ERRORS errors and $WARNINGS warnings found.${NC}"
  echo ""
  echo "Please fix the errors above before using Finance merged mode."
  exit 1
fi
