# 🎤 Voice Assistant Setup Guide

## Quick Start - Get Voice Working in 3 Steps

### Step 1: Get a FREE Groq API Key (2 minutes)

The Voice Assistant uses **Groq** for AI (it's FREE, no credit card required!):

1. Go to: https://console.groq.com/keys
2. Sign up with Google/GitHub (free)
3. Click "Create API Key"
4. Copy the key (starts with `gsk_...`)

**Why Groq?**
- ✅ Completely FREE (14,400 requests/day)
- ✅ No credit card required
- ✅ Fast responses (faster than OpenAI)
- ✅ Great for personal projects

---

### Step 2: Add API Key to .env File

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** and add your Groq API key:
   ```bash
   # Find these lines in .env:
   GROQ_API_KEY=your_key_here
   VITE_GROQ_API_KEY=your_key_here
   
   # Replace with your actual key:
   GROQ_API_KEY=gsk_abc123...
   VITE_GROQ_API_KEY=gsk_abc123...
   ```

3. **Save the file**

---

### Step 3: Test Voice Assistant

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open the app** in your browser (Chrome or Safari recommended)

3. **Click the orange bug icon** 🐛 next to the Voice button

4. **Check the system status:**
   - All checks should be green ✅
   - If Groq API Key shows red ❌, restart the dev server

5. **Click "Test Voice Recognition":**
   - Browser will ask for microphone permission
   - Click "Allow"
   - Speak into your microphone
   - You should see your words transcribed

6. **Click "Test Speech Synthesis":**
   - You should hear "Hello! Voice synthesis is working correctly."

7. **If all tests pass**, close the debugger and click the **Voice** button!

---

## Using the Voice Assistant

### Voice Modal (Quick Access)
1. Click **Voice** button in the header
2. Modal opens with voice assistant
3. It starts listening automatically
4. Speak naturally: "Add a task to buy groceries"
5. AI responds and performs actions

### AI Assistant Page (Full Experience)
1. Click **Assistant** in the left navigation
2. Full-page voice assistant
3. Better for longer conversations
4. Same functionality as modal

---

## Common Issues & Solutions

### ❌ "Microphone permission denied"
**Solution:**
1. Click the lock icon in browser address bar
2. Find "Microphone" permissions
3. Change to "Allow"
4. Refresh the page

### ❌ "Groq API Key not configured"
**Solution:**
1. Make sure you added the key to `.env` file
2. Restart the dev server (`npm run dev`)
3. Check the debugger again

### ❌ "Speech recognition not supported"
**Solution:**
- Use Chrome, Edge, or Safari (best support)
- Firefox has limited support
- Internet Explorer not supported

### ❌ "Voice not working on deployed site"
**Solution:**
- Make sure your site uses HTTPS (not HTTP)
- Web Speech API requires secure connection
- Localhost works without HTTPS

---

## What Can You Ask?

The Voice Assistant can help with:

### Tasks
- "Add a task to review code"
- "Mark my reading task as done"
- "What tasks do I have today?"

### Habits
- "Mark my reading habit as done"
- "What habits do I need to complete?"

### Calendar
- "What's on my calendar today?"
- "Add an event for tomorrow at 3pm"

### Finances
- "I spent $45 at Whole Foods"
- "What's my spending this month?"

### Goals
- "I want to save $10k for Japan"
- "What are my goals?"

### General
- "What's my week look like?"
- "Remind me to call mom tomorrow"

---

## Advanced Configuration

### Use Different AI Provider

**Option 1: Ollama (FREE, Local, Offline)**
```bash
# In .env:
VITE_LLM_PROVIDER=ollama
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.2

# Install Ollama:
# https://ollama.ai
# Run: ollama pull llama3.2
# Run: ollama serve
```

**Option 2: OpenAI (PAID, High Quality)**
```bash
# In .env:
VITE_LLM_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-...
VITE_OPENAI_MODEL=gpt-4o-mini
```

---

## Troubleshooting

### Debug Tool
- Click the orange bug icon 🐛 next to Voice button
- Shows all system checks
- Test voice features
- See exact error messages

### Browser Console
1. Press F12 to open DevTools
2. Go to Console tab
3. Click Voice button
4. Look for error messages
5. Share errors if you need help

---

## Need Help?

1. **Check the debugger** - Click the bug icon 🐛
2. **Read error messages** - They tell you exactly what's wrong
3. **Try the AI Assistant page** - Full-page experience may work better
4. **Use Chrome/Safari** - Best browser support
5. **Check .env file** - Make sure API key is set

---

## Summary

✅ **Get Groq API key** (free, 2 minutes)  
✅ **Add to .env file** (both GROQ_API_KEY and VITE_GROQ_API_KEY)  
✅ **Restart dev server** (`npm run dev`)  
✅ **Click bug icon** 🐛 to test  
✅ **Grant microphone permission**  
✅ **Start talking!** 🎤

**Enjoy your Voice Assistant!** 🎉

