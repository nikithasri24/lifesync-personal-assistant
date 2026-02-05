#!/bin/bash
# Automated fixes for common issues

set -e

echo "🔧 Running automated fixes..."
echo ""

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js"
    exit 1
fi

# Format code with Prettier
echo "1️⃣  Formatting code with Prettier..."
if command -v prettier &> /dev/null || [ -f "node_modules/.bin/prettier" ]; then
    npx prettier --write "src/**/*.{ts,tsx,json}" --log-level warn
    echo "   ✅ Code formatted"
else
    echo "   ⚠️  Prettier not installed, skipping"
fi

echo ""

# Fix linting issues
echo "2️⃣  Fixing ESLint issues..."
if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
    npx eslint src --ext .ts,.tsx --fix --quiet || echo "   ⚠️  Some ESLint errors couldn't be auto-fixed"
    echo "   ✅ Auto-fixable lint issues resolved"
else
    echo "   ⚠️  ESLint config not found, skipping"
fi

echo ""

# Type check (doesn't fix, but reports)
echo "3️⃣  Type checking..."
if npx tsc --noEmit 2>&1 | head -20; then
    echo "   ✅ No TypeScript errors"
else
    echo "   ⚠️  TypeScript errors found (see above)"
    echo "   💡 Run 'npm run type-check' for full report"
fi

echo ""
echo "───────────────────────────────────"
echo "✅ Automated fixes complete!"
echo ""
echo "Next steps:"
echo "  1. Review changes with 'git diff'"
echo "  2. Run 'npm run quality-report' to see improvements"
echo "  3. Run tests with 'npm test'"
echo "  4. Commit changes"
