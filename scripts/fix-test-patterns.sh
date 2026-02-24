#!/bin/bash

# Script to fix common E2E test patterns
# This fixes:
# 1. Title expectations (LifeSync → Life Weave)
# 2. data-testid selectors → semantic selectors

echo "🔧 Fixing E2E test patterns..."

# Fix 1: Update title expectations
echo "📝 Updating title expectations..."
find tests/e2e -name "*.spec.ts" -type f -exec sed -i '' 's/toHaveTitle(\/LifeSync\/)/toHaveTitle(\/Life Weave|LifeSync\/)/g' {} +

# Fix 2: Replace data-testid="main-content" with semantic main selector
echo "📝 Replacing main-content data-testid..."
find tests/e2e -name "*.spec.ts" -type f -exec sed -i '' "s/locator('\[data-testid=\"main-content\"\]')/locator('main')/g" {} +
find tests/e2e -name "*.spec.ts" -type f -exec sed -i '' 's/locator("\[data-testid=\\"main-content\\"\]")/locator("main")/g' {} +

# Fix 3: Replace data-testid="sidebar" with semantic navigation selector
echo "📝 Replacing sidebar data-testid..."
find tests/e2e -name "*.spec.ts" -type f -exec sed -i '' "s/locator('\[data-testid=\"sidebar\"\]')/getByRole('navigation', { name: \/Main navigation\/i })/g" {} +
find tests/e2e -name "*.spec.ts" -type f -exec sed -i '' 's/locator("\[data-testid=\\"sidebar\\"\]")/getByRole("navigation", { name: \/Main navigation\/i })/g' {} +

echo "✅ Test pattern fixes complete!"
echo ""
echo "Run tests to verify:"
echo "  npm run test:e2e -- tests/e2e/app.spec.ts tests/e2e/auth.spec.ts --project=chromium"
