# LifeSync Architecture Documentation

**Version:** 2.0
**Date:** December 2025
**Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vision & Core Principles](#vision--core-principles)
3. [High-Level Architecture](#high-level-architecture)
4. [Detailed Architecture](#detailed-architecture)
5. [Folder Structure](#folder-structure)
6. [Core Components](#core-components)
7. [Data Flow](#data-flow)
8. [Scalability & Performance](#scalability--performance)
9. [Security & Reliability](#security--reliability)
10. [Technology Stack](#technology-stack)
11. [Migration Strategy](#migration-strategy)

---

## Executive Summary

LifeSync is transforming from a traditional multi-page web application into a **voice-first, AI-powered personal assistant** with full visual editing capabilities. The architecture supports dual interfaces (voice and visual) that share the same backend logic, ensuring users can interact with the system however they prefer based on context.

### Key Features:
- **Voice-First Interface:** Natural conversational AI for quick, hands-free interactions
- **Visual Interface:** Full-featured editing capabilities for precise control
- **Seamless Sync:** Real-time synchronization across all devices and interfaces
- **Feature-First Architecture:** Scalable, maintainable codebase organized by domain
- **Direct Supabase Integration:** No abstraction layers, leveraging all Supabase features

---

## Vision & Core Principles

### Product Vision
> "Your AI life manager. Just talk to it - or edit visually when you need precision."

### Core Principles

1. **Voice-First, Visual-Available**
   - Voice is the primary, fastest way to interact
   - Visual interface provides full control when needed
   - Users choose based on context (meeting, driving, planning)

2. **Single Source of Truth**
   - Both interfaces use the same API layer
   - No code duplication
   - Always in sync

3. **Feature-First Organization**
   - Code organized by domain (tasks, finance, habits)
   - Each feature is self-contained
   - Easy to develop in parallel

4. **Direct Data Access**
   - No unnecessary abstraction layers
   - Leverage Supabase features fully (real-time, RLS, storage)
   - Simple, fast, reliable

5. **Scalability by Design**
   - Horizontal scaling via Supabase
   - Efficient LLM usage
   - Optimistic updates
   - Smart caching

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER CAN CHOOSE INTERFACE                     │
│                                                                  │
│  ┌──────────────────────┐        ┌──────────────────────────┐  │
│  │  VOICE INTERFACE     │   OR   │   VISUAL INTERFACE       │  │
│  │  (Fast, Hands-free)  │        │   (Precise, Silent)      │  │
│  ├──────────────────────┤        ├──────────────────────────┤  │
│  │ "Add task buy milk"  │        │ Click + Form + Submit    │  │
│  │ "Log $50 expense"    │        │ Tap + Edit + Save        │  │
│  │ "Show my habits"     │        │ Swipe + View + Update    │  │
│  └──────────┬───────────┘        └──────────┬───────────────┘  │
│             │                               │                   │
│             └───────────────┬───────────────┘                   │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  SHARED API/TOOLS │
                    │  (Same backend)   │
                    └─────────┬─────────┘
                              │
                              ▼
                        ┌──────────┐
                        │ Supabase │
                        └──────────┘
```

---

## Detailed Architecture

### System Architecture Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                            │
│                                                                       │
│  ┌────────────────────────────┐  ┌────────────────────────────────┐ │
│  │   VOICE/CHAT INTERFACE     │  │     VISUAL INTERFACE           │ │
│  │   (Assistant.tsx)          │  │     (Feature Pages)            │ │
│  ├────────────────────────────┤  ├────────────────────────────────┤ │
│  │ • Voice input/output       │  │ • Full CRUD forms              │ │
│  │ • Chat bubbles             │  │ • Drag & drop                  │ │
│  │ • Quick actions            │  │ • Inline editing               │ │
│  │ • Suggested replies        │  │ • Bulk operations              │ │
│  │                            │  │ • Advanced filters             │ │
│  │ USE WHEN:                  │  │                                │ │
│  │ ✅ Driving/walking         │  │ USE WHEN:                      │ │
│  │ ✅ Cooking/exercising      │  │ ✅ Need precision              │ │
│  │ ✅ Quick capture           │  │ ✅ In public/meetings          │ │
│  │ ✅ Hands-free needed       │  │ ✅ Complex edits               │ │
│  └────────────┬───────────────┘  └────────────┬───────────────────┘ │
└───────────────┼──────────────────────────────┼─────────────────────┘
                │                               │
                │    BOTH USE SAME LAYER ↓      │
                │                               │
┌───────────────┼──────────────────────────────┼─────────────────────┐
│               │    APPLICATION LOGIC LAYER   │                      │
│               │                               │                      │
│  ┌────────────▼───────────────────────────────▼──────────────────┐ │
│  │                    FEATURE MODULES                            │ │
│  │  Each feature provides BOTH:                                  │ │
│  │   1. AI Tools (for voice)                                     │ │
│  │   2. React Hooks (for visual UI)                              │ │
│  │                                                                │ │
│  │  ┌──────────────────────────────────────────────────────┐    │ │
│  │  │  FEATURE: Tasks, Finance, Habits, Kitchen, etc.      │    │ │
│  │  ├──────────────────────────────────────────────────────┤    │ │
│  │  │  api.ts: Direct Supabase calls (SHARED)              │    │ │
│  │  │  hooks.ts: React Query hooks (for visual UI)         │    │ │
│  │  │  tools.ts: AI tools (for voice)                      │    │ │
│  │  │  components/: UI components (for visual)             │    │ │
│  │  │  types.ts: TypeScript types                          │    │ │
│  │  └──────────────────────────────────────────────────────┘    │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼────────────────────────────────┐
│                         DATA ACCESS LAYER                           │
│  ┌────────────────────────────────▼─────────────────────────────┐  │
│  │                      Supabase Client                          │  │
│  │  • Single source of truth                                     │  │
│  │  • Real-time sync (both interfaces stay in sync)             │  │
│  │  • Row Level Security                                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼───────────────────────────────┐
│                      SUPABASE BACKEND                              │
│  ┌────────────────────────────────▼─────────────────────────────┐ │
│  │                  PostgreSQL Database                          │ │
│  │  • tasks, habits, finance, shopping, goals                    │ │
│  │  • projects, calendar, journal, pantry, recipes               │ │
│  │  • conversations (AI session persistence)                     │ │
│  │  • Row Level Security (RLS) enabled                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │            Realtime Subscriptions                             │ │
│  │  • Broadcast changes to all user devices                      │ │
│  │  • Filter by user_id                                          │ │
│  │  • Conflict resolution (last-write-wins)                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Storage Buckets                                  │ │
│  │  • receipts/ (transaction receipts)                           │ │
│  │  • avatars/ (user profile pics)                               │ │
│  │  • exports/ (data exports)                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

### Feature-First Organization

```
src/
├── features/                          # Feature-based organization
│   ├── assistant/                     # PRIMARY FEATURE - Voice/Chat AI
│   │   ├── components/
│   │   │   ├── VoiceInterface.tsx    # Voice input/output
│   │   │   ├── ChatMessage.tsx       # Message bubbles
│   │   │   ├── ThinkingIndicator.tsx # AI thinking animation
│   │   │   └── QuickActions.tsx      # Suggested replies
│   │   ├── hooks/
│   │   │   ├── useVoiceInput.ts      # Web Speech API
│   │   │   ├── useConversation.ts    # Message management
│   │   │   └── useSpeechOutput.ts    # TTS
│   │   ├── services/
│   │   │   ├── conversationEngine.ts  # Core AI logic
│   │   │   ├── toolRegistry.ts        # Available tools
│   │   │   └── contextManager.ts      # Conversation memory
│   │   └── types.ts
│   │
│   ├── tasks/                         # Task management
│   │   ├── api.ts                    # Direct Supabase calls (SHARED)
│   │   ├── hooks.ts                  # useTasks, useCreateTask (VISUAL)
│   │   ├── tools.ts                  # AI tools for tasks (VOICE)
│   │   ├── components/               # Visual UI components
│   │   │   ├── TaskList.tsx         # Full interactive list
│   │   │   ├── TaskCard.tsx         # Editable card
│   │   │   ├── TaskForm.tsx         # Create/edit form
│   │   │   ├── TaskFilters.tsx      # Advanced filters
│   │   │   └── TaskKanban.tsx       # Kanban view
│   │   └── types.ts
│   │
│   ├── finance/
│   │   ├── api.ts                    # SHARED
│   │   ├── hooks.ts                  # VISUAL
│   │   ├── tools.ts                  # VOICE
│   │   ├── components/
│   │   │   ├── ExpenseChart.tsx
│   │   │   ├── BudgetEditor.tsx
│   │   │   ├── TransactionTable.tsx
│   │   │   └── CategoryManager.tsx
│   │   ├── analytics.ts              # Spending insights
│   │   └── types.ts
│   │
│   ├── habits/
│   │   ├── api.ts                    # SHARED
│   │   ├── hooks.ts                  # VISUAL
│   │   ├── tools.ts                  # VOICE
│   │   ├── components/
│   │   │   ├── HabitTracker.tsx
│   │   │   ├── StreakCalendar.tsx
│   │   │   ├── HabitEditor.tsx
│   │   │   └── ProgressCharts.tsx
│   │   └── types.ts
│   │
│   ├── kitchen/                      # Shopping + Meals + Pantry
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   ├── tools.ts
│   │   ├── components/
│   │   │   ├── ShoppingList.tsx
│   │   │   ├── MealPlanner.tsx
│   │   │   └── PantryInventory.tsx
│   │   └── types.ts
│   │
│   ├── calendar/
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   ├── tools.ts
│   │   ├── components/
│   │   └── types.ts
│   │
│   ├── goals/
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   ├── tools.ts
│   │   ├── components/
│   │   └── types.ts
│   │
│   ├── journal/
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   ├── tools.ts
│   │   ├── components/
│   │   └── types.ts
│   │
│   └── analytics/                    # Cross-feature insights
│       ├── api.ts
│       ├── hooks.ts
│       ├── tools.ts
│       ├── components/
│       │   ├── Dashboard.tsx
│       │   ├── InsightsCard.tsx
│       │   └── TrendChart.tsx
│       └── types.ts
│
├── lib/                              # Shared infrastructure
│   ├── ai/
│   │   ├── llmProvider.ts            # LLM client (Groq/OpenAI)
│   │   ├── functionCalling.ts        # Tool execution logic
│   │   └── prompts.ts                # System prompts
│   ├── supabase/
│   │   ├── client.ts                 # Supabase client
│   │   ├── auth.ts                   # Auth helpers
│   │   ├── realtime.ts               # Subscription helpers
│   │   └── types.ts                  # Auto-generated DB types
│   ├── voice/
│   │   ├── speechRecognition.ts      # Web Speech API wrapper
│   │   └── speechSynthesis.ts        # TTS wrapper
│   └── utils/
│       ├── logger.ts                 # Structured logging
│       ├── retry.ts                  # Retry logic
│       └── errorHandler.ts           # Error normalization
│
├── hooks/                            # Global hooks
│   ├── useAuth.ts                    # Authentication
│   ├── useRealtimeSync.ts            # Cross-device sync
│   └── useOfflineQueue.ts            # Offline support
│
├── stores/                           # Global state (minimal)
│   ├── authStore.ts                  # User session
│   └── uiStore.ts                    # UI state (nav, modals)
│
├── components/                       # Shared components
│   ├── Layout.tsx
│   ├── Navigation.tsx
│   ├── ModeSwitch.tsx               # Voice/Visual toggle
│   ├── ErrorBoundary.tsx
│   └── LoadingSpinner.tsx
│
├── pages/                            # Route components (thin wrappers)
│   ├── AssistantPage.tsx             # Voice/Chat (home/default)
│   ├── TasksPage.tsx                 # Visual tasks management
│   ├── FinancePage.tsx               # Visual finance dashboard
│   ├── HabitsPage.tsx                # Visual habit tracking
│   ├── KitchenPage.tsx               # Shopping/meals/pantry
│   └── CalendarPage.tsx              # Calendar view
│
├── types/                            # Global types
│   ├── database.ts                   # Supabase generated
│   └── app.ts                        # App-level types
│
└── App.tsx                           # Root component
```

---

## Core Components

### 1. Conversational AI Engine

**Location:** `src/features/assistant/services/conversationEngine.ts`

**Responsibilities:**
- Manage conversation state and memory
- Interface with LLM (Groq Llama 70B)
- Handle function calling (tool execution)
- Persist conversations to Supabase
- Multi-turn dialogue management

**Key Features:**
- Streaming responses
- Context window management (last 10 messages)
- Tool result integration
- Error handling with graceful fallbacks

### 2. Tool Registry

**Location:** `src/features/assistant/services/toolRegistry.ts`

**Responsibilities:**
- Register all available AI tools from features
- Route tool calls to correct feature
- Handle tool execution errors
- Provide tool metadata to LLM

**Pattern:**
```typescript
// Each feature exports tools
import { taskTools } from '@/features/tasks/tools';
import { financeTools } from '@/features/finance/tools';

// Registry aggregates all tools
toolRegistry.register([...taskTools, ...financeTools, ...]);
```

### 3. Feature API Layer

**Location:** `src/features/{feature}/api.ts`

**Responsibilities:**
- Direct Supabase database calls
- CRUD operations
- Business logic
- Data validation
- Error handling

**Shared by:**
- AI tools (voice interface)
- React hooks (visual interface)

### 4. React Query Hooks

**Location:** `src/features/{feature}/hooks.ts`

**Responsibilities:**
- Wrap API calls with React Query
- Manage loading/error states
- Implement optimistic updates
- Handle cache invalidation
- Real-time data synchronization

### 5. AI Tools

**Location:** `src/features/{feature}/tools.ts`

**Responsibilities:**
- Define tool schema for LLM
- Parse natural language parameters
- Call feature API functions
- Format results for LLM

### 6. Visual Components

**Location:** `src/features/{feature}/components/`

**Responsibilities:**
- Full CRUD UI
- Forms, lists, cards
- Drag & drop
- Inline editing
- Bulk operations
- Advanced filtering

---

## Data Flow

### Voice Interface Flow

```
1. User speaks: "Add task buy milk"
   ↓
2. Web Speech API → Text: "Add task buy milk"
   ↓
3. ConversationEngine.sendMessage()
   ↓
4. LLM analyzes → Decides to call create_task tool
   ↓
5. ToolRegistry.executeTool('create_task', {title: 'buy milk'})
   ↓
6. taskTools.create_task.execute()
   ↓
7. api.createTask() → Supabase INSERT
   ↓
8. Real-time sync → All devices get update
   ↓
9. LLM generates response: "Added 'buy milk' to your tasks"
   ↓
10. TTS speaks response
```

### Visual Interface Flow

```
1. User clicks "+ New Task"
   ↓
2. TaskForm component opens
   ↓
3. User fills form: title="buy milk"
   ↓
4. useCreateTask().mutate({title: 'buy milk'})
   ↓
5. Optimistic update → UI shows task immediately
   ↓
6. api.createTask() → Supabase INSERT
   ↓
7. Real-time sync → All devices/interfaces get update
   ↓
8. React Query invalidates cache
   ↓
9. UI re-renders with confirmed data
```

### Cross-Interface Sync

```
Device A (Voice) creates task
   ↓
Supabase INSERT
   ↓
Supabase Realtime broadcasts change
   ↓
Device B (Visual) receives real-time event
   ↓
React Query invalidates ['tasks'] cache
   ↓
UI automatically re-fetches and displays new task
```

---

## Scalability & Performance

### Database Performance

**Indexing Strategy:**
```sql
-- User-filtered queries (most common)
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status) WHERE deleted = false;
CREATE INDEX idx_tasks_user_due_date ON tasks(user_id, due_date) WHERE deleted = false;
CREATE INDEX idx_habits_user_active ON habits(user_id, is_active);
CREATE INDEX idx_transactions_user_date ON financial_transactions(user_id, date DESC);

-- Conversation retrieval
CREATE INDEX idx_conversations_user_updated ON conversations(user_id, updated_at DESC);
```

**Row Level Security (RLS):**
```sql
-- All tables enforce user isolation
CREATE POLICY "Users can only see own data"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only modify own data"
  ON tasks FOR ALL
  USING (auth.uid() = user_id);
```

### Caching Strategy

**React Query Configuration:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutes
      cacheTime: 1000 * 60 * 30,     // 30 minutes
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

**Cache Keys Pattern:**
```typescript
export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    byStatus: (status: string) => ['tasks', { status }] as const,
    byId: (id: string) => ['tasks', id] as const,
  },
  // Feature-specific keys...
};
```

### LLM Cost Optimization

**Current Costs (Groq Llama 70B):**
- Input: $0.59 per 1M tokens
- Output: $0.79 per 1M tokens
- Average conversation: ~5,000 tokens
- Cost per conversation: ~$0.004

**Optimization Strategies:**
1. Use llama-3.1-8b-instant for simple queries (10x cheaper)
2. Conversation summarization after 20 turns
3. Cache common tool results
4. Batch tool executions when possible

**Projected Costs:**
- 10,000 users × 10 conversations/day = 100,000 conversations/day
- Daily cost: ~$400
- Monthly cost: ~$12,000
- Per user per month: ~$1.20

### Real-time Sync Performance

**Supabase Realtime:**
- WebSocket connections per user
- Server-side filtering by user_id
- Automatic reconnection
- Batched updates (100ms window)

**Optimization:**
```typescript
// Subscribe only to relevant changes
const channel = supabase
  .channel('user-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `user_id=eq.${userId}`  // Server-side filter
  }, handleChange)
  .subscribe();
```

### Offline Support

**Strategy:**
1. Queue operations in IndexedDB
2. Optimistic UI updates
3. Sync when connection restored
4. Conflict resolution (last-write-wins)

**Implementation:**
```typescript
class OfflineQueue {
  async queueOperation(table: string, operation: string, data: any) {
    // Store in IndexedDB
    await db.queue.add({ table, operation, data, timestamp: Date.now() });

    // Optimistic UI update
    queryClient.setQueryData([table], (old) => [...old, data]);

    // Try sync
    if (navigator.onLine) {
      await this.syncQueue();
    }
  }
}
```

---

## Security & Reliability

### Authentication

**Supabase Auth:**
- Email/password authentication
- OAuth providers (Google, GitHub)
- Magic link authentication
- JWT token management
- Session persistence

### Authorization

**Row Level Security (RLS):**
- All tables enforce user isolation
- Policies based on auth.uid()
- No data leakage between users
- Admin policies for support access

### Data Validation

**Multi-layer validation:**
1. **Client-side:** Form validation (zod schemas)
2. **Type safety:** TypeScript end-to-end
3. **Database:** CHECK constraints, foreign keys
4. **RLS:** User access control

### Error Handling

**Strategy:**
```typescript
// Centralized error handler
export function handleError(error: Error, context: string) {
  // Log to monitoring service
  logger.error(context, error);

  // User-friendly message
  const message = getUserFriendlyMessage(error);

  // Show toast notification
  toast.error(message);

  // Report to error tracking (Sentry)
  Sentry.captureException(error, { tags: { context } });
}
```

### Monitoring & Observability

**Structured Logging:**
```typescript
logger.info('Tool executed', {
  userId,
  toolName,
  duration: executionTime,
  success: true
});
```

**Metrics to Track:**
- LLM latency (p50, p95, p99)
- Tool execution time
- Database query performance
- Error rates by feature
- User engagement (conversations/day)
- Cache hit rates

---

## Technology Stack

### Frontend
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **State Management:**
  - React Query (server state)
  - Zustand (minimal global state)
- **UI Components:**
  - Tailwind CSS
  - Headless UI
  - Radix UI primitives
- **Voice:** Web Speech API
- **Drag & Drop:** react-beautiful-dnd
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts

### Backend (Supabase)
- **Database:** PostgreSQL 15+
- **Auth:** Supabase Auth (JWT)
- **Real-time:** Supabase Realtime (WebSockets)
- **Storage:** Supabase Storage (S3-compatible)
- **Edge Functions:** Deno (TypeScript)

### AI/ML
- **LLM Provider:** Groq
- **Models:**
  - llama-3.1-70b-versatile (primary)
  - llama-3.1-8b-instant (simple queries)
- **Framework:** LangChain.js
- **Function Calling:** Native LLM tools

### Infrastructure
- **Hosting:** Vercel (frontend)
- **Database:** Supabase Cloud
- **CDN:** Vercel Edge Network
- **Monitoring:** Sentry (errors), Vercel Analytics
- **Logging:** Structured JSON logs → Supabase logs

---

## Migration Strategy

### No Backward Compatibility Required

We're doing a **clean architectural rewrite** focused on best practices for scalability and reliability. This means:
- ✅ Delete old code as we go
- ✅ No migration paths for legacy patterns
- ✅ Fresh database schema (with data migration scripts)
- ✅ Clean slate for optimal architecture

### Phase 1: Foundation (Week 1-2)
**Goal:** Set up new architecture infrastructure

**Tasks:**
1. Create new folder structure (`src/features/`)
2. Set up conversationEngine with Groq LLM
3. Implement tool registry
4. Create shared Supabase client with error handling
5. Add React Query configuration
6. Create new database tables:
   - `conversations` table for AI sessions
   - Add necessary indexes
7. Set up logging infrastructure
8. Create Layout with voice/visual mode switcher

**Deliverables:**
- ✅ Feature-first folder structure
- ✅ AI conversation engine (basic)
- ✅ Tool registry infrastructure
- ✅ Supabase client wrapper
- ✅ React Query setup
- ✅ Mode switcher UI component

---

### Phase 2: Implement Core Features (Week 3-5)

**Week 3: Tasks Feature**
1. Create `features/tasks/api.ts` (Supabase CRUD)
2. Create `features/tasks/hooks.ts` (React Query hooks)
3. Create `features/tasks/tools.ts` (AI tools)
4. Build visual components (TaskList, TaskCard, TaskForm)
5. Test voice commands
6. Test visual interface
7. Verify real-time sync

**Week 4: Finance Feature**
1. Create `features/finance/` following same pattern
2. Add analytics calculations
3. Build charts and dashboards
4. Implement budget tracking
5. Test voice expense logging
6. Test visual transaction management

**Week 5: Habits Feature**
1. Create `features/habits/`
2. Implement streak tracking
3. Build calendar visualization
4. Add progress charts
5. Test voice habit logging
6. Test visual habit editing

**Deliverables:**
- ✅ Tasks fully functional (voice + visual)
- ✅ Finance fully functional (voice + visual)
- ✅ Habits fully functional (voice + visual)
- ✅ All features sync in real-time
- ✅ AI can perform operations across all three

---

### Phase 3: Remaining Features (Week 6-7)

**Week 6: Kitchen (Shopping/Meals/Pantry)**
1. Consolidate shopping, meal planning, pantry into one feature
2. Create `features/kitchen/`
3. Build integrated UI
4. Add AI tools for shopping/cooking

**Week 7: Calendar, Goals, Journal**
1. Create `features/calendar/`
2. Create `features/goals/`
3. Create `features/journal/`
4. Integrate with existing features

**Deliverables:**
- ✅ Kitchen feature complete
- ✅ Calendar integration
- ✅ Goals tracking
- ✅ Journal entries
- ✅ All features accessible via voice + visual

---

### Phase 4: AI Intelligence Enhancement (Week 8-9)

**Week 8: Conversational Improvements**
1. Enhance system prompts for natural conversation
2. Add context awareness (cross-feature suggestions)
3. Implement conversation memory persistence
4. Add proactive suggestions based on user patterns
5. Improve error handling and recovery

**Week 9: Tool Optimization**
1. Add batch operations
2. Implement tool result caching
3. Add fuzzy matching for natural language
4. Create compound tools (e.g., "plan my week")
5. Test complex multi-step conversations

**Deliverables:**
- ✅ Natural, conversational AI responses
- ✅ Context-aware suggestions
- ✅ Proactive daily briefings
- ✅ Complex multi-turn dialogues work smoothly

---

### Phase 5: Performance & Offline Support (Week 10)

**Tasks:**
1. Implement offline queue (IndexedDB)
2. Add optimistic updates for all mutations
3. Database query optimization
4. Add database indexes
5. LLM response caching
6. Bundle size optimization
7. Add loading states and skeletons

**Deliverables:**
- ✅ Works offline on mobile
- ✅ Instant UI updates (optimistic)
- ✅ Fast database queries (<100ms)
- ✅ Reduced LLM costs
- ✅ Smooth loading experiences

---

### Phase 6: Visual UI Polish (Week 11)

**Tasks:**
1. Enhance TaskList with drag & drop
2. Add bulk operations to all features
3. Build advanced filters
4. Create keyboard shortcuts
5. Add animations and transitions
6. Mobile responsive design
7. Dark mode support

**Deliverables:**
- ✅ Polished visual interfaces
- ✅ Drag & drop working
- ✅ Bulk operations
- ✅ Mobile-optimized
- ✅ Beautiful animations

---

### Phase 7: Production Hardening (Week 12)

**Tasks:**
1. Security audit (RLS policies)
2. Error tracking setup (Sentry)
3. Performance monitoring
4. Comprehensive testing
5. Load testing
6. User onboarding flow
7. Documentation

**Deliverables:**
- ✅ Security hardened
- ✅ Monitoring in place
- ✅ Error tracking active
- ✅ Tested at scale
- ✅ User onboarding complete
- ✅ Documentation finished

---

### Data Migration

**User data migration from old schema to new:**

```typescript
// Run once per user on first login to new system
async function migrateUserData(userId: string) {
  // Migrate tasks
  const oldTasks = await oldDb.getTasks(userId);
  await Promise.all(
    oldTasks.map(task => newApi.createTask(userId, transformTask(task)))
  );

  // Migrate habits
  const oldHabits = await oldDb.getHabits(userId);
  await Promise.all(
    oldHabits.map(habit => newApi.createHabit(userId, transformHabit(habit)))
  );

  // ... migrate all features

  // Mark migration complete
  await supabase.from('user_migrations').insert({
    user_id: userId,
    migrated_at: new Date().toISOString()
  });
}
```

---

## Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Interface Pattern** | Dual (Voice + Visual) | Flexibility based on context |
| **Shared Logic** | Single API layer | No duplication, always in sync |
| **Voice Default** | Yes, easy toggle | Voice-first, visual when needed |
| **Visual Capabilities** | Full CRUD | Not read-only - full editing power |
| **API Layer** | Direct Supabase | Simple, fast, leverage features |
| **State Management** | React Query + Zustand | Cache server state, minimal global |
| **Folder Structure** | Feature-first | Scalability, parallel development |
| **AI Provider** | Groq (Llama 70B) | Cost-effective, fast, quality |
| **Function Calling** | Native LLM tools | Standard, reliable, supported |
| **Real-time Sync** | Supabase Realtime | Built-in, reliable, easy |
| **Mobile Strategy** | React Native (later) | Code reuse, faster development |
| **Offline Support** | IndexedDB queue | Reliability, mobile-first |
| **Monitoring** | Structured logs + Sentry | Observability, debugging |
| **Backward Compatibility** | None | Clean rewrite for best architecture |

---

## Benefits Summary

### For Users
✅ **Voice for speed:** "Add task buy milk" (2 seconds)
✅ **Visual for precision:** Complex edits, reordering, filtering
✅ **Context-aware:** Choose best interface for situation
✅ **Always in sync:** Real-time across devices & modes
✅ **Works offline:** Queue operations, sync when online
✅ **Natural conversations:** Like talking to a smart assistant

### For Developers
✅ **Feature-first:** Easy to find code, parallel development
✅ **No duplication:** Single API shared by both interfaces
✅ **Type-safe:** TypeScript end-to-end
✅ **Simple:** No unnecessary abstractions
✅ **Scalable:** Supabase handles growth
✅ **Maintainable:** Clear separation of concerns

### For Business
✅ **Unique positioning:** No competitor does voice-first well
✅ **Low cost:** ~$1.20/user/month for AI
✅ **Fast development:** Feature-first enables parallel work
✅ **Reliable:** Built on proven infrastructure
✅ **Scalable:** Can handle growth to 100K+ users
✅ **Mobile-ready:** Same codebase for web + mobile

---

## Next Steps

See `docs/implementation-plan.md` for detailed week-by-week implementation roadmap with specific tasks and code examples.

---

**Document Version:** 2.0
**Last Updated:** December 2025
**Author:** LifeSync Architecture Team
