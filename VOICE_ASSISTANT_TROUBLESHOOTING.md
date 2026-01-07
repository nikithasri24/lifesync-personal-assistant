# 🎤 Voice Assistant Troubleshooting Guide

## ✅ **DEBUG TOOL ADDED!**

I've added a **Voice Debugger** tool to help diagnose the issue:

### How to Use:
1. **Start the dev server**: `npm run dev`
2. **Look for the orange bug icon** 🐛 next to the Voice button in the header
3. **Click the bug icon** to open the Voice Debugger
4. **Check all the system checks** - it will show you exactly what's wrong
5. **Test voice features** directly from the debugger

The debugger checks:
- ✅ Browser support for speech recognition
- ✅ Speech synthesis support
- ✅ HTTPS / localhost requirement
- ✅ Groq API key configuration
- ✅ Microphone permission status

---

## Issue: Voice button on dashboard not working

### Common Causes & Solutions

#### 1. **Browser Permissions** 🔒
**Problem:** Microphone access not granted

**Solution:**
- Click the Voice button
- Look for a browser permission popup asking for microphone access
- Click "Allow" to grant permission
- If you accidentally clicked "Block", you need to:
  - Click the lock icon in the address bar
  - Find "Microphone" permissions
  - Change from "Block" to "Allow"
  - Refresh the page

#### 2. **HTTPS Requirement** 🔐
**Problem:** Web Speech API requires HTTPS (or localhost)

**Current Status:**
- ✅ Works on: `localhost`, `127.0.0.1`, `https://` sites
- ❌ Doesn't work on: `http://` sites (except localhost)

**Solution:**
- If running locally: Use `localhost` or `127.0.0.1`
- If deployed: Ensure your site uses HTTPS

#### 3. **Browser Compatibility** 🌐
**Problem:** Not all browsers support Web Speech API

**Supported Browsers:**
- ✅ Chrome/Edge (Best support)
- ✅ Safari (iOS 14.5+, macOS)
- ⚠️ Firefox (Limited support)
- ❌ Internet Explorer (Not supported)

**Solution:**
- Use Chrome, Edge, or Safari for best experience
- Check browser console for "Voice not supported" message

#### 4. **AI Backend Configuration** 🤖
**Problem:** ConversationEngine not configured

**Check:**
- Open browser console (F12)
- Click the Voice button
- Look for errors related to:
  - API keys
  - OpenAI configuration
  - Network requests failing

**Solution:**
- Ensure OpenAI API key is configured in environment variables
- Check `.env` file for `VITE_OPENAI_API_KEY`
- Verify API key is valid and has credits

#### 5. **Console Errors** 🐛
**How to check:**
1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to "Console" tab
3. Click the Voice button
4. Look for red error messages

**Common errors:**
- `"Microphone permission denied"` → Grant permissions (see #1)
- `"Speech recognition not supported"` → Use Chrome/Safari (see #3)
- `"API key not found"` → Configure OpenAI key (see #4)
- `"Network error"` → Check internet connection

---

## Quick Diagnostic Steps

### Step 1: Check Browser Support
1. Open browser console (F12)
2. Type: `'webkitSpeechRecognition' in window || 'SpeechRecognition' in window`
3. If it returns `true` → Browser supports voice
4. If it returns `false` → Browser doesn't support voice (try Chrome)

### Step 2: Check Microphone Permission
1. Click Voice button
2. Look for permission popup
3. Grant permission if asked
4. Check browser address bar for microphone icon

### Step 3: Check Console for Errors
1. Open console (F12)
2. Click Voice button
3. Read any error messages
4. Share errors if you need help

---

## Alternative: Use AI Assistant Page

If the Voice modal isn't working, try the dedicated AI Assistant page:

1. Click "Assistant" in the left navigation
2. This is a full-page voice assistant
3. Same functionality, different UI
4. May work better on some devices

---

## Still Not Working?

### What to check:
1. ✅ Using Chrome, Edge, or Safari?
2. ✅ On HTTPS or localhost?
3. ✅ Microphone permission granted?
4. ✅ OpenAI API key configured?
5. ✅ No console errors?

### Next Steps:
1. **Check browser console** for specific error messages
2. **Try the AI Assistant page** (left navigation → Assistant)
3. **Test on different browser** (Chrome recommended)
4. **Share console errors** if you need help debugging

---

## Technical Details

### Voice Assistant Components:
- **VoiceLauncher** - Button in header
- **VoiceAssistant** - Modal dialog
- **useVoice** - Hook for speech recognition
- **ConversationEngine** - AI chat backend

### Files to check:
- `src/components/VoiceLauncher.tsx`
- `src/components/VoiceAssistant.tsx`
- `src/hooks/useVoice.ts`
- `src/services/conversationEngine.ts`

### Environment Variables:
```bash
# .env file
VITE_OPENAI_API_KEY=sk-...your-key-here...
```

---

## Recommendation

**For now, I recommend:**
1. Try the dedicated **AI Assistant page** (left nav → Assistant)
2. It's a full-page experience with better UX
3. We can migrate it to V2 design to match the rest of the app
4. Or we can remove the Voice button from the header if not needed

**Would you like me to:**
- A) Migrate AI Assistant page to V2 design
- B) Remove Voice button from header
- C) Debug the Voice modal issue
- D) Something else?

