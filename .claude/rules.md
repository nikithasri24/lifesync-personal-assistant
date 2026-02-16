# Claude Code Rules for LifeSync Personal Assistant

## 🎯 PROJECT STATUS (December 2025)

**⚠️ THIS IS NOT A GREENFIELD PROJECT - THIS IS AN ENHANCEMENT PROJECT ⚠️**

### Current State (What We Already Have):

**Infrastructure (100% Complete):**
- ✅ Supabase fully integrated with RLS policies (39+ migrations)
- ✅ AI/LLM infrastructure complete (Groq provider + conversation engine)
- ✅ Voice interface working (Web Speech API)
- ✅ React Query configured and ready
- ✅ Zustand stores with modern slice pattern
- ✅ Structured logging system
- ✅ TypeScript strict mode enforced
- ✅ Comprehensive testing setup (58+ test files)

**Features (70% Complete):**
- ✅ **Tasks**: Full API, Store, UI with drag-drop, filters, bulk operations, AI tools
- ✅ **Habits**: Full API, Store, UI with streak tracking (AI tools partial)
- ✅ **Finance**: Full API, Store, UI with advanced tracking, AI tools
- ✅ **Shopping/Meals**: Complete with barcode scanning, receipt parsing (AI tools missing)
- ✅ **Goals**: Using React Query (modern pattern), API ready (AI tools placeholder)
- ✅ **Journal**: API and Store ready (AI tools missing)
- ✅ **Additional**: Focus mode, 75 Hard tracker, Task scheduler with Kanban/Timeline

**What Needs Work (Updated 2026-02-16):**
- ⏳ AI tool registration incomplete (4 tool files not imported) - **15 min**
- ⏳ Assistant page integration needs review - **1-2 hours**
- ⏳ End-to-end testing for voice/visual mode - **2-3 hours**
- ✅ Tool registry extracted (**COMPLETE**)
- ✅ React Query migration complete (**COMPLETE** - see STATE_MANAGEMENT_AUDIT_2026-02-16.md)
- ✅ Mode switcher component implemented (**COMPLETE**)
- ✅ ESLint enforcement for state management boundaries (**NEW** - added 2026-02-16)
- ❌ Journal AI tools - **NOT NEEDED** (user prefers manual journal entry only)

### CRITICAL PROJECT GUIDELINES

**❌ DO NOT:**
- ❌ Delete existing working code without explicit approval
- ❌ Rebuild features from scratch (they already work!)
- ❌ Ignore existing patterns and architecture
- ❌ Duplicate existing functionality
- ❌ Assume this is a greenfield project
- ❌ Follow "clean rewrite" approaches
- ❌ Break existing tests (58+ tests must continue passing)
- ❌ Remove valuable features not in current focus

**✅ DO:**
- ✅ Enhance existing features incrementally
- ✅ Extract and modularize (e.g., tool registry extraction)
- ✅ Migrate to React Query for server state (preserve UI, just change data layer)
- ✅ Complete AI tool coverage for all features
- ✅ Preserve all tests and UIs
- ✅ Build on top of existing infrastructure
- ✅ Follow established patterns in the codebase
- ✅ Read existing code before making changes

### Current Enhancement Focus (Updated 2026-02-16):

> **NOTE:** Much of the original plan is already complete! See PHASE_STATUS_AUDIT_2026-02-16.md for details.

**Week 1 (1-2 hours): Complete AI Tool Registration**
1. ✅ Tool registry extraction - **COMPLETE** (src/lib/ai/toolRegistry.ts)
2. ⏳ Register existing tools (finance, shopping, meals, calendar) - **15 minutes**
   - Update src/lib/ai/registerAllTools.ts to import and register 4 tool files
3. ⏳ Test all tools in conversation - **1 hour**
4. ❌ Journal tools - **NOT NEEDED** (per user request)

**Week 2 (3-5 hours): Complete Voice/Visual Integration**
1. ✅ Mode switcher component - **COMPLETE** (src/components/ModeSwitch.tsx)
2. ⏳ Review Assistant page integration - **1-2 hours**
   - Ensure ModeSwitch is integrated
   - Verify full-screen voice mode works
3. ⏳ End-to-end testing & polish - **2-3 hours**
   - Test mode switching, keyboard shortcuts, persistence
   - UI/UX refinements

**React Query Migration: ✅ COMPLETE**
- All features migrated to React Query (38 hook files, 700+ usages)
- Zustand slices contain UI state only (verified)
- ESLint enforcement rules added (eslint.config.js lines 240-273)
- Zero violations: `npx eslint src/stores/slices/*.ts`
- See STATE_MANAGEMENT_AUDIT_2026-02-16.md for comprehensive analysis

---

## 🚨 Critical Rules (NEVER Break These)

### TypeScript Strict Mode

#### No `any` Types - EVER
- ❌ NEVER use `any` type in any form
- ❌ NEVER use `as any` assertions
- ❌ NEVER use `Record<string, any>`
- ❌ NEVER use `Array<any>`
- ❌ NEVER use `: any` in function parameters or return types
- ✅ Use proper types, interfaces, or type unions
- ✅ Use `unknown` if the type is truly dynamic, then narrow with type guards
- ✅ Use generics for reusable type-safe functions
- 🚨 **If you don't know the type, STOP and ASK ME to clarify**

**Examples:**

```typescript
// ❌ WRONG
const handleChange = (e: any) => { ... }
const data: any = await fetch(...)
const items: Record<string, any> = {}

// ✅ CORRECT
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
const data: Recipe = await fetch(...).then(r => r.json())
const items: Record<string, Recipe> = {}

// ✅ CORRECT (when truly dynamic)
const data: unknown = await fetch(...).then(r => r.json())
if (isRecipe(data)) {
  // Now TypeScript knows it's a Recipe
  console.log(data.title)
}
```

### File Size Limits

- ❌ NEVER create files over 400 lines (excluding blank lines and comments)
- ✅ If a file approaches 350 lines, STOP and extract components/hooks/utils
- ✅ Ask me which parts to extract if unclear
- ✅ Page components should orchestrate, not implement
- ✅ Keep components focused on ONE responsibility

**When a file gets large:**
1. Stop at 350 lines
2. Identify logical sections (components, hooks, utilities, types)
3. Show me an extraction plan
4. Wait for approval
5. Extract and verify

### Testing Discipline

- ✅ ALWAYS run `npm test -- --run` before showing me code
- ✅ ALWAYS run `npm run typecheck` before showing me code
- ✅ ALWAYS run `npm run lint` before showing me code
- ❌ NEVER leave failing tests
- ❌ NEVER skip tests "to fix later"
- ✅ Fix broken tests immediately when you change code
- ✅ Update test assertions when you change behavior (e.g., console.log → logger)
- ✅ Write tests for new features as you build them, not after

**Test Requirements:**
- New components → Unit test with @testing-library/react
- New services/utils → Unit test with vitest
- New features → E2E test with Playwright (if user-facing)
- Bug fixes → Test that reproduces the bug first

### Code Quality

#### No Console Usage
- ❌ NEVER use `console.log`, `console.warn`, `console.error`
- ✅ ALWAYS use the centralized logger service
- ✅ Use appropriate log levels:
  - `logger.debug('Domain', 'message', context)` - Development only
  - `logger.info('Domain', 'message', context)` - Important events
  - `logger.warn('Domain', 'message', context)` - Warnings
  - `logger.error('Domain', error, context)` - Errors

```typescript
// ❌ WRONG
console.log('User created:', user)
console.error('Failed to save:', error)

// ✅ CORRECT
logger.info('UserService', 'User created successfully', { userId: user.id })
logger.error('UserService', error, { operation: 'createUser', userId })
```

#### Explicit Return Types
- ✅ All functions must have explicit return types
- ✅ React components: `: React.FC` or `: JSX.Element`
- ✅ Async functions: `: Promise<Type>`
- ✅ Helps catch errors early

```typescript
// ❌ WRONG
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ CORRECT
const calculateTotal = (items: ShoppingItem[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

## 🔌 API Development Rules (MUST Follow)

### Standardized API Pattern

**ALWAYS use the apiWrapper pattern for all API files:**

```typescript
// ✅ CORRECT - Modern Pattern
import { apiCall, requireAuth, handleSupabaseResponse } from '@/api/apiWrapper';

export async function getItems(filters?: ItemFilters): Promise<ItemData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id);

      return handleSupabaseResponse({ data, error }, 'Item');
    },
    { domain: 'ItemsAPI', operation: 'getItems', data: filters }
  );
}
```

```typescript
// ❌ WRONG - Manual error handling
export async function getItems(): Promise<ItemData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated'); // ❌ Use requireAuth()

  const { data, error } = await query;
  if (error) throw error; // ❌ Use handleSupabaseResponse()
  return data as ItemData[]; // ❌ Use type guards
}
```

### API Pattern Requirements

**MUST DO:**
- ✅ Use `apiCall()` wrapper for all operations
- ✅ Use `requireAuth()` for authentication
- ✅ Use `handleSupabaseResponse()` for Supabase responses
- ✅ Explicit return types: `Promise<Type>`
- ✅ Add merged mode support if data is shareable
- ✅ Use type guards instead of type assertions

**MUST NOT:**
- ❌ Throw raw Supabase errors
- ❌ Use `throw error` without transformation
- ❌ Use `as` type assertions without validation
- ❌ Manual error logging (apiCall does it)
- ❌ Direct `supabase.auth.getUser()` calls (use requireAuth)

### Merged Mode Support (For Shareable Data)

If the module can be shared (tasks, habits, meals, shopping, calendar, goals):

```typescript
// Add merged mode support
let cachedMergedConnection: MergedConnectionResult | null | undefined;

export async function getItemsMergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) {
    return cachedMergedConnection;
  }

  cachedMergedConnection = await getMergedConnectionId('module_name');
  return cachedMergedConnection;
}

export function clearItemsMergedConnectionCache(): void {
  cachedMergedConnection = undefined;
}

// Use in queries
export async function getItems(): Promise<ItemData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getItemsMergedConnection();

      let query = supabase.from('items').select('*');

      if (mergedConnection) {
        query = query.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      return handleSupabaseResponse({ data, error }, 'Item');
    },
    { domain: 'ItemsAPI', operation: 'getItems' }
  );
}
```

### Type Safety in APIs

**Use type guards instead of type assertions:**

```typescript
// ✅ CORRECT
import { isArrayOf, isItemData } from '@/types/guards';

const { data, error } = await query;
if (error) throw error;
if (!data || !isArrayOf(data, isItemData)) {
  throw new ValidationError('Invalid item data received');
}
return data; // TypeScript knows it's ItemData[]
```

```typescript
// ❌ WRONG
const { data, error } = await query;
if (error) throw error;
return data as ItemData[]; // No validation!
```

### Current State

**See:** `API_LAYER_CONSISTENCY_AUDIT_2026-02-16.md`

- **66% of APIs** use modern pattern (28/41 files)
- **34% need migration** (13 files) - Finance module, legacy APIs
- **24% have merged mode** (10/41 files)

**When creating NEW APIs:**
- ALWAYS follow modern pattern above
- Reference `src/api/tasksAPI.ts` as gold standard
- Add merged mode if data is shareable

**When modifying EXISTING APIs:**
- If touching legacy API, consider migrating to modern pattern
- Don't break existing functionality
- Add tests for any changes

---

## 🤖 AI Development Rules (Follow Strictly)

### LLM Integration

**Centralized Provider Pattern:**
- ✅ ALWAYS use the existing `GroqProvider` class (src/lib/providers/llm/groq.provider.ts)
- ❌ NEVER instantiate LangChain models directly in components or services
- ✅ Configuration in one place (environment variables)
- ✅ Consistent error handling across all LLM calls

```typescript
// ❌ WRONG - Direct instantiation
import { ChatGroq } from '@langchain/groq'
const llm = new ChatGroq({ apiKey: '...' })

// ✅ CORRECT - Use existing provider
import { groqProvider } from '@/lib/providers/llm/groq.provider'
const response = await groqProvider.generateResponse(messages, tools)
```

**LLM Call Logging:**
- ✅ Always log LLM calls with structured data
- ✅ Include: duration, token count (if available), model used
- ✅ Log errors with full context
- ✅ Use appropriate log levels

```typescript
// ✅ CORRECT
const startTime = Date.now()
try {
  const response = await groqProvider.generateResponse(messages, tools)
  logger.info('ConversationEngine', 'LLM call successful', {
    duration: Date.now() - startTime,
    messageCount: messages.length,
    toolsAvailable: tools.length
  })
  return response
} catch (error) {
  logger.error('ConversationEngine', error as Error, {
    duration: Date.now() - startTime,
    messageCount: messages.length
  })
  throw error
}
```

**Timeout and Error Handling:**
- ✅ Set reasonable timeouts (max 30s for LLM calls)
- ✅ Implement graceful degradation
- ✅ Provide fallback responses for LLM failures
- ✅ Don't expose raw LLM errors to users

```typescript
// ✅ CORRECT
try {
  const response = await Promise.race([
    groqProvider.generateResponse(messages, tools),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('LLM timeout')), 30000)
    )
  ])
  return response
} catch (error) {
  logger.error('ConversationEngine', error as Error)
  return {
    content: "I'm having trouble processing that right now. Could you try rephrasing or try again in a moment?",
    role: 'assistant'
  }
}
```

### Tool Registry & AI Tools

**Tool Organization:**
- ✅ Each feature must have its own `tools.ts` file
- ✅ Location: `src/features/{feature}/tools.ts` or `src/{feature}/tools.ts`
- ✅ Tools must be exported as an array for registration
- ✅ Tools must follow the Tool interface from conversation engine

```typescript
// ✅ CORRECT Structure
// src/features/tasks/tools.ts
import { Tool } from '@/services/conversationEngine'
import { createTaskSchema, getTasksSchema } from './schemas'

export const taskTools: Tool[] = [
  {
    name: 'create_task',
    description: 'Create a new task for the user',
    parameters: createTaskSchema,
    execute: async (args, userId) => {
      // Implementation
    }
  },
  // ... more tools
]
```

**Tool Naming:**
- ✅ Use snake_case for tool names (LLM convention)
- ✅ Use verb_noun pattern: `create_task`, `get_habits`, `log_expense`
- ✅ Be specific: `complete_task_by_title` not just `complete_task`
- ❌ Avoid generic names: `update`, `get`, `delete`

**Tool Descriptions:**
- ✅ Must be clear and specific
- ✅ Must specify what parameters are required
- ✅ Must indicate what the tool returns
- ✅ Written for LLM to understand, not humans

```typescript
// ❌ BAD
description: 'Creates a task'

// ✅ GOOD
description: 'Create a new task for the user. Requires title (string), optional description, priority (low/medium/high), and dueDate (ISO string). Returns the created task object with id.'
```

**Tool Parameter Validation:**
- ✅ ALWAYS use Zod schemas for parameter validation
- ✅ Define schemas in separate file or at top of tools.ts
- ✅ Validate before executing tool logic
- ✅ Return clear validation errors

```typescript
// ✅ CORRECT
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional()
})

export const taskTools: Tool[] = [
  {
    name: 'create_task',
    description: '...',
    parameters: createTaskSchema,
    execute: async (args, userId) => {
      // Zod validation happens before this
      const { title, description, priority, dueDate } = args

      try {
        const task = await createTask({ title, description, priority, dueDate, userId })
        return {
          success: true,
          task,
          message: `Created task: ${title}`
        }
      } catch (error) {
        logger.error('TaskTools', error as Error, { operation: 'create_task', userId })
        return {
          success: false,
          error: 'Failed to create task. Please try again.'
        }
      }
    }
  }
]
```

**Tool Error Handling:**
- ✅ Always return user-friendly error messages
- ✅ Log technical errors with logger
- ✅ Return success/failure indicators
- ❌ NEVER throw errors from tool execute function
- ✅ Return structured responses

```typescript
// ✅ CORRECT - Structured response
return {
  success: true,
  data: result,
  message: 'Operation completed successfully'
}

// or on error
return {
  success: false,
  error: 'User-friendly error message',
  message: 'Could not complete the operation'
}
```

**Tool Registration:**
- ✅ All tools must be registered in the conversation engine
- ✅ Registration happens at startup/initialization
- ✅ Tools can be registered in groups by feature
- ⚠️ Currently tools are hardcoded in conversationEngine.ts (this needs to be refactored)

```typescript
// CURRENT STATE (needs refactoring)
// tools are hardcoded in src/services/conversationEngine.ts

// TARGET STATE (what we're moving towards)
// src/services/conversationEngine.ts
import { taskTools } from '@/features/tasks/tools'
import { habitTools } from '@/features/habits/tools'
import { financeTools } from '@/features/finance/tools'

export class ConversationEngine {
  constructor() {
    this.registerTools([
      ...taskTools,
      ...habitTools,
      ...financeTools
    ])
  }
}
```

### Voice Interface Rules

**Voice and Text Parity:**
- ✅ EVERY voice command must work via text input
- ✅ EVERY AI tool must be accessible through conversation
- ✅ Don't build voice-only features
- ✅ Test both input methods

**Voice Recognition Handling:**
- ✅ Show transcripts to users before processing
- ✅ Allow users to edit transcripts before submission
- ✅ Provide visual feedback during listening
- ✅ Handle recognition errors gracefully

```typescript
// ✅ CORRECT Pattern
const { transcript, isListening } = useVoiceInput()

// Show interim transcript
{transcript && (
  <div className="interim-transcript">
    Listening: "{transcript}"
  </div>
)}

// On final transcript, show in input field (editable)
// User can review and edit before sending
```

**Fallback Strategy:**
- ✅ If voice recognition fails, default to text input
- ✅ If speech synthesis fails, show text response
- ✅ Never block functionality due to voice issues
- ✅ Inform users when voice features aren't available

### Conversation Context Management

**Context Window:**
- ✅ Keep last 10 messages for context (performance balance)
- ✅ Always include system prompt as first message
- ✅ Include current date/time/day in system prompt
- ✅ Trim context window before sending to LLM

```typescript
// ✅ CORRECT
const getContextMessages = (conversationHistory: Message[]): Message[] => {
  const systemPrompt = conversationHistory[0] // Always keep
  const recentMessages = conversationHistory.slice(-10) // Last 10

  return [systemPrompt, ...recentMessages.filter(m => m.role !== 'system')]
}
```

**Conversation Persistence:**
- ✅ Persist to Supabase after each user/assistant turn
- ✅ Store full conversation history (not just context window)
- ✅ Include tool calls and results in history
- ✅ Handle persistence errors gracefully (don't block conversation)

```typescript
// ✅ CORRECT
private async persistConversation(): Promise<void> {
  try {
    await supabase
      .from('conversations')
      .upsert({
        id: this.sessionId,
        user_id: this.userId,
        messages: this.conversationHistory,
        updated_at: new Date().toISOString()
      })
  } catch (error) {
    // Log but don't throw - conversation continues in memory
    logger.error('ConversationEngine', error as Error, {
      operation: 'persistConversation',
      sessionId: this.sessionId
    })
  }
}
```

**System Prompt Guidelines:**
- ✅ Include current date, time, and day of week
- ✅ List available features/capabilities
- ✅ Set personality and tone
- ✅ Specify response format preferences
- ✅ Update system prompt when context changes

```typescript
// ✅ CORRECT
private getSystemPrompt(): string {
  const now = new Date()
  return `You are LifeSync AI, a personal assistant helping manage life.

Current date: ${now.toLocaleDateString()}
Current day: ${now.toLocaleDateString('en-US', { weekday: 'long' })}
Current time: ${now.toLocaleTimeString()}

You have access to tools for:
- Tasks & Projects
- Finance & Budgeting
- Habits & Streaks
- Shopping & Meal Planning
- Goals & Dreams
- Journal

Be conversational, natural, and proactive. Ask clarifying questions when needed.
Keep responses concise (2-3 sentences max).
When users mention things to track, use your tools to perform the actions immediately.`
}
```

### Testing AI Features

**AI Tool Testing:**
- ✅ Write unit tests for tool execute functions
- ✅ Mock Supabase calls in tests
- ✅ Test parameter validation
- ✅ Test error handling
- ✅ Test success responses

```typescript
// ✅ CORRECT
describe('taskTools', () => {
  describe('create_task', () => {
    it('should create task with valid parameters', async () => {
      const result = await taskTools[0].execute({
        title: 'Test task',
        priority: 'high'
      }, 'user-123')

      expect(result.success).toBe(true)
      expect(result.task).toBeDefined()
      expect(result.task.title).toBe('Test task')
    })

    it('should handle errors gracefully', async () => {
      // Mock Supabase to throw error
      const result = await taskTools[0].execute({ title: '' }, 'user-123')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
```

**Voice Interface Testing:**
- ✅ E2E tests for voice commands (using Playwright)
- ✅ Test voice recognition error handling
- ✅ Test text input fallback
- ✅ Test conversation flow

**Integration Testing:**
- ✅ Test full conversation flows
- ✅ Test multi-turn conversations
- ✅ Test tool chaining (one tool result feeds another)
- ✅ Test conversation persistence

---

## 📐 Architecture Patterns (Follow Strictly)

### State Management

**React Query** - For ALL server/database state:
- ✅ Tasks, habits, notes, journal, goals (from Supabase)
- ✅ Use hooks: `useTasks()`, `useCreateTask()`, etc.
- ✅ Let React Query handle caching, refetching, loading states
- ❌ DON'T put server data in Zustand

**Zustand** - ONLY for client/UI state:
- ✅ activeView, sidebarCollapsed
- ✅ Global UI settings (weekStartsOn, mealOptions)
- ✅ Toast notifications
- ✅ Ephemeral UI state
- ❌ DON'T put server data here

```typescript
// ❌ WRONG - Server data in Zustand
const useAppStore = create((set) => ({
  tasks: [],
  loadTasks: async () => { /* fetching from API */ }
}))

// ✅ CORRECT - Server data in React Query
const { data: tasks } = useTasksQuery()

// ✅ CORRECT - UI state in Zustand
const { activeView, setActiveView } = useAppStore()
```

### Feature Module Structure

Every feature should follow this structure:

```
/src/[feature]/
  /components/       - UI components
    /[feature]Card.tsx
    /[feature]Form.tsx
  /hooks/           - Custom hooks
    /use[feature]Query.ts
  /services/        - Business logic, parsers, utilities
    /[feature]Helpers.ts
  /types/           - TypeScript types/interfaces
    /index.ts
  /constants.ts     - Constants and enums
  /api/            - API layer (if needed)
    /[feature]API.ts
```

**Examples that follow this:**
- ✅ `src/habits/` - Perfect example
- ✅ `src/goals/` - Perfect example
- ✅ `src/projects/` - Perfect example
- ✅ `src/mealPlanning/` - Good example

### Layered Architecture

Code should flow in ONE direction:

```
Domain Layer (types, constants)
    ↓
Services Layer (business logic, parsers, helpers)
    ↓
Hooks Layer (React Query, custom hooks)
    ↓
Components Layer (UI rendering)
```

**Rules:**
- ❌ Components should NOT import from services directly (use hooks)
- ❌ Services should NOT import React hooks
- ✅ Each layer only imports from layers below
- ✅ No circular dependencies

## 📋 Workflow Rules

### Before Writing ANY Code

1. ✅ Read the existing code in the affected area
2. ✅ Understand current patterns and architecture
3. ✅ Check if similar code exists that can be reused
4. ✅ Show me a detailed plan
5. ✅ Wait for my approval
6. ✅ THEN execute

### When Adding a New Feature

**Process:**
1. Create types/interfaces first
2. Create services/utilities with business logic
3. Create React Query hooks (if server state)
4. Create UI components
5. Write tests alongside code
6. Update documentation
7. Manual smoke test

**Example Task:**

```markdown
## Feature: Add Habit Reminders

**Files to Create:**
- src/habits/types.ts - Add `reminder` field to Habit interface
- src/habits/services/reminderService.ts - Browser notification logic
- src/habits/hooks/useHabitReminders.ts - Hook to manage reminders
- src/habits/components/HabitReminderForm.tsx - UI to set reminders

**Acceptance Criteria:**
- [ ] User can set reminder time for a habit
- [ ] Browser notification shows at reminder time
- [ ] User can disable reminders
- [ ] Reminders persist across sessions
- [ ] TypeScript compiles
- [ ] Tests pass
- [ ] No `any` types
```

### When Refactoring

**CRITICAL**: Complete ONE module 100% before starting another.

**Definition of 100% Complete:**
- [ ] Code extracted to proper files
- [ ] All imports updated
- [ ] TypeScript compiles with no errors
- [ ] All tests pass
- [ ] No `any` types in new code
- [ ] Documentation updated
- [ ] Manual smoke test passed
- [ ] Git commit created

**Process:**
1. Create a detailed refactor plan showing:
   - Current state (file size, issues)
   - Target state (file structure, line counts)
   - What goes where
   - Testing strategy
2. Show me the plan
3. Wait for approval
4. Extract ONE category at a time (e.g., components, then hooks, then services)
5. After EACH category, verify tests pass
6. Show me completion checklist
7. Get approval before moving to next module

**Example:**

```markdown
## Refactor: LifeGoals.tsx

**Current State:**
- File: src/pages/LifeGoals.tsx
- Lines: 802
- Issues: Large file, mixed concerns

**Target State:**
- Main file: <300 lines (orchestration only)
- Extract to src/goals/:
  - /components/GoalCard.tsx (~150 lines)
  - /components/GoalForm.tsx (~100 lines)
  - /components/DreamCard.tsx (~100 lines)
  - /hooks/useGoalForm.ts (~80 lines)
  - /services/goalCalculations.ts (~100 lines)

**Approach:**
1. Extract GoalCard, DreamCard components
2. Extract GoalForm component
3. Extract useGoalForm hook
4. Extract goalCalculations service
5. Update main page to use extracted modules

**Acceptance Criteria:**
- [ ] LifeGoals.tsx <300 lines
- [ ] All tests pass
- [ ] No `any` types
- [ ] Can create/edit/delete goals and dreams
- [ ] Manual test completed
```

### Before Showing Me Results

**Pre-flight Checklist** (Run these EVERY time):

```bash
# 1. TypeScript compilation
npm run typecheck
# Must show: "Found 0 errors"

# 2. Linting
npm run lint
# Must show: "0 errors, 0 warnings"

# 3. Tests
npm test -- --run
# Must show: All tests passing

# 4. Check for 'any' types in files you modified
git diff --name-only | xargs grep -n ": any\|<any>\|as any" || echo "✓ No any types"
```

**If ANY of these fail, fix them before showing me the code.**

## 🎯 Code Quality Standards

### Naming Conventions

**Components:**
- ✅ PascalCase: `HabitCard`, `TaskList`, `RecipeForm`
- ✅ Descriptive: Name describes what it renders
- ✅ Suffix with type: `Card`, `Form`, `List`, `Modal`, `Page`

**Hooks:**
- ✅ Prefix with `use`: `useTasksQuery`, `useHabitForm`, `useRecipeImport`
- ✅ Query hooks: `use[Resource]Query`, `useCreate[Resource]`, `useUpdate[Resource]`
- ✅ Custom hooks: `use[Feature][Purpose]` - `useTaskFilters`, `useMealFormModals`

**Services/Utils:**
- ✅ camelCase: `calculateStreak`, `parseRecipe`, `formatDate`
- ✅ Pure functions when possible
- ✅ Descriptive verb-noun names: `validateHabit`, `transformApiTasks`

**Variables:**
- ✅ Descriptive names: `completedHabits`, `recipeDraft`, `selectedDate`
- ❌ Avoid generic: `data`, `item`, `thing`, `temp`, `x`, `result`
- ✅ Boolean variables: `isLoading`, `hasError`, `canEdit`, `shouldShow`

### Error Handling

**Always handle errors:**

```typescript
// ❌ WRONG - Silent failure
const data = await fetchRecipe(id)

// ❌ WRONG - Console error
try {
  const data = await fetchRecipe(id)
} catch (error) {
  console.error('Error:', error)
}

// ✅ CORRECT - Proper error handling
try {
  const data = await fetchRecipe(id)
  return data
} catch (error) {
  logger.error('RecipeService', error, { recipeId: id, operation: 'fetchRecipe' })
  throw new Error(`Failed to fetch recipe: ${error instanceof Error ? error.message : 'Unknown error'}`)
}
```

**User-facing errors:**
- ✅ Show friendly error messages
- ✅ Use toast notifications for temporary errors
- ✅ Use error states in UI for persistent errors
- ✅ Provide actionable guidance ("Try again" button)

### Performance

**Memoization:**
- ✅ Use `useMemo` for expensive calculations
- ✅ Use `useCallback` for functions passed as props
- ✅ Use `React.memo` for components that render frequently with same props

**Lists:**
- ✅ Always use `key` prop (stable IDs, not indexes)
- ✅ Virtualize lists with >100 items
- ✅ Paginate API responses

**Code Splitting:**
- ✅ All pages already lazy-loaded (keep this pattern)
- ✅ Lazy load heavy components (charts, maps)
- ✅ Dynamic imports for conditional features

### Accessibility

- ✅ Semantic HTML (`<button>`, `<nav>`, `<main>`, `<article>`)
- ✅ ARIA labels where needed
- ✅ Keyboard navigation support
- ✅ Focus management in modals
- ✅ Alt text for images
- ✅ Color contrast ratios (use design system colors)

## 🔄 Git & Commits

### Commit Strategy

**One logical change per commit:**
- ✅ Good: "refactor(habits): extract HabitCard component"
- ❌ Bad: "fixed stuff and added features"

**Conventional Commits Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring (no behavior change)
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `chore`: Tooling, dependencies, config

**Examples:**
```
feat(habits): add reminder notifications
fix(todos): correct drag-and-drop state update
refactor(meals): extract RecipeCard component to 192 lines
test(shopping): add comprehensive pantry tests
docs(readme): update installation instructions
```

### Before Every Commit

**Required checks:**
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (with `--max-warnings 0`)
- [ ] `npm test -- --run` passes
- [ ] No `any` types in changed files
- [ ] No `console.log` in changed files
- [ ] Updated relevant documentation

**These will be enforced by git hooks.**

## ❓ When to Ask vs. When to Proceed

### STOP and ASK ME if:

- ❓ You're unsure about the correct TypeScript type
- ❓ You're unsure which architecture pattern to use
- ❓ You're about to make a breaking change
- ❓ You need to change database schema
- ❓ You're about to delete code you didn't write
- ❓ The file is approaching 400 lines and you're unsure what to extract
- ❓ Tests are failing and you don't understand why
- ❓ You need to add a new dependency
- ❓ You're considering a significant performance optimization
- ❓ You're about to use a new library or API

### Proceed WITHOUT asking if:

- ✅ You're following established patterns in the codebase
- ✅ You're extracting code that clearly belongs together
- ✅ You're fixing obvious bugs
- ✅ You're adding tests
- ✅ You're updating documentation to match code
- ✅ You're applying these rules

**Default: When in doubt, ASK.**

## 🎓 Project-Specific Patterns

### React Query Patterns

**Query Hooks:**
```typescript
// File: src/hooks/use[Resource]Query.ts
export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: getTasks,
  })
}
```

**Mutation Hooks:**
```typescript
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
    },
  })
}
```

### Component Patterns

**Page Components** (Orchestrators):
```typescript
// Pages should be thin orchestrators
const HabitsPage: React.FC = () => {
  const { data: habits, isLoading } = useHabitsQuery()
  const createMutation = useCreateHabit()

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <HabitList habits={habits} />
      <AddHabitButton onCreate={createMutation.mutate} />
    </div>
  )
}
```

**Presentational Components:**
```typescript
// Components should be dumb and reusable
interface HabitCardProps {
  habit: Habit
  onComplete: () => void
  onEdit: () => void
  onDelete: () => void
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onComplete,
  onEdit,
  onDelete
}) => {
  // Just render, no business logic
  return (...)
}
```

### Service Patterns

**Pure Functions:**
```typescript
// Services should be pure, testable functions
export const calculateHabitStreak = (
  completions: HabitCompletion[],
  habitId: string
): number => {
  // Pure logic, no side effects
  const sorted = completions
    .filter(c => c.habitId === habitId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  let streak = 0
  let currentDate = new Date()

  for (const completion of sorted) {
    // ... streak calculation
  }

  return streak
}
```

## 📚 Documentation Requirements

### Update These When Changing Code:

**README.md** - If you add/remove features
**REFACTOR_PROGRESS.md** - If you complete refactoring work
**Architecture docs** - If you change patterns
**Component comments** - For complex components
**Function JSDoc** - For exported services/utilities

### JSDoc Format:

```typescript
/**
 * Calculate the current streak for a habit
 *
 * @param completions - All habit completions for the user
 * @param habitId - The habit to calculate streak for
 * @returns The current streak in days
 *
 * @example
 * const streak = calculateHabitStreak(completions, 'habit-123')
 * console.log(`Current streak: ${streak} days`)
 */
export const calculateHabitStreak = (
  completions: HabitCompletion[],
  habitId: string
): number => {
  // ...
}
```

## 🚀 Summary: The Golden Rules

1. **NO `any` TYPES. EVER.** If unsure of type, ask.
2. **Files <400 lines.** Extract before hitting limit.
3. **Tests must pass.** Fix immediately if they break.
4. **Use logger, not console.** Always.
5. **React Query for server state.** Zustand for UI only.
6. **Follow feature module structure.** Like habits/, goals/, projects/.
7. **Show me a plan before coding.** Wait for approval.
8. **Complete one thing 100% before starting another.** Definition of Done required.
9. **Run typecheck, lint, tests before showing code.** Every time.
10. **When uncertain, ASK.** Don't guess.

---

**Remember:** These rules exist to maintain code quality and prevent the "refactor treadmill" where we keep going back to fix the same issues. Following them makes everyone's life easier.

**If you (Claude) violate these rules, I (the user) will remind you of this file.**
