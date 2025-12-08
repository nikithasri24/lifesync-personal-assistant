# Check AI Infrastructure Health

Verify that AI/LLM infrastructure is healthy and properly configured.

## What This Command Does:

Runs comprehensive checks on:
- LLM provider configuration
- Conversation engine status
- Tool registry and tools
- Supabase conversations table
- Voice interface setup
- Environment variables

## Checks to Run:

### 1. Environment Variables

```bash
# Check required env vars are set
echo "Checking environment variables..."
if [ -z "$VITE_GROQ_API_KEY" ]; then
  echo "❌ VITE_GROQ_API_KEY not set"
else
  echo "✅ VITE_GROQ_API_KEY configured"
fi

if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "❌ VITE_SUPABASE_URL not set"
else
  echo "✅ VITE_SUPABASE_URL configured"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "❌ VITE_SUPABASE_ANON_KEY not set"
else
  echo "✅ VITE_SUPABASE_ANON_KEY configured"
fi
```

### 2. LLM Provider Check

Read and verify: `src/lib/providers/llm/groq.provider.ts`

Check for:
- ✅ Proper error handling
- ✅ Timeout configuration
- ✅ Retry logic
- ✅ Logging
- ✅ Type safety (no `any`)

### 3. Conversation Engine Check

Read and verify: `src/services/conversationEngine.ts`

Check for:
- ✅ Tools are registered
- ✅ System prompt is dynamic
- ✅ Conversation persistence works
- ✅ Error handling is robust
- ✅ Logging is comprehensive
- ✅ Context window management (last 10 messages)
- ✅ No hardcoded tools (should use registry)

### 4. Tool Registry Check

If tool registry exists (`src/lib/ai/toolRegistry.ts`):

Check for:
- ✅ Registry implementation complete
- ✅ All features have tools registered
- ✅ Tool schemas are valid
- ✅ Execute function handles errors
- ✅ Logging for tool execution

List all registered tools:
```typescript
import { toolRegistry } from '@/lib/ai/toolRegistry'

console.log('Registered tools:', toolRegistry.count())
console.log('Tools:')
toolRegistry.getAll().forEach(tool => {
  console.log(`  - ${tool.name}: ${tool.description}`)
})
```

### 5. Feature Tools Check

For each feature, check if tools exist:

```bash
echo "Checking feature tools..."

# Tasks
if [ -f "src/features/tasks/tools.ts" ] || [ -f "src/tasks/tools.ts" ]; then
  echo "✅ Tasks tools found"
else
  echo "⚠️  Tasks tools missing"
fi

# Finance
if [ -f "src/features/finance/tools.ts" ] || [ -f "src/finance/tools.ts" ]; then
  echo "✅ Finance tools found"
else
  echo "⚠️  Finance tools missing"
fi

# Habits
if [ -f "src/features/habits/tools.ts" ] || [ -f "src/habits/tools.ts" ]; then
  echo "✅ Habits tools found"
else
  echo "⚠️  Habits tools missing"
fi

# Shopping
if [ -f "src/features/shopping/tools.ts" ] || [ -f "src/shopping/tools.ts" ]; then
  echo "✅ Shopping tools found"
else
  echo "⚠️  Shopping tools missing"
fi

# Goals
if [ -f "src/features/goals/tools.ts" ] || [ -f "src/goals/tools.ts" ]; then
  echo "✅ Goals tools found"
else
  echo "⚠️  Goals tools missing"
fi

# Journal
if [ -f "src/features/journal/tools.ts" ] || [ -f "src/journal/tools.ts" ]; then
  echo "✅ Journal tools found"
else
  echo "⚠️  Journal tools missing"
fi
```

### 6. Supabase Conversations Table

Check migration exists:

```bash
echo "Checking Supabase conversations table..."

# Look for conversation migration
if ls supabase/migrations/*conversations* 1> /dev/null 2>&1; then
  echo "✅ Conversations migration found"
  ls supabase/migrations/*conversations*
else
  echo "⚠️  Conversations migration not found"
fi
```

Read schema to verify:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `messages` (JSONB)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- RLS policies

### 7. Voice Interface Check

Check files exist:
- `src/pages/Assistant.tsx` (main voice interface page)
- `src/hooks/useVoiceRecognition.ts` or similar

Verify:
- ✅ Web Speech API integration
- ✅ Transcript display
- ✅ Text input fallback
- ✅ Error handling
- ✅ Loading states

### 8. API Layer Check

For each feature with AI tools, verify API exists:

```bash
echo "Checking API layers..."

# Tasks
if [ -f "src/api/tasksAPI.ts" ]; then
  echo "✅ Tasks API found"
else
  echo "❌ Tasks API missing"
fi

# Add checks for other features
```

### 9. Type Safety Check

Run grep to find any `any` types in AI-related files:

```bash
echo "Checking for 'any' types in AI files..."

grep -rn ": any\|<any>\|as any" \
  src/services/conversationEngine.ts \
  src/lib/providers/llm/ \
  src/lib/ai/ \
  src/*/tools.ts \
  2>/dev/null || echo "✅ No 'any' types found"
```

### 10. Test Coverage Check

```bash
echo "Checking AI test coverage..."

# Tool registry tests
if [ -f "src/lib/ai/__tests__/toolRegistry.test.ts" ]; then
  echo "✅ ToolRegistry tests found"
else
  echo "⚠️  ToolRegistry tests missing"
fi

# Conversation engine tests
if [ -f "src/services/__tests__/conversationEngine.test.ts" ]; then
  echo "✅ ConversationEngine tests found"
else
  echo "⚠️  ConversationEngine tests missing"
fi

# Voice interface tests
if [ -f "src/pages/__tests__/Assistant.test.tsx" ]; then
  echo "✅ Assistant page tests found"
else
  echo "⚠️  Assistant page tests missing"
fi
```

## Output Report:

Generate a summary report:

```markdown
# AI Infrastructure Health Report

**Date:** [Current Date]

## Configuration
- [✅/❌] Groq API Key configured
- [✅/❌] Supabase configured
- [✅/❌] Environment variables complete

## Infrastructure
- [✅/❌] LLM Provider implemented
- [✅/❌] Conversation Engine working
- [✅/❌] Tool Registry implemented
- [✅/❌] Voice Interface implemented

## Tools Coverage
- Tasks: [✅/⚠️/❌]
- Finance: [✅/⚠️/❌]
- Habits: [✅/⚠️/❌]
- Shopping: [✅/⚠️/❌]
- Goals: [✅/⚠️/❌]
- Journal: [✅/⚠️/❌]

**Total Tools Registered:** X

## Database
- [✅/❌] Conversations table exists
- [✅/❌] RLS policies configured

## Code Quality
- [✅/❌] No 'any' types in AI code
- [✅/❌] Comprehensive logging
- [✅/❌] Error handling implemented

## Testing
- [✅/❌] Tool registry tests
- [✅/❌] Conversation engine tests
- [✅/❌] Voice interface tests

## Issues Found:
- [List any issues]

## Recommendations:
- [List recommendations]
```

## Quick Health Check Script:

Create a script that can be run:

```bash
#!/bin/bash
# .claude/scripts/check-ai-health.sh

echo "🔍 AI Infrastructure Health Check"
echo "================================="
echo ""

# Run all checks above
# Output colored results
# Generate summary report
```

## Usage:

```bash
# From project root
./.claude/scripts/check-ai-health.sh

# Or via npm script (add to package.json)
npm run check:ai
```

## Definition of Success:

All checks should show ✅ for a healthy AI infrastructure:
- Environment configured
- LLM provider working
- Conversation engine functional
- Tools registered for all features
- Database schema correct
- Voice interface working
- No `any` types
- Tests passing
