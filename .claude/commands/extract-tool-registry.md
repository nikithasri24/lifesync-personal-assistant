# Extract Tool Registry from Conversation Engine

Extract the hardcoded AI tools from conversationEngine.ts into a modular tool registry system.

## Goal:

Transform from hardcoded tools in one file to a modular, extensible tool registry where each feature manages its own tools.

## Current State Analysis:

1. **Read conversation engine:**
   - File: `src/services/conversationEngine.ts`
   - Identify all hardcoded tools
   - Understand current tool interface
   - Note how tools are called

2. **Catalog existing tools:**
   - List all tool names
   - Map tools to features (tasks, finance, habits, etc.)
   - Identify tool dependencies
   - Note any shared utilities

## Implementation Steps:

### Step 1: Create Tool Registry Infrastructure

Create: `src/lib/ai/toolRegistry.ts`

```typescript
import { logger } from '@/lib/logger'

export interface ToolParameter {
  type: string
  description: string
  required?: boolean
  enum?: string[]
  properties?: Record<string, ToolParameter>
  items?: ToolParameter
}

export interface Tool {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, ToolParameter>
    required?: string[]
  }
  execute: (args: any, userId: string) => Promise<any>
}

class ToolRegistry {
  private tools: Map<string, Tool> = new Map()

  register(tools: Tool[]): void {
    tools.forEach(tool => {
      if (this.tools.has(tool.name)) {
        logger.warn('ToolRegistry', `Tool "${tool.name}" already registered, overwriting`)
      }
      this.tools.set(tool.name, tool)
      logger.debug('ToolRegistry', `Registered tool: ${tool.name}`)
    })
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values())
  }

  getAllSchemas(): Array<{ name: string; description: string; parameters: any }> {
    return this.getAll().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }))
  }

  async execute(name: string, args: any, userId: string): Promise<any> {
    const tool = this.tools.get(name)

    if (!tool) {
      throw new Error(`Tool not found: ${name}`)
    }

    logger.info('ToolRegistry', `Executing tool: ${name}`, { userId })
    const startTime = Date.now()

    try {
      const result = await tool.execute(args, userId)
      const duration = Date.now() - startTime

      logger.info('ToolRegistry', `Tool execution successful: ${name}`, {
        duration,
        userId
      })

      return result
    } catch (error) {
      logger.error('ToolRegistry', error as Error, {
        toolName: name,
        userId,
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  clear(): void {
    this.tools.clear()
  }

  count(): number {
    return this.tools.size
  }
}

export const toolRegistry = new ToolRegistry()
```

### Step 2: Extract Tools by Feature

For each feature that has tools in conversation engine:

**Tasks:**
Create: `src/features/tasks/tools.ts` or `src/tasks/tools.ts`

```typescript
import { z } from 'zod'
import { Tool } from '@/lib/ai/toolRegistry'
import { createTask, getTasks, updateTask, deleteTask } from '@/api/tasksAPI'
import { logger } from '@/lib/logger'

// Zod schemas for validation
const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional()
})

// Convert Zod to Tool parameter format
const createTaskParams = {
  type: 'object' as const,
  properties: {
    title: { type: 'string', description: 'Task title' },
    description: { type: 'string', description: 'Task description' },
    priority: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description: 'Task priority'
    },
    dueDate: { type: 'string', description: 'Due date in ISO format' }
  },
  required: ['title']
}

export const taskTools: Tool[] = [
  {
    name: 'create_task',
    description: 'Create a new task. Requires title, optional description, priority, and dueDate.',
    parameters: createTaskParams,
    execute: async (args, userId) => {
      try {
        // Validate with Zod
        const validated = createTaskSchema.parse(args)

        const task = await createTask({ ...validated, userId })

        return {
          success: true,
          task,
          message: `Created task: ${task.title}`
        }
      } catch (error) {
        logger.error('TaskTools', error as Error, {
          operation: 'create_task',
          userId
        })

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create task'
        }
      }
    }
  },
  // ... more task tools
]
```

Repeat for:
- **Finance:** `src/features/finance/tools.ts` or `src/finance/tools.ts`
- **Habits:** `src/features/habits/tools.ts` or `src/habits/tools.ts`
- **Shopping:** `src/features/shopping/tools.ts` or `src/shopping/tools.ts`
- **Goals:** `src/features/goals/tools.ts` or `src/goals/tools.ts`
- **Journal:** `src/features/journal/tools.ts` or `src/journal/tools.ts`

### Step 3: Update Conversation Engine

Update: `src/services/conversationEngine.ts`

```typescript
import { toolRegistry } from '@/lib/ai/toolRegistry'
import { taskTools } from '@/features/tasks/tools'
import { financeTools } from '@/features/finance/tools'
import { habitTools } from '@/features/habits/tools'
// ... import other tools

export class ConversationEngine {
  private conversationHistory: Message[] = []
  private userId: string
  private sessionId: string

  constructor(userId: string, sessionId?: string) {
    this.userId = userId
    this.sessionId = sessionId || crypto.randomUUID()

    // Register all tools
    this.initializeTools()

    // Initialize with system prompt
    this.conversationHistory.push({
      id: crypto.randomUUID(),
      role: 'system',
      content: this.getSystemPrompt(),
      timestamp: Date.now()
    })

    logger.info('ConversationEngine', 'Initialized', {
      userId,
      sessionId: this.sessionId,
      toolCount: toolRegistry.count()
    })
  }

  private initializeTools(): void {
    toolRegistry.register([
      ...taskTools,
      ...financeTools,
      ...habitTools,
      // ... other tools
    ])
  }

  async sendMessage(userMessage: string): Promise<string> {
    // ... existing implementation, but use toolRegistry

    // When getting tools for LLM
    const tools = toolRegistry.getAllSchemas()

    // When executing a tool
    const result = await toolRegistry.execute(toolName, toolArgs, this.userId)

    // ... rest of implementation
  }
}
```

### Step 4: Update System Prompt

Update the system prompt to reflect registered tools:

```typescript
private getSystemPrompt(): string {
  const now = new Date()
  const tools = toolRegistry.getAll()
  const features = new Set(tools.map(t => t.name.split('_')[1]))

  return `You are LifeSync AI, a personal assistant helping manage life.

Current date: ${now.toLocaleDateString()}
Current day: ${now.toLocaleDateString('en-US', { weekday: 'long' })}
Current time: ${now.toLocaleTimeString()}

You have ${tools.length} tools available for:
${Array.from(features).map(f => `- ${f.charAt(0).toUpperCase() + f.slice(1)}`).join('\n')}

Be conversational, natural, and proactive. Use your tools to help the user.
Keep responses concise (2-3 sentences max).`
}
```

## Testing Strategy:

### Unit Tests for Tool Registry:

Create: `src/lib/ai/__tests__/toolRegistry.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { toolRegistry } from '../toolRegistry'

describe('ToolRegistry', () => {
  beforeEach(() => {
    toolRegistry.clear()
  })

  it('should register tools', () => {
    const testTool = {
      name: 'test_tool',
      description: 'Test',
      parameters: { type: 'object', properties: {} },
      execute: async () => ({ success: true })
    }

    toolRegistry.register([testTool])

    expect(toolRegistry.count()).toBe(1)
    expect(toolRegistry.get('test_tool')).toBeDefined()
  })

  it('should execute registered tool', async () => {
    const testTool = {
      name: 'test_tool',
      description: 'Test',
      parameters: { type: 'object', properties: {} },
      execute: async (args, userId) => ({ success: true, userId })
    }

    toolRegistry.register([testTool])

    const result = await toolRegistry.execute('test_tool', {}, 'user-123')

    expect(result.success).toBe(true)
    expect(result.userId).toBe('user-123')
  })

  it('should throw on unknown tool', async () => {
    await expect(
      toolRegistry.execute('unknown_tool', {}, 'user-123')
    ).rejects.toThrow('Tool not found')
  })
})
```

### Integration Tests:

Test that conversation engine works with new registry:

```typescript
describe('ConversationEngine with ToolRegistry', () => {
  it('should execute tools through registry', async () => {
    const engine = new ConversationEngine('user-123')

    const response = await engine.sendMessage('Create a task to buy milk')

    expect(response).toContain('Created task')
    // Verify tool was called
    // Verify task was created
  })
})
```

## Migration Checklist:

- [ ] Create ToolRegistry class in `src/lib/ai/toolRegistry.ts`
- [ ] Extract tasks tools to `src/features/tasks/tools.ts`
- [ ] Extract finance tools to `src/features/finance/tools.ts`
- [ ] Extract habits tools to `src/features/habits/tools.ts`
- [ ] Extract remaining tools to appropriate locations
- [ ] Update ConversationEngine to use ToolRegistry
- [ ] Update system prompt to be dynamic
- [ ] Write unit tests for ToolRegistry
- [ ] Write integration tests
- [ ] Test all existing voice commands still work
- [ ] Verify logging works correctly
- [ ] Run full test suite - all tests pass
- [ ] TypeScript compiles with no errors
- [ ] No `any` types used
- [ ] Manual smoke test of voice interface

## Important Rules:

- ❌ DO NOT change tool functionality during extraction
- ❌ DO NOT break existing voice commands
- ❌ DO NOT skip validation (use Zod)
- ✅ DO preserve exact tool behavior
- ✅ DO add comprehensive logging
- ✅ DO write tests for new infrastructure
- ✅ DO test that all existing tools still work
- ✅ DO ensure TypeScript types are correct

## Benefits of This Refactor:

1. **Modularity**: Each feature manages its own tools
2. **Scalability**: Easy to add new tools
3. **Testability**: Tools can be tested independently
4. **Maintainability**: Clear separation of concerns
5. **Discoverability**: Tools are organized by feature
6. **Type Safety**: Better TypeScript support
7. **Logging**: Centralized tool execution logging

## Definition of Done:

- [ ] ToolRegistry class fully implemented
- [ ] All existing tools extracted to feature folders
- [ ] ConversationEngine updated to use registry
- [ ] All existing voice commands work
- [ ] Comprehensive tests written and passing
- [ ] TypeScript compiles with no errors
- [ ] No regressions in voice interface
- [ ] Documentation updated
- [ ] Logging is comprehensive
- [ ] No `any` types used
