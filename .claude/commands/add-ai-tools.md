# Add AI Tools for Existing Feature

Add AI voice/conversational tools for an existing feature without rebuilding the feature itself.

## Process:

1. **Identify the feature** (e.g., tasks, habits, finance, shopping, meals, goals, journal)
   - Ask which feature if not specified

2. **Read existing implementation:**
   - API layer: `src/api/{feature}API.ts` or `src/{feature}/api/`
   - Store slice: `src/stores/slices/{feature}Slice.ts`
   - Types: `src/{feature}/types/` or `src/api/types.ts`
   - UI components: `src/pages/` or `src/{feature}/components/`

3. **Create tools file:**
   - Location: `src/{feature}/tools.ts`
   - Export array of tools following Tool interface
   - Import from conversation engine types

4. **Implement each tool:**
   - Use snake_case naming (e.g., `create_task`, `get_habits`)
   - Write clear descriptions for LLM
   - Define Zod schemas for parameters
   - Use existing API functions (don't rewrite them!)
   - Return structured responses with success/error
   - Log all operations with logger
   - Handle errors gracefully (no throws)

5. **Register tools:**
   - Update `src/services/conversationEngine.ts`
   - Import tool array
   - Add to tools list in constructor or initialization

6. **Test with voice commands:**
   - Start dev server
   - Navigate to Assistant page
   - Test multiple natural language variations
   - Test error cases
   - Test edge cases

7. **Write tests:**
   - Unit tests for each tool's execute function
   - Mock Supabase/API calls
   - Test validation, success, and error cases

## Example Tool Structure:

```typescript
// src/{feature}/tools.ts
import { z } from 'zod'
import { Tool } from '@/services/conversationEngine'
import { create{Feature}, get{Features} } from '@/api/{feature}API'
import { logger } from '@/lib/logger'

// Zod schemas
const createSchema = z.object({
  // Define parameters with validation
})

const getSchema = z.object({
  // Define filters/parameters
})

export const {feature}Tools: Tool[] = [
  {
    name: 'create_{feature}',
    description: 'Clear description for LLM including params and return value',
    parameters: createSchema,
    execute: async (args, userId) => {
      try {
        const result = await create{Feature}({ ...args, userId })
        return {
          success: true,
          data: result,
          message: 'Operation successful'
        }
      } catch (error) {
        logger.error('{Feature}Tools', error as Error, {
          operation: 'create_{feature}',
          userId
        })
        return {
          success: false,
          error: 'User-friendly error message'
        }
      }
    }
  },
  // ... more tools
]
```

## Important Rules:

- ❌ DO NOT rebuild existing API functions
- ❌ DO NOT rebuild existing UI components
- ❌ DO NOT break existing tests
- ✅ DO reuse existing API/service functions
- ✅ DO follow existing patterns in codebase
- ✅ DO preserve all existing functionality
- ✅ DO test both voice and text input
- ✅ DO run typecheck, lint, tests before showing results

## Voice Command Testing Examples:

For Tasks:
- "Add a task to buy groceries"
- "What tasks do I have due today?"
- "Mark the groceries task as complete"
- "Delete the task about laundry"

For Habits:
- "Log my workout habit for today"
- "What's my current meditation streak?"
- "Show me all my habits"
- "Did I complete exercise this week?"

For Finance:
- "Log a $45 expense for groceries"
- "How much did I spend this month?"
- "What did I spend on food category?"
- "Show my budget for dining out"

## Definition of Done:

- [ ] Tools file created in `src/{feature}/tools.ts`
- [ ] All common operations have tools (create, get, update, delete)
- [ ] Zod schemas defined for all parameters
- [ ] Tools use existing API functions (no duplication)
- [ ] Tools registered in conversation engine
- [ ] Error handling with user-friendly messages
- [ ] Structured logging for all operations
- [ ] Tested with multiple voice command variations
- [ ] Unit tests written and passing
- [ ] TypeScript compiles with no errors
- [ ] No `any` types used
- [ ] Documentation updated if needed
