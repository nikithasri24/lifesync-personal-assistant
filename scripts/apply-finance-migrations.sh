#!/bin/bash

# Finance Database Migrations Script
# Applies migrations via psql directly to Supabase

set -e

echo "🔧 Finance Database Migration Runner"
echo ""

# Get database credentials from Supabase
PROJECT_REF="rfwaiijodrowakcpayoa"  # from your VITE_SUPABASE_URL
DB_PASSWORD="${SUPABASE_DB_PASSWORD}"  # You'll need to set this

if [ -z "$DB_PASSWORD" ]; then
  echo "❌ Error: SUPABASE_DB_PASSWORD environment variable not set"
  echo ""
  echo "To get your database password:"
  echo "1. Go to Supabase Dashboard → Settings → Database"
  echo "2. Copy the database password"
  echo "3. Run: export SUPABASE_DB_PASSWORD='your-password-here'"
  echo ""
  exit 1
fi

DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "📍 Database: ${DB_HOST}"
echo ""

# Apply migrations
echo "📄 Applying migration 1/2: 20250115_finance_init.sql"
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f "supabase/migrations/20250115_finance_init.sql"

if [ $? -eq 0 ]; then
  echo "✅ Migration 1/2 completed successfully!"
else
  echo "❌ Migration 1/2 failed"
  exit 1
fi

echo ""
echo "📄 Applying migration 2/2: 20250116_categorization_rules.sql"
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f "supabase/migrations/20250116_categorization_rules.sql"

if [ $? -eq 0 ]; then
  echo "✅ Migration 2/2 completed successfully!"
else
  echo "❌ Migration 2/2 failed"
  exit 1
fi

echo ""
echo "✅ All migrations completed successfully!"
echo ""
echo "🎉 Finance schema is ready!"
echo ""
echo "📝 Next steps:"
echo "   1. Create an account and categories"
echo "   2. Add test transactions"
echo "   3. Try auto-categorization!"
