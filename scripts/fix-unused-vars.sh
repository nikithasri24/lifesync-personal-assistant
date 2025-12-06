#!/bin/bash

# Automated Script to Fix Unused Variables
# This script helps identify and fix unused variable violations systematically

set -e

echo "🔍 Analyzing unused variable violations..."

# Create output directory
mkdir -p scripts/output

# Step 1: Extract all unused variable errors from lint output
echo "Step 1: Extracting unused variable errors..."
npm run lint 2>&1 | grep "@typescript-eslint/no-unused-vars" > scripts/output/unused-vars-raw.txt || true

# Step 2: Parse and categorize
echo "Step 2: Categorizing unused variables..."

# Extract unused imports
grep "is defined but never used" scripts/output/unused-vars-raw.txt | \
  grep -v "allowed unused vars must match" | \
  cut -d: -f1,2,3 | \
  sort -u > scripts/output/unused-imports.txt || true

# Extract unused function parameters
grep "is defined but never used" scripts/output/unused-vars-raw.txt | \
  grep -E "^\s+[0-9]+:[0-9]+\s+error\s+'[^']+' is defined" | \
  cut -d: -f1,2,3 | \
  sort -u > scripts/output/unused-params.txt || true

# Step 3: Count categories
IMPORT_COUNT=$(wc -l < scripts/output/unused-imports.txt | tr -d ' ')
PARAM_COUNT=$(wc -l < scripts/output/unused-params.txt | tr -d ' ')

echo ""
echo "📊 Unused Variable Analysis:"
echo "  - Unused imports: $IMPORT_COUNT"
echo "  - Unused parameters: $PARAM_COUNT"
echo ""
echo "Files saved to scripts/output/"
echo ""
echo "Next steps:"
echo "  1. Review scripts/output/unused-imports.txt"
echo "  2. Run: node scripts/remove-unused-imports.js"
echo "  3. Review scripts/output/unused-params.txt"
echo "  4. Manually prefix unused params with '_'"
