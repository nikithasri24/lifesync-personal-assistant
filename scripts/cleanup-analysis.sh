#!/bin/bash

# LifeSync Cleanup Analysis Script
# Generates reports on code quality issues

set -e

echo "🔍 LifeSync Code Quality Analysis"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Count 'any' type violations
echo "📊 Analyzing 'any' type usage..."
ANY_COUNT=$(grep -r ": any\|<any>\|as any" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo -e "${RED}Found $ANY_COUNT 'any' type violations${NC}"
echo ""

# Top files with 'any' violations
echo "Top 10 files with 'any' violations:"
grep -r ": any\|<any>\|as any" src --include="*.ts" --include="*.tsx" 2>/dev/null | \
  cut -d: -f1 | sort | uniq -c | sort -rn | head -10 | \
  awk '{printf "  %3d violations: %s\n", $1, $2}'
echo ""

# 2. Count console.log usage
echo "📊 Analyzing console usage..."
CONSOLE_COUNT=$(grep -r "console\." src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo -e "${RED}Found $CONSOLE_COUNT console.* statements${NC}"
echo ""

# 3. Count eslint-disable comments
echo "📊 Analyzing eslint-disable comments..."
DISABLE_COUNT=$(grep -r "eslint-disable" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo -e "${RED}Found $DISABLE_COUNT eslint-disable comments${NC}"
echo ""

# List files with eslint-disable
if [ $DISABLE_COUNT -gt 0 ]; then
  echo "Files with eslint-disable:"
  grep -r "eslint-disable" src --include="*.ts" --include="*.tsx" 2>/dev/null | \
    cut -d: -f1 | sort | uniq | \
    awk '{printf "  - %s\n", $1}'
  echo ""
fi

# 4. Find files over 400 lines
echo "📊 Analyzing file sizes..."
echo "Files over 400 lines:"
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  lines=$(wc -l < "$file" | tr -d ' ')
  if [ $lines -gt 400 ]; then
    printf "  ${RED}%4d lines${NC}: %s\n" $lines $file
  fi
done
echo ""

# 5. Count services bypassing API layer
echo "📊 Analyzing services using Supabase directly..."
echo "Services importing supabase:"
grep -r "from '@/lib/supabase'" src/services --include="*.ts" 2>/dev/null | \
  cut -d: -f1 | sort | uniq | \
  awk '{printf "  - %s\n", $1}'
echo ""

# 6. Analyze Zustand stores
echo "📊 Analyzing Zustand stores..."
echo "Zustand slices:"
find src/stores/slices -name "*.ts" 2>/dev/null | while read file; do
  echo "  - $(basename $file)"
done
echo ""

# 7. Check for missing error boundaries
echo "📊 Checking error boundary coverage..."
ROUTES_COUNT=$(grep -c "case '" src/App.tsx 2>/dev/null || echo "0")
ERROR_BOUNDARY_COUNT=$(grep -c "ErrorBoundary" src/App.tsx 2>/dev/null || echo "0")
echo "Routes: $ROUTES_COUNT"
echo "Error boundaries: $ERROR_BOUNDARY_COUNT"
if [ $ERROR_BOUNDARY_COUNT -lt $ROUTES_COUNT ]; then
  echo -e "${YELLOW}⚠️  Not all routes have error boundaries${NC}"
fi
echo ""

# 8. Summary
echo "=================================="
echo "📋 Summary"
echo "=================================="
echo -e "${RED}❌ $ANY_COUNT 'any' type violations${NC}"
echo -e "${RED}❌ $CONSOLE_COUNT console.* statements${NC}"
echo -e "${RED}❌ $DISABLE_COUNT eslint-disable comments${NC}"
echo ""

# Calculate score
TOTAL_ISSUES=$((ANY_COUNT + CONSOLE_COUNT + DISABLE_COUNT))
if [ $TOTAL_ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ Code quality: EXCELLENT${NC}"
elif [ $TOTAL_ISSUES -lt 100 ]; then
  echo -e "${YELLOW}⚠️  Code quality: GOOD (minor issues)${NC}"
elif [ $TOTAL_ISSUES -lt 500 ]; then
  echo -e "${YELLOW}⚠️  Code quality: FAIR (needs work)${NC}"
else
  echo -e "${RED}❌ Code quality: POOR (major cleanup needed)${NC}"
fi
echo ""

echo "💡 Next steps:"
echo "  1. Review CLEANUP_ROADMAP.md"
echo "  2. Start with Phase 1 quick wins"
echo "  3. Run 'npm run lint' to see all issues"
echo "  4. Fix highest-impact files first"
echo ""

