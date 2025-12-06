# AI Assistant Setup Guide

## 🎉 You now have ChatGPT-style conversation in your app!

Your LifeSync app now has a conversational AI assistant that can:
- ✅ Understand natural language (no command patterns needed)
- ✅ Perform actions across all modules (tasks, finance, goals, etc.)
- ✅ Voice conversations (talk to it like ChatGPT Voice)
- ✅ Multi-turn context (remembers your conversation)
- ✅ **100% FREE** (using Groq + Web Speech API)

---

## 🚀 Quick Start (5 minutes)

### Step 1: Get Free Groq API Key

1. Go to https://console.groq.com/
2. Sign up with Google/Email (no credit card needed)
3. Click "API Keys" in sidebar
4. Click "Create API Key"
5. Copy the key (starts with `gsk_`)

### Step 2: Add to Environment

```bash
# Create or edit .env file
cp .env.example .env

# Add your Groq API key
GROQ_API_KEY=gsk_your_key_here_xxxxxxxxxxxxx
```

### Step 3: Run the App

```bash
npm run dev
```

### Step 4: Test the Assistant

1. Open http://localhost:5173
2. Click "AI Assistant" in the navigation
3. Try saying or typing:
   - "I spent $45 at Whole Foods"
   - "I want to save $10k for Japan"
   - "What's my week look like?"
   - "Remind me to call mom tomorrow"

---

## 🎤 Voice Conversations

### How to Use Voice

1. Click the microphone button (🎤)
2. Start talking naturally
3. The assistant will:
   - Transcribe what you said
   - Think about the best response
   - Speak the answer back
   - Continue listening for follow-ups

### Supported Browsers

- ✅ **Chrome** (Desktop & Mobile) - Best experience
- ✅ **Safari** (Desktop & Mobile) - Good quality
- ✅ **Edge** (Desktop) - Works well
- ❌ Firefox - Limited voice support

### Tips for Best Voice Quality

- Speak clearly and at normal pace
- Use headphones to prevent echo
- Grant microphone permissions when prompted
- Works best in quiet environments

---

## 💬 Example Conversations

### Example 1: Track Spending

**You:** "Hey, I just grabbed coffee"
**Assistant:** "Nice! How much was it?"
**You:** "Like 5 bucks"
**Assistant:** "Got it, $5 for coffee. Which account?"
**You:** "My Chase card"
**Assistant:** "Perfect. Added $5 coffee expense to Chase. You've spent $47 on coffee this month."
**You:** "Wow, that's a lot"
**Assistant:** "Want me to set a coffee budget?"
**You:** "Yeah, maybe $50 a month"
**Assistant:** "Done. You have $3 left this month. I'll remind you when you're close."

### Example 2: Goal Setting

**You:** "I want to save money for a trip to Japan"
**Assistant:** "Awesome goal! How much do you want to save?"
**You:** "Like 10 thousand dollars"
**Assistant:** "When are you planning to go?"
**You:** "April next year"
**Assistant:** "Perfect! That's 5 months away. You'll need to save $2,000 per month. Let me check your budget..."
**Assistant:** "Your current monthly surplus is $800. To save $2,000/month, you'd need to cut $1,200 in spending. Want me to suggest budget adjustments?"
**You:** "Yes please"
**Assistant:** "Here's what I suggest: Cut dining out from $450 to $200 (-$250), reduce entertainment from $200 to $100 (-$100), should I make these changes?"
**You:** "Yes, do it"
**Assistant:** "Done! I've also created task milestones: Research flights (due Dec 15), Book flights (due Mar 1), etc. Your Japan trip goal is all set up!"

### Example 3: Weekly Planning

**You:** "What does my week look like?"
**Assistant:** "You have 18 tasks this week, 4 meetings, and 3 habits to complete daily. You're 6 hours overcommitted based on your calendar. Want me to help prioritize?"
**You:** "Yeah, what should I defer?"
**Assistant:** "I suggest moving 'Q4 Report' to next week (frees 4 hours) and deferring 2 low-priority tasks. Should I reschedule them?"
**You:** "Yes"
**Assistant:** "Done! Your week is now optimized. You also have 3 dinners unplanned. Want quick meal suggestions?"

---

## 🔧 How It Works (Technical)

### Architecture

```
User Voice → Web Speech API (FREE) → Groq Llama 3.1 70B (FREE) → Function Calls → Your Database
                                            ↓
User Hears ← Web Speech API (FREE) ← Natural Response
```

### Available Functions

The AI can call these functions to actually do things:

- `create_goal()` - Create life goals
- `create_task()` - Add tasks with due dates
- `add_transaction()` - Record expenses/income
- `get_spending_summary()` - Analyze spending
- `create_budget()` - Set budget limits
- `get_week_overview()` - Check upcoming tasks
- `complete_habit()` - Mark habits done
- `suggest_meal()` - Get meal ideas

### Cost Breakdown (FREE!)

| Component | Provider | Cost |
|-----------|----------|------|
| Speech-to-Text | Web Speech API | FREE |
| LLM (Conversation) | Groq (Llama 3.1 70B) | FREE (14,400 req/day) |
| Text-to-Speech | Web Speech API | FREE |
| **TOTAL** | | **$0/month** |

---

## 🎯 What the Assistant Can Do

### ✅ Currently Implemented

- Record financial transactions
- Create and manage tasks
- Set up goals with savings plans
- Get spending summaries
- Create budgets
- Check weekly overview
- Multi-turn conversations
- Context awareness

### 🚧 Coming Soon (Easy to Add)

- Complete habits via voice
- Plan meals conversationally
- Create trips and travel plans
- Log skincare products
- Schedule focus sessions
- Add journal entries
- Create grocery lists
- Check goal progress

---

## 🔌 Upgrading to Paid APIs (Optional)

If you want higher quality later, you can switch to paid APIs:

### OpenAI (Better voice quality)

```env
VITE_VOICE_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-proj-xxx

# Cost: ~$1-2/month for personal use
```

### Anthropic Claude (Better reasoning)

```env
VITE_LLM_PROVIDER=anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-xxx

# Cost: ~$1-2/month for personal use
```

### ElevenLabs (Best voice quality)

```env
VITE_TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=xxx

# Cost: $22/month for 100K characters
```

**But the free stack works great for getting started!**

---

## 🐛 Troubleshooting

### "No response from AI"

- Check that `GROQ_API_KEY` is set in `.env`
- Restart dev server after adding env vars
- Check console for errors

### "Speech recognition not supported"

- Switch to Chrome or Safari
- Make sure you're on HTTPS (or localhost)
- Grant microphone permissions

### "Rate limit exceeded"

- Groq free tier: 30 requests/minute
- Wait 1 minute and try again
- Upgrade to paid API if needed

### Voice not working on mobile

- Use Safari on iOS or Chrome on Android
- Grant microphone permissions
- Connect headphones for better quality

---

## 📱 Mobile Experience

The assistant is mobile-first:

- **Tap to talk** - Single mic button
- **Type or speak** - Flexible input
- **Optimized layout** - Works great on phones
- **Offline mode** - Coming soon with PWA

---

## 🎨 Customization

### Change AI Personality

Edit `src/services/conversationEngine.ts`:

```typescript
const systemMessage = `You are a helpful AI assistant...

Guidelines:
- Be conversational and natural
- [Add your custom personality here]
- Keep responses concise but warm
`;
```

### Add New Functions

1. Define function in `FUNCTION_DEFINITIONS`
2. Implement in `executeFunction()`
3. AI will automatically use it!

### Change Voice

Edit `src/hooks/useConversationalVoice.ts`:

```typescript
const preferredVoice = voices.find(voice =>
  voice.name.includes('Your Preferred Voice')
);
```

---

## 🚀 Next Steps

1. **Get your Groq API key** (2 minutes)
2. **Test the assistant** with example conversations
3. **Customize** the personality and functions
4. **Upgrade** to paid APIs if you want (optional)

Your app now has conversational AI that rivals ChatGPT - completely free!

---

## 📚 Resources

- Groq Console: https://console.groq.com/
- Web Speech API Docs: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- OpenAI API (optional): https://platform.openai.com/
- Anthropic Claude (optional): https://console.anthropic.com/

---

**Built with:**
- Groq Llama 3.1 70B (LLM)
- Web Speech API (Voice I/O)
- Function calling for real actions
- Mobile-first React UI
