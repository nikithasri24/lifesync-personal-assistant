#!/bin/bash
# Find specific code quality issues

set -e

ISSUE_TYPE=${1:-all}

case $ISSUE_TYPE in
  any)
    echo "🔍 Finding 'any' type usage..."
    echo "════════════════════════════"
    echo ""
    echo "Type annotations with 'any':"
    grep -rn ": any" src --include="*.ts" --include="*.tsx" | grep -v node_modules | head -20
    echo ""
    echo "Type casts to 'any':"
    grep -rn "as any" src --include="*.ts" --include="*.tsx" | grep -v node_modules | head -20
    ;;

  console)
    echo "🔍 Finding console.* usage..."
    echo "═══════════════════════════"
    echo ""
    grep -rn "console\." src --include="*.ts" --include="*.tsx" | grep -v node_modules | head -30
    ;;

  aria)
    echo "🔍 Finding buttons without ARIA labels..."
    echo "════════════════════════════════════════"
    echo ""
    grep -rn "<button" src --include="*.tsx" | grep -v "aria-label" | grep -v "aria-labelledby" | head -20
    ;;

  keys)
    echo "🔍 Finding potential missing keys in lists..."
    echo "═══════════════════════════════════════════"
    echo ""
    grep -rn "\.map(" src --include="*.tsx" | grep -v "key=" | head -20
    ;;

  large)
    echo "🔍 Finding large files (>400 lines)..."
    echo "════════════════════════════════════"
    echo ""
    find src -name "*.tsx" -exec wc -l {} \; | awk '$1 > 400 {print $1 " lines: " $2}' | sort -rn
    ;;

  memo)
    echo "🔍 Finding components without React.memo..."
    echo "═══════════════════════════════════════════"
    echo ""
    echo "Components that might benefit from React.memo:"
    grep -rn "^export.*function\|^export.*const.*=" src/components src/finance src/shopping src/todos src/mealPlanning --include="*.tsx" | grep -v "React.memo" | head -20
    ;;

  duplicates)
    echo "🔍 Finding duplicate implementations..."
    echo "══════════════════════════════════════"
    echo ""
    echo "OwnerBadge implementations:"
    find src -name "OwnerBadge.tsx"
    echo ""
    echo "OwnerFilter implementations:"
    find src -name "OwnerFilter.tsx"
    echo ""
    echo "Owner utility functions:"
    find src -name "*owner*.ts" -o -name "*Owner*.ts"
    ;;

  all)
    echo "🔍 Complete Issue Scan"
    echo "══════════════════════"
    echo ""

    echo "1. 'any' types found: $(grep -r ": any" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)"
    echo "2. console.* calls: $(grep -r "console\." src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)"
    echo "3. Buttons without ARIA: $(grep -r "<button" src --include="*.tsx" 2>/dev/null | grep -v "aria-label" | grep -v "aria-labelledby" | wc -l | xargs)"
    echo "4. Potential missing keys: $(grep -r "\.map(" src --include="*.tsx" 2>/dev/null | grep -v "key=" | wc -l | xargs)"
    echo "5. Large files (>400 lines): $(find src -name "*.tsx" -exec wc -l {} \; 2>/dev/null | awk '$1 > 400' | wc -l | xargs)"
    echo "6. OwnerBadge duplicates: $(find src -name "OwnerBadge.tsx" 2>/dev/null | wc -l | xargs)"
    echo ""
    echo "Run with specific type to see details:"
    echo "  ./scripts/find-issues.sh any        - Find 'any' types"
    echo "  ./scripts/find-issues.sh console    - Find console usage"
    echo "  ./scripts/find-issues.sh aria       - Find missing ARIA labels"
    echo "  ./scripts/find-issues.sh keys       - Find missing keys"
    echo "  ./scripts/find-issues.sh large      - Find large files"
    echo "  ./scripts/find-issues.sh memo       - Find components without memo"
    echo "  ./scripts/find-issues.sh duplicates - Find duplicate code"
    ;;

  *)
    echo "❌ Unknown issue type: $ISSUE_TYPE"
    echo ""
    echo "Usage: ./scripts/find-issues.sh [type]"
    echo ""
    echo "Available types:"
    echo "  any        - Find 'any' types"
    echo "  console    - Find console usage"
    echo "  aria       - Find missing ARIA labels"
    echo "  keys       - Find missing keys"
    echo "  large      - Find large files"
    echo "  memo       - Find components without React.memo"
    echo "  duplicates - Find duplicate code"
    echo "  all        - Show summary (default)"
    exit 1
    ;;
esac

echo ""
echo "───────────────────────────────────────"
echo "💡 See TECHNICAL_DEBT_ELIMINATION_PLAN.md for fixes"
