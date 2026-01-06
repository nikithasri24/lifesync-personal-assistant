# Fix: AI Assistant Rate Limit Error

## Problem
You're hitting Groq's rate limit:
```
Rate limit reached for model `llama-3.1-8b-instant`
Limit: 6000 tokens per minute
```

## Quick Solutions

### Option 1: Wait and Retry (Easiest)
The rate limit resets every minute. Just wait 1-2 minutes and try again.

### Option 2: Install Ollama for Unlimited Local AI (Recommended)

Ollama runs AI models locally on your computer - completely free and unlimited!

**Step 1: Install Ollama**
```bash
# macOS
brew install ollama

# Or download from: https://ollama.ai
```

**Step 2: Start Ollama**
```bash
# Pull the model (one-time, ~4GB download)
ollama pull llama3.2

# Start the server
ollama serve
```

**Step 3: Update your `.env` file**
```bash
# Add this line to use Ollama as fallback
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.2
```

**Step 4: Restart your app**
```bash
# Stop the dev server (Ctrl+C)
# Start it again
npm run dev
```

Now when Groq hits rate limits, it will automatically fall back to Ollama!

### Option 3: Reduce Token Usage

Edit `src/lib/providers/llm/groq.provider.ts` to use fewer tokens:

```typescript
// Line 43: Reduce max_tokens
max_tokens: options?.maxTokens ?? 1000,  // Changed from 2000
```

### Option 4: Use a Different Groq Model

Some models have higher rate limits. Edit `src/lib/providers/llm/groq.provider.ts`:

```typescript
// Line 25: Change the default model
constructor(apiKey: string, model: string = 'llama-3.3-70b-versatile') {
```

Available models:
- `llama-3.1-8b-instant` - Fastest, lowest limit (current)
- `llama-3.3-70b-versatile` - Better quality, higher limit
- `mixtral-8x7b-32768` - Good balance

## Understanding the Error

The error shows:
- **Limit**: 6000 tokens/minute
- **Used**: 5827 tokens
- **Requested**: 2068 tokens
- **Total**: Would exceed limit by 1895 tokens

This means you're making too many requests or using too many tokens per request.

## Best Long-Term Solution

**Use Ollama as your primary provider:**

1. Install Ollama (see Option 2 above)
2. Update `.env`:
```bash
VITE_LLM_PROVIDER=ollama
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.2

# Keep Groq as backup
VITE_GROQ_API_KEY=your_key_here
```

3. Restart the app

Benefits:
- ✅ Unlimited usage
- ✅ Works offline
- ✅ Free forever
- ✅ Privacy (data stays local)
- ✅ Fast responses

## Troubleshooting

**"Ollama connection refused"**
- Make sure Ollama is running: `ollama serve`
- Check if it's on port 11434: `curl http://localhost:11434`

**"Model not found"**
- Pull the model: `ollama pull llama3.2`
- List available models: `ollama list`

**Still getting rate limits**
- Wait 60 seconds for Groq's limit to reset
- Check your Groq dashboard: https://console.groq.com
- Consider upgrading to Groq's paid tier for higher limits

