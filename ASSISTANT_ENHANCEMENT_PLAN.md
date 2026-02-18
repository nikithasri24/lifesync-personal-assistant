# Assistant Feature Enhancement Plan

## Overview

Assistant (AI chat interface) allows conversational interaction with LifeSync data. Update to match `assistant-design-spec.html` and apply CLAUDE.md standards.

**Current State:** Exists as Assistant page with V2 components
**Goal:** Match design spec, ensure smooth chat UX, proper message styling

---

## Key Components (from Design Spec)

### 1. Header
- Emoji + title
- Terracotta gradient
- "Clear Chat" button

### 2. Chat Interface
- Message list (scrollable)
- User messages (right-aligned, terracotta background)
- AI messages (left-aligned, white background)
- Loading indicator (typing dots)
- Auto-scroll to bottom on new messages

### 3. Input Area
- Text input field
- Send button (terracotta gradient)
- Voice input button (optional)
- Fixed at bottom

### 4. Message Types
- Text messages
- Action buttons (e.g., "Create task from this")
- Data cards (tasks, habits, etc. rendered inline)

---

## Implementation Phases

### Phase 1: Update Page Layout
- Centered 900px container
- Fixed header
- Scrollable message area
- Fixed input at bottom

### Phase 2: Message Styling
- User messages: Right-aligned, terracotta bg (#FEF3E8), dark text
- AI messages: Left-aligned, white bg, border
- Proper spacing and padding
- Rounded corners (12px)
- Timestamp display

### Phase 3: Chat Input
- Large text input area
- Auto-resize on multiline
- Send button (gradient)
- Enter key to send
- Shift+Enter for new line

### Phase 4: Streaming Response
- Typing indicator while AI responds
- Stream tokens as they arrive
- Smooth animation

### Phase 5: Action Integration
- Parse AI responses for action buttons
- "Create task" → opens task modal with pre-filled data
- "Add to calendar" → opens event modal
- Execute actions from chat

### Phase 6: Code Quality
- React Query for message history
- WebSocket or SSE for streaming
- Error handling
- useThemeColors()

---

## Success Criteria

✅ Matches `assistant-design-spec.html` exactly
✅ Messages styled correctly (user/AI)
✅ Input area fixed at bottom
✅ Streaming responses work smoothly
✅ Action buttons functional
✅ Chat history persists
✅ Auto-scroll to new messages

---

## Files to Create/Update
- `src/pages/Assistant.tsx`
- `src/assistant/components/v2/ChatMessageV2.tsx`
- `src/assistant/components/v2/ChatInputV2.tsx`
- `src/assistant/components/v2/AssistantHeaderV2.tsx`
- `src/assistant/hooks/useChatStream.ts`

---

## Commit Message

```
feat: Enhance Assistant chat interface

Update Assistant to match design spec:
- Proper message styling (user/AI)
- Fixed input at bottom
- Streaming AI responses
- Action button integration
- Chat history persistence

Features:
- Conversational AI interface
- Create tasks/goals/habits from chat
- Natural language data queries
- Terracotta theme for user messages

Files: 5+ created/updated

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

**Complexity:** Medium-High - Streaming, real-time updates, action parsing
**Risk:** Medium - Depends on AI API integration quality
