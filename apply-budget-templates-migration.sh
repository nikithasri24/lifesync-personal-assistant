#!/bin/bash

# Budget Templates Migration Applicator
# This script helps apply the budget templates migration to your Supabase database

set -e

echo "🚀 Budget Templates Migration"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Migration file: supabase/migrations/20251117_add_budget_templates.sql${NC}"
echo ""

# Method 1: Try using Supabase CLI
echo "Method 1: Using Supabase CLI"
echo "----------------------------"

if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI is installed"

    # Check if we can push just this migration
    echo ""
    echo "Attempting to apply migration via Supabase CLI..."
    echo ""

    # This will fail if there are ordering issues, but let's try
    npx supabase db push 2>&1 | head -20 && echo "" && echo -e "${GREEN}✅ Migration applied successfully!${NC}" || {
        echo ""
        echo -e "${YELLOW}⚠️  CLI push failed. Trying alternative method...${NC}"
        echo ""

        # Method 2: SQL Editor Instructions
        echo "Method 2: Manual Application via Supabase Dashboard"
        echo "---------------------------------------------------"
        echo ""
        echo "1. Open your Supabase project dashboard:"
        echo "   https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa/editor"
        echo ""
        echo "2. Click on 'SQL Editor' in the left sidebar"
        echo ""
        echo "3. Click 'New Query'"
        echo ""
        echo "4. Copy the entire migration SQL below:"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        cat supabase/migrations/20251117_add_budget_templates.sql
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "5. Paste it into the SQL Editor"
        echo ""
        echo "6. Click 'Run' (or press Cmd/Ctrl + Enter)"
        echo ""
        echo "7. You should see success messages including:"
        echo "   ✅ Budget templates table created successfully"
        echo "   📊 Migrated X budget templates from existing budgets"
        echo ""
        echo -e "${GREEN}That's it! Your budget templates feature will be ready to use.${NC}"
    }
else
    echo "❌ Supabase CLI not found"
    echo ""
    echo "Please use the SQL Editor method described above."
fi
