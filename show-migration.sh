#!/bin/bash

# Display the budget templates migration SQL for easy copying

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "  BUDGET TEMPLATES MIGRATION SQL"
echo "  Copy everything below this line and paste into Supabase SQL Editor"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
cat supabase/migrations/20251117_add_budget_templates.sql
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ To apply:"
echo "   1. Go to: https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa/sql"
echo "   2. Click 'New Query'"
echo "   3. Paste the SQL above"
echo "   4. Click 'Run'"
echo ""
echo "📖 Full instructions: See APPLY_MIGRATION.md"
echo "═══════════════════════════════════════════════════════════════════════════════"
