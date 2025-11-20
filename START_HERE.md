# 🚀 START HERE - Conversational AI Assistant

## ✅ Setup Checklist (5 minutes total)

### Step 1: Get Groq API Key (2 minutes)
- [ ] Go to https://console.groq.com/
- [ ] Sign up with Google/Email (free, no credit card)
- [ ] Click "API Keys" in left sidebar
- [ ] Click "Create API Key"
- [ ] Copy the key (starts with `gsk_`)

### Step 2: Configure Environment (1 minute)
- [ ] Open `.env` file in project root
- [ ] Add this line:
```
GROQ_API_KEY=gsk_paste_your_key_here
```
- [ ] Save the file

### Step 3: Start the App (1 minute)
```bash
npm run dev
```
- [ ] App should start at http://localhost:5173

### Step 4: Test AI Assistant (1 minute)
- [ ] Click "AI Assistant" in navigation (second item)
- [ ] You should see the chat interface
- [ ] Try typing: "I spent $20 on lunch"
- [ ] Or click mic and say it out loud

---

## 🎉 If It Works...

You should see:
1. Your message appears on the right (orange bubble)
2. "Thinking..." animation appears
3. AI response appears on the left (white bubble)
4. If you used voice, AI will speak the response

**Congratulations! You have ChatGPT-style conversation working!**

---

## 🐛 If It Doesn't Work...

### Error: "No response from AI"
**Fix:**
1. Check `.env` has `GROQ_API_KEY=gsk_...`
2. Restart dev server (`Ctrl+C` then `npm run dev`)
3. Check browser console for errors

### Error: "Speech recognition not supported"
**Fix:**
1. Use Chrome or Safari browser
2. Make sure you're on localhost (not another domain)
3. Grant microphone permissions

### Error: "Rate limit exceeded"
**Fix:**
1. You're sending too many messages too fast
2. Wait 60 seconds
3. Free tier allows 30 requests/minute

---

## 💬 Example Conversations to Try

Once working, try these:

### Test 1: Simple Transaction
**Type:** "I spent $45 at Whole Foods"
**Expected:** AI confirms, records transaction, may ask for category

### Test 2: Goal Creation
**Type:** "I want to save $10,000 for a Japan trip"
**Expected:** AI asks when you're going, creates savings plan

### Test 3: Task Creation
**Type:** "Remind me to call mom tomorrow at 3pm"
**Expected:** AI creates task with due date

### Test 4: Week Overview
**Type:** "What's my week look like?"
**Expected:** AI summarizes tasks, deadlines, commitments

### Test 5: Voice (requires mic)
**Say:** "Hey, I just grabbed coffee for 5 bucks"
**Expected:** AI transcribes, responds, speaks answer

---

## 📚 Read Next

After you get it working:

1. **Full Guide:** `docs/AI_ASSISTANT_SETUP.md`
   - Detailed setup instructions
   - All features explained
   - Customization options

2. **Feature Overview:** `CONVERSATIONAL_AI_READY.md`
   - What you can do with the AI
   - How to add more functions
   - Upgrade options

3. **Groq Details:** `docs/GROQ_SETUP.md`
   - Free tier limits
   - API key management
   - Troubleshooting

---

## 🎯 Quick Reference

**API Key Location:** `.env` file in project root
**Cost:** $0 (completely free)
**Voice Support:** Chrome, Safari, Edge
**Rate Limit:** 30 requests/minute (free tier)
**Character Limit:** None
**Expiration:** Never (free forever)

---

## 🆘 Need Help?

1. **Check console:** Browser DevTools → Console tab
2. **Read docs:** `docs/AI_ASSISTANT_SETUP.md`
3. **Verify .env:** Make sure key starts with `gsk_`
4. **Restart server:** Stop and run `npm run dev` again

---

## ✨ You're Ready!

Get your Groq API key and let's see it work!

**Total time:** 5 minutes
**Total cost:** $0
**Result:** ChatGPT-style AI assistant integrated with your app
