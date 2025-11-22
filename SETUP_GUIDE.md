# AI-First Personal Assistant - Setup Guide

Welcome! This guide will help you set up your AI-powered personal assistant from scratch using **100% free services**.

---

## Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **A web browser** (Chrome, Safari, or Edge for voice features)

---

## Quick Start (5 Minutes)

### 1. Clone and Install

```bash
git clone <repository-url>
cd lifesync-personal-assistant
npm install
```

### 2. Get Groq API Key (FREE - No Credit Card)

1. Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up with Google/GitHub (takes 30 seconds)
3. Click "Create API Key"
4. Copy the key (starts with `gsk_...`)

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Groq API key:

```bash
GROQ_API_KEY=gsk_your_key_here
VITE_GROQ_API_KEY=gsk_your_key_here
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

Navigate to **Assistant** page and try:
- "Add task: Call dentist tomorrow"
- "I spent $45 at Whole Foods on groceries"
- "What's on my schedule today?"

🎉 **You're done!** Your AI assistant is running.

---

## Optional: Local LLM with Ollama (Offline AI)

Want to run AI completely offline? Install Ollama:

### 1. Install Ollama

**Mac:**
```bash
brew install ollama
```

**Linux:**
```bash
curl https://ollama.ai/install.sh | sh
```

**Windows:**
Download from [https://ollama.ai/download](https://ollama.ai/download)

### 2. Download Model

```bash
# Smaller, faster (3.2GB)
ollama pull llama3.2

# Larger, smarter (4.7GB)
ollama pull llama3.1
```

### 3. Start Ollama Server

```bash
ollama serve
```

### 4. Configure to Use Ollama

Edit `.env`:

```bash
VITE_LLM_PROVIDER=ollama
VITE_OLLAMA_MODEL=llama3.2
```

Now your AI works **100% offline** with no API costs!

---

## Full Setup (All Features)

For the complete experience with email parsing, calendar sync, etc.:

### 1. Supabase (Database & Auth)

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up (free)
3. Create new project
4. Copy credentials to `.env`:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

5. Run in Supabase SQL Editor:

```sql
-- Enable vector extension for semantic search
create extension if not exists vector;

-- Create embeddings table
create table embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  content text,
  embedding vector(384),
  metadata jsonb,
  created_at timestamptz default now()
);

-- Create index for fast similarity search
create index on embeddings
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
```

### 2. Gmail API (Email & Receipt Parsing)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:5173/auth/google/callback`
6. Download credentials and add to `.env`:

```bash
VITE_GMAIL_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_GMAIL_CLIENT_SECRET=GOCSPX-xxxxx
```

### 3. Google Calendar API

1. Same Google Cloud project as Gmail
2. Enable Google Calendar API
3. Use same OAuth credentials

```bash
VITE_GOOGLE_CALENDAR_ENABLED=true
```

### 4. Redis Cache (Optional but Recommended)

#### Option A: Upstash (FREE Cloud Redis)

1. Go to [https://upstash.com](https://upstash.com)
2. Create database
3. Copy URL:

```bash
VITE_REDIS_URL=https://xxxxx.upstash.io
VITE_REDIS_TOKEN=xxxxx
```

#### Option B: Local Redis (FREE, Unlimited)

```bash
# Mac
brew install redis
brew services start redis

# Linux
sudo apt install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis
```

```bash
VITE_REDIS_URL=redis://localhost:6379
```

---

## Provider Configuration Matrix

Choose your setup based on needs:

### Minimal Setup (100% Free, No Registration)
```bash
# .env
VITE_LLM_PROVIDER=ollama
VITE_OLLAMA_MODEL=llama3.2
```
- Install Ollama locally
- Works offline
- No API keys needed
- Good for experimentation

### Recommended Setup (FREE with Registration)
```bash
# .env
VITE_LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_key
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
- Faster inference than Ollama
- Persistent data in Supabase
- 14,400 requests/day free
- Best for daily use

### Full Setup (FREE, All Features)
```bash
# .env
VITE_LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_key

VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

VITE_GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_GMAIL_CLIENT_SECRET=GOCSPX-xxx

VITE_REDIS_URL=https://xxx.upstash.io
VITE_REDIS_TOKEN=xxx
```
- All features enabled
- Auto receipt parsing
- Calendar sync
- Context caching

### Production Setup (Paid, When Selling Product)
```bash
# .env
VITE_LLM_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-proj-xxx
VITE_OPENAI_MODEL=gpt-4o-mini

# ... rest same as Full Setup
```
- Reliable, fast inference
- Better function calling
- ~$50-100/month for single user

---

## Testing Your Setup

### 1. Test LLM Provider

```bash
# Create test file
cat > test-llm.ts << 'EOF'
import { createLLMProvider } from './src/lib/providers/factory';

async function test() {
  const llm = await createLLMProvider();
  console.log('Using provider:', llm.getName());

  const response = await llm.chat([
    { role: 'user', content: 'Say hello!' }
  ]);

  console.log('Response:', response.content);
}

test();
EOF

# Run test
npx tsx test-llm.ts
```

Expected output:
```
Using provider: groq
Response: Hello! How can I help you today?
```

### 2. Test AI Assistant in Browser

1. Start dev server: `npm run dev`
2. Navigate to Assistant page
3. Try commands:
   - "Add task: Buy groceries tomorrow"
   - "I spent $25 at Starbucks on coffee"
   - "What's my schedule today?"

### 3. Test Voice Input (Optional)

1. Click microphone icon in Assistant
2. Allow microphone permissions
3. Speak: "Add task call mom tomorrow"
4. Should transcribe and create task

---

## Troubleshooting

### "No LLM provider available"

**Problem:** Neither Groq nor Ollama is configured

**Solution:**
```bash
# Option 1: Add Groq API key to .env
GROQ_API_KEY=gsk_your_key

# Option 2: Install and start Ollama
ollama serve
```

### "Groq rate limit exceeded"

**Problem:** Hit the 14,400 requests/day limit

**Solution:**
```bash
# Switch to Ollama temporarily
VITE_LLM_PROVIDER=ollama

# Or wait 24 hours for Groq to reset
```

### "Ollama connection refused"

**Problem:** Ollama server not running

**Solution:**
```bash
ollama serve

# Or check if it's on different port
curl http://localhost:11434/api/tags
```

### Voice not working

**Problem:** Browser doesn't support Web Speech API

**Solution:**
- Use Chrome, Safari, or Edge (not Firefox)
- Enable microphone permissions
- Use HTTPS in production (localhost is OK for dev)

### Supabase connection error

**Problem:** Invalid credentials or wrong URL

**Solution:**
```bash
# Check credentials in Supabase dashboard
# Settings → API → Project URL and anon/public key

# Ensure .env has correct values
VITE_SUPABASE_URL=https://xxxxx.supabase.co  # NO trailing slash
VITE_SUPABASE_ANON_KEY=eyJ...  # Full key, starts with eyJ
```

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  User Interface (React + Vite)         │
│  - Assistant (conversational AI)       │
│  - Dashboard (today's overview)        │
│  - Tasks, Habits, Finance, etc.        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Provider Abstraction Layer            │
│  - LLM (Groq / Ollama / OpenAI)        │
│  - Vector DB (pgvector / Pinecone)     │
│  - Email (Gmail API)                   │
│  - Storage (Supabase / S3)             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Services                               │
│  - Context Engine (life state)         │
│  - Briefing Generator                  │
│  - Receipt Parser                      │
│  - Automation Engine                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Data Layer                             │
│  - Supabase (PostgreSQL + Auth)        │
│  - Redis (cache + queue)               │
│  - pgvector (semantic search)          │
└─────────────────────────────────────────┘
```

---

## Next Steps

Once your setup is working:

1. **Read the Implementation Plan:** `IMPLEMENTATION_PLAN.md`
2. **Try example workflows:** See `docs/workflows.md`
3. **Configure automation:** Set up morning briefings
4. **Integrate email:** Connect Gmail for receipt parsing

---

## Getting Help

- **Issues:** Create GitHub issue with error logs
- **Questions:** Check `docs/FAQ.md`
- **Feature requests:** Open discussion on GitHub

---

## Migration Path

When you're ready to productize:

1. **LLM:** Groq → OpenAI GPT-4o ($5/1M tokens)
2. **Hosting:** Localhost → Vercel (frontend) + Fly.io (backend)
3. **Database:** Supabase free → Supabase Pro ($25/month)
4. **Vector DB:** pgvector → Pinecone ($70/month)
5. **Monitoring:** Add Sentry + Better Stack

Total cost: ~$150-200/month for production-ready system

---

**Need help?** Open an issue or check the troubleshooting section above.

**Ready to build?** Continue to `IMPLEMENTATION_PLAN.md` 🚀
