# Vercel Deployment - Environment Variables Setup

## ⚠️ Your .env.local was overwritten by Vercel!

You need to restore your environment variables and add them to Vercel.

## Step 1: Restore Your Local .env.local

Edit `.env.local` and add back your variables:

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
VITE_SUPABASE_REDIRECT_URL=https://lifesync-personal-assistant-dpykkysaq.vercel.app/auth/callback

# Groq API (for AI features - optional)
VITE_GROQ_API_KEY=your-groq-api-key-here

# Other optional variables
VITE_FINANCE_BACKEND=
VITE_RECIPE_SEARCH_URL=
VITE_VAPID_PUBLIC_KEY=
```

## Step 2: Add Environment Variables to Vercel

### Option A: Via CLI (Recommended)

```bash
# Add each variable for production
vercel env add VITE_SUPABASE_URL production
# Paste your Supabase URL when prompted

vercel env add VITE_SUPABASE_ANON_KEY production
# Paste your Supabase anon key when prompted

vercel env add VITE_SUPABASE_REDIRECT_URL production
# Enter: https://lifesync-personal-assistant-dpykkysaq.vercel.app/auth/callback

vercel env add VITE_GROQ_API_KEY production
# Paste your Groq API key when prompted (if you have one)
```

### Option B: Via Vercel Dashboard

1. Go to: https://vercel.com/nikithas-projects-0065b3e2/lifesync-personal-assistant/settings/environment-variables
2. Click "Add New"
3. Add each variable:
   - Name: `VITE_SUPABASE_URL`, Value: your Supabase URL
   - Name: `VITE_SUPABASE_ANON_KEY`, Value: your Supabase anon key
   - Name: `VITE_SUPABASE_REDIRECT_URL`, Value: `https://lifesync-personal-assistant-dpykkysaq.vercel.app/auth/callback`
   - Name: `VITE_GROQ_API_KEY`, Value: your Groq API key (optional)

## Step 3: Redeploy

After adding environment variables, redeploy:

```bash
vercel --prod
```

## Step 4: Update Supabase Redirect URLs

Go to your Supabase dashboard:
1. Navigate to Authentication → URL Configuration
2. Add to "Redirect URLs":
   ```
   https://lifesync-personal-assistant-dpykkysaq.vercel.app/auth/callback
   https://lifesync-personal-assistant-dpykkysaq.vercel.app/**
   ```

## Your Deployment URL

🚀 **Production URL**: https://lifesync-personal-assistant-dpykkysaq.vercel.app

Once environment variables are set and you redeploy, ChatGPT will be able to access your app at this URL!

