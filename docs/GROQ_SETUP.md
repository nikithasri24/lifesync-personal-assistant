# Groq API Setup (FREE)

## Get Your Free API Key

1. Go to https://console.groq.com/
2. Sign up with Google/Email (free account)
3. Navigate to "API Keys" in left sidebar
4. Click "Create API Key"
5. Copy the key (starts with `gsk_`)

## Add to Environment

```bash
# .env
GROQ_API_KEY=gsk_your_key_here
```

## Free Tier Limits

- **14,400 requests per day** (600/hour)
- **30 requests per minute**
- **No credit card required**
- **No expiration**

For a single user testing, this is effectively unlimited.

## Available Models

- `llama-3.1-70b-versatile` - Best for conversation (RECOMMENDED)
- `llama-3.1-8b-instant` - Faster, simpler responses
- `mixtral-8x7b-32768` - Good for longer context

## Rate Limit Handling

The conversation engine will automatically:
- Retry with exponential backoff if rate limited
- Queue requests if too many simultaneous calls
- Switch to fallback responses if Groq is down
