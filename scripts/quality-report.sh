#!/bin/bash
# Quality Report Generator
# Generates metrics for technical debt tracking

set -e

echo "📊 LifeSync Quality Report"
echo "=========================="
echo "Generated: $(date)"
echo ""

# Codebase Size
echo "📁 Codebase Size:"
echo "───────────────────"
TS_FILES=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | xargs)
TOTAL_LINES=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
echo "   TypeScript files: $TS_FILES"
echo "   Total lines: $TOTAL_LINES"
echo ""

# Code Quality Issues
echo "⚠️  Code Quality Issues:"
echo "───────────────────────"

ANY_TYPES=$(grep -r ": any" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)
echo "   'any' types: $ANY_TYPES"

CONSOLE_CALLS=$(grep -r "console\." src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)
echo "   console.* calls: $CONSOLE_CALLS"

MISSING_KEYS=$(grep -r "\.map(" src --include="*.tsx" 2>/dev/null | grep -v "key=" | wc -l | xargs)
echo "   Potential missing keys: $MISSING_KEYS"

LARGE_FILES=$(find src -name "*.tsx" -exec wc -l {} \; 2>/dev/null | awk '$1 > 400' | wc -l | xargs)
echo "   Large files (>400 lines): $LARGE_FILES"

echo ""

# Component Issues
echo "🔍 Component Analysis:"
echo "─────────────────────"

COMPONENTS_WITHOUT_MEMO=$(grep -r "^export.*function\|^export.*const.*=" src/components src/finance src/shopping src/todos src/mealPlanning --include="*.tsx" 2>/dev/null | grep -v "React.memo" | wc -l | xargs)
echo "   Components without React.memo: $COMPONENTS_WITHOUT_MEMO"

MISSING_DISPLAY_NAME=$(grep -r "React.memo" src --include="*.tsx" 2>/dev/null | wc -l | xargs)
ACTUAL_DISPLAY_NAME=$(grep -r "displayName" src --include="*.tsx" 2>/dev/null | wc -l | xargs)
echo "   Memoized components: $MISSING_DISPLAY_NAME"
echo "   With displayName: $ACTUAL_DISPLAY_NAME"

echo ""

# Accessibility
echo "♿ Accessibility:"
echo "────────────────"

BUTTONS_TOTAL=$(grep -r "<button" src --include="*.tsx" 2>/dev/null | wc -l | xargs)
BUTTONS_WITH_ARIA=$(grep -r "<button" src --include="*.tsx" 2>/dev/null | grep -E "aria-label|aria-labelledby" | wc -l | xargs)
echo "   Total buttons: $BUTTONS_TOTAL"
echo "   With ARIA labels: $BUTTONS_WITH_ARIA"
echo "   Missing ARIA: $((BUTTONS_TOTAL - BUTTONS_WITH_ARIA))"

IMAGES_TOTAL=$(grep -r "<img" src --include="*.tsx" 2>/dev/null | wc -l | xargs)
IMAGES_WITH_ALT=$(grep -r "<img" src --include="*.tsx" 2>/dev/null | grep "alt=" | wc -l | xargs)
echo "   Total images: $IMAGES_TOTAL"
echo "   With alt text: $IMAGES_WITH_ALT"
echo "   Missing alt: $((IMAGES_TOTAL - IMAGES_WITH_ALT))"

echo ""

# Duplicate Code
echo "📋 Code Duplication:"
echo "───────────────────"

OWNER_BADGE_COUNT=$(find src -name "OwnerBadge.tsx" 2>/dev/null | wc -l | xargs)
echo "   OwnerBadge implementations: $OWNER_BADGE_COUNT"

OWNER_FILTER_COUNT=$(find src -name "OwnerFilter.tsx" 2>/dev/null | wc -l | xargs)
echo "   OwnerFilter implementations: $OWNER_FILTER_COUNT"

echo ""

# Summary
echo "📈 Summary:"
echo "──────────"

TOTAL_ISSUES=$((ANY_TYPES + CONSOLE_CALLS + LARGE_FILES + (BUTTONS_TOTAL - BUTTONS_WITH_ARIA)))
echo "   Total issues to fix: ~$TOTAL_ISSUES"

# Score calculation (out of 100)
# Deduct points for issues
SCORE=100
SCORE=$((SCORE - (ANY_TYPES / 2)))           # -0.5 per 'any'
SCORE=$((SCORE - (CONSOLE_CALLS / 5)))       # -0.2 per console
SCORE=$((SCORE - (LARGE_FILES * 2)))         # -2 per large file
SCORE=$((SCORE - ((BUTTONS_TOTAL - BUTTONS_WITH_ARIA) / 10)))  # -0.1 per missing ARIA

if [ $SCORE -lt 0 ]; then SCORE=0; fi

echo "   Quality Score: $SCORE/100"

echo ""

if [ $SCORE -lt 60 ]; then
  echo "❌ Quality score is below 60. Immediate action recommended!"
elif [ $SCORE -lt 80 ]; then
  echo "⚠️  Quality score is below 80. Improvements needed."
else
  echo "✅ Quality score is good! Keep it up."
fi

echo ""
echo "───────────────────────────────────────"
echo "Run 'npm run fix-all' to auto-fix some issues"
echo "See TECHNICAL_DEBT_ELIMINATION_PLAN.md for full fix guide"
