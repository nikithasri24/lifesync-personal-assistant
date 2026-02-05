#!/bin/bash

# Vercel Environment Variables Setup Script
# This script will help you add environment variables to Vercel

echo "🚀 Setting up Vercel Environment Variables"
echo "==========================================="
echo ""

# Supabase URL (we already know this)
SUPABASE_URL="https://rfwaiijodrowakcpayoa.supabase.co"

echo "✅ Supabase URL: $SUPABASE_URL"
echo ""

# Ask for the anon key
echo "📝 Please paste your Supabase ANON KEY (from Supabase Dashboard > Settings > API):"
read -r SUPABASE_ANON_KEY

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ Error: Anon key cannot be empty"
  exit 1
fi

echo ""
echo "🔧 Adding environment variables to Vercel..."
echo ""

# Add Supabase URL
echo "$SUPABASE_URL" | vercel env add VITE_SUPABASE_URL production

# Add Supabase Anon Key
echo "$SUPABASE_ANON_KEY" | vercel env add VITE_SUPABASE_ANON_KEY production

# Add redirect URL
echo "https://lifesync-personal-assistant-dpykkysaq.vercel.app/auth/callback" | vercel env add VITE_SUPABASE_REDIRECT_URL production

echo ""
echo "✅ Environment variables added!"
echo ""
echo "📝 Now updating your local .env.local file..."

# Update local .env.local
cat > .env.local << EOF
# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
VITE_SUPABASE_REDIRECT_URL=http://localhost:5173/auth/callback

# Groq API (optional - add if you have one)
VITE_GROQ_API_KEY=

# Other optional variables
VITE_FINANCE_BACKEND=
VITE_RECIPE_SEARCH_URL=
VITE_VAPID_PUBLIC_KEY=
EOF

echo "✅ Local .env.local updated!"
echo ""
echo "🚀 Now deploying to Vercel..."
echo ""

# Deploy to production
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app is live at: https://lifesync-personal-assistant-dpykkysaq.vercel.app"
echo ""
echo "⚠️  Don't forget to add this URL to Supabase allowed redirect URLs:"
echo "   1. Go to Supabase Dashboard > Authentication > URL Configuration"
echo "   2. Add: https://lifesync-personal-assistant-dpykkysaq.vercel.app/**"
echo ""

