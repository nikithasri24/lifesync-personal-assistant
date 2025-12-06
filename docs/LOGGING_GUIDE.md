# Logging Guide

## Overview

LifeSync uses a centralized logging service for consistent, environment-aware logging throughout the application. All 74 React Query mutation hooks across 10 data domains now include comprehensive logging.

---

## Logger Service

### Location
`src/services/logger.ts`

### Features
- **Environment-aware**: Only logs in development mode by default
- **Consistent formatting**: Timestamp, log level, domain, and message
- **Type-safe**: Full TypeScript support with LogLevel enum
- **Extensible**: Ready for production error tracking (Sentry, LogRocket)
- **Performance**: Zero overhead in production for debug/info logs

---

## Log Levels

| Level | When to Use | Example | Production Behavior |
|-------|-------------|---------|---------------------|
| **DEBUG** | Operation start, optimistic updates, detailed flow | Creating item, cache updates | Silent |
| **INFO** | Successful operations, important events | Item created successfully | Silent |
| **WARN** | Warnings, deprecated usage, recoverable errors | Missing optional field | Logged & sent to error tracking |
| **ERROR** | Failures, exceptions, critical issues | API call failed, validation error | Logged & sent to error tracking |

---

## Usage in React Query Hooks

### Standard Pattern

All 74 mutation hooks follow this consistent pattern:

```typescript
import { logger } from '@/services/logger';

export function useCreateItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInput) => {
      logger.debug('DomainName', 'Creating item', { input });
      const result = await api.createItem(input);
      return mapToItem(result);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: keys.list() });
      const previous = queryClient.getQueryData(keys.list());

      logger.debug('DomainName', 'Optimistic update: creating item', { input });

      const optimistic = { id: `temp-${Date.now()}`, ...input };
      queryClient.setQueryData(keys.list(), (old) => [...(old || []), optimistic]);

      return { previous };
    },
    onSuccess: (newItem, input) => {
      logger.info('DomainName', 'Item created successfully', {
        id: newItem.id,
        name: newItem.name
      });

      queryClient.setQueryData(keys.list(), (old) =>
        (old || []).map((item) => (item.id.startsWith('temp-') ? newItem : item))
      );
    },
    onError: (error: Error, input, context) => {
      logger.error('DomainName', 'Failed to create item', {
        error: error.message,
        input
      });

      if (context?.previous) {
        queryClient.setQueryData(keys.list(), context.previous);
      }
    },
  });
}
```

---

## Domain Coverage

### All 10 Domains Implemented

| Domain | File | Mutations | Domain Name |
|--------|------|-----------|-------------|
| **Tasks** | `src/hooks/useTasksQuery.ts` | 9 hooks | `'Tasks'` |
| **Habits** | `src/hooks/useHabitsQuery.ts` | 8 hooks | `'Habits'` |
| **Focus** | `src/hooks/useFocusQuery.ts` | 2 hooks | `'Focus'` |
| **Notes** | `src/hooks/useNotesQuery.ts` | 3 hooks | `'Notes'` |
| **Journal** | `src/hooks/useJournalQuery.ts` | 3 hooks | `'Journal'` |
| **Goals** | `src/goals/hooks/useLifeGoalsQuery.ts` | 12 hooks | `'Goals'` |
| **Finance** | `src/finance/hooks/useFinanceQuery.ts` | 16 hooks | `'Finance'` |
| **Projects** | `src/projects/hooks/useProjectsQuery.ts` | 3 hooks | `'Projects'` |
| **Meal Planning** | `src/mealPlanning/hooks/useMealPlanningQuery.ts` | 13 hooks | `'MealPlanning'` |
| **Shopping** | `src/hooks/useShoppingQuery.ts` | 5 hooks | `'Shopping'` |
| **TOTAL** | - | **74 hooks** | - |

---

## API Reference

### Logger Methods

#### debug(domain, message, context?)
Log debug information (development only)
```typescript
logger.debug('Tasks', 'Fetching tasks', { filter: 'active' });
```

#### info(domain, message, context?)
Log informational messages (development only)
```typescript
logger.info('Tasks', 'Task created successfully', { id: '123', name: 'New Task' });
```

#### warn(domain, message, context?)
Log warnings (development + production)
```typescript
logger.warn('Tasks', 'Missing optional field', { field: 'description' });
```

#### error(domain, error, context?)
Log errors (development + production)
```typescript
logger.error('Tasks', 'Failed to create task', { error: error.message, input });
```

#### api(method, url, data?)
Log API requests (development only)
```typescript
logger.api('POST', '/api/tasks', { name: 'New Task' });
```

#### apiResponse(method, url, status, data?)
Log API responses (development only)
```typescript
logger.apiResponse('POST', '/api/tasks', 201, { id: '123' });
```

#### perf(domain, operation, durationMs)
Log performance metrics (development only)
```typescript
logger.perf('Tasks', 'fetchTasks', 145);
```

#### group(label) / groupEnd()
Group related logs together (development only)
```typescript
logger.group('Creating task with subtasks');
logger.debug('Tasks', 'Creating parent task');
logger.debug('Tasks', 'Creating 3 subtasks');
logger.groupEnd();
```

---

## Logging Context

### What to Include

**Good Context Examples:**
```typescript
// Create operations
logger.debug('Tasks', 'Creating task', {
  name: input.name,
  projectId: input.projectId
});

// Success logging
logger.info('Tasks', 'Task created successfully', {
  id: newTask.id,
  name: newTask.name
});

// Error logging
logger.error('Tasks', 'Failed to create task', {
  error: error.message,
  input: input.name, // Don't log sensitive data
  timestamp: new Date().toISOString()
});
```

### What NOT to Include

❌ **Avoid Logging Sensitive Data:**
- Passwords
- API keys
- Personal identification numbers
- Full credit card numbers
- Authentication tokens

❌ **Avoid Logging Excessive Data:**
- Entire large objects (use specific fields)
- Binary data
- Circular references

---

## Development Workflow

### Viewing Logs

1. **Open DevTools Console** (`Cmd+Option+J` on Mac, `F12` on Windows)
2. **Filter by domain**: Use browser console filters
   - Example: Filter for `[Tasks]` to see only Tasks domain logs
3. **React Query DevTools**: View cache state alongside logs

### Log Format

```
[2025-01-20T10:30:45.123Z] [DEBUG] [Tasks] Creating task { name: "New Task" }
[2025-01-20T10:30:45.456Z] [INFO] [Tasks] Task created successfully { id: "123", name: "New Task" }
```

### Debugging Common Issues

**Issue**: No logs appearing
- Check you're in development mode (`import.meta.env.DEV === true`)
- Verify browser console is open
- Check console filters aren't hiding logs

**Issue**: Too many logs
- Use domain filters in console
- Temporarily comment out debug logs
- Focus on info/warn/error levels

**Issue**: Need more context
- Add relevant fields to context object
- Use `logger.group()` for complex operations

---

## Production Readiness

### Error Tracking Integration

The logger service is ready for production error tracking. To integrate with Sentry:

```typescript
// src/services/logger.ts

private sendToErrorTracking(
  level: LogLevel,
  domain: string,
  message: string,
  context?: LogContext
): void {
  if (isProd && (level === LogLevel.ERROR || level === LogLevel.WARN)) {
    // Sentry integration
    Sentry.captureMessage(message, {
      level: level.toLowerCase() as Sentry.SeverityLevel,
      tags: { domain },
      extra: context,
    });
  }
}
```

### Production Behavior

| Log Level | Console | Error Tracking |
|-----------|---------|----------------|
| DEBUG | Silent | No |
| INFO | Silent | No |
| WARN | Logged | Yes |
| ERROR | Logged | Yes |

---

## Best Practices

### ✅ Do

1. **Use appropriate log levels**
   - Debug for detailed flow
   - Info for successful operations
   - Warn for recoverable issues
   - Error for failures

2. **Include meaningful context**
   - IDs, names, relevant parameters
   - Error messages
   - Timestamps when needed

3. **Log at mutation lifecycle stages**
   - mutationFn: debug with input
   - onMutate: debug optimistic update
   - onSuccess: info with result
   - onError: error with context

4. **Use domain-specific prefixes**
   - Consistent naming: 'Tasks', 'Habits', 'Finance'
   - Makes filtering easier

5. **Keep messages concise but clear**
   - "Creating task" ✅
   - "About to create a new task in the database" ❌

### ❌ Don't

1. **Don't log sensitive data**
   - No passwords, tokens, or PII
   - Sanitize before logging

2. **Don't use console.log directly**
   - Always use logger service
   - Maintains consistency

3. **Don't log in tight loops**
   - Avoid logging in map/filter/reduce
   - Log summary instead

4. **Don't ignore TypeScript errors**
   - Logger is fully typed
   - Fix type issues, don't suppress

5. **Don't log entire objects**
   - Pick specific fields
   - Avoid circular references

---

## Examples by Domain

### Tasks
```typescript
logger.debug('Tasks', 'Creating task', { name: input.name, projectId });
logger.info('Tasks', 'Task created', { id: task.id, name: task.name });
logger.error('Tasks', 'Failed to create task', { error: error.message });
```

### Habits
```typescript
logger.debug('Habits', 'Recording habit entry', { habitId, date });
logger.info('Habits', 'Habit entry recorded', { id: entry.id, habitName });
logger.error('Habits', 'Failed to record entry', { error: error.message });
```

### Finance
```typescript
logger.debug('Finance', 'Creating transaction', { amount, categoryId });
logger.info('Finance', 'Transaction created', { id, amount, category });
logger.error('Finance', 'Transaction failed', { error: error.message });
```

### Meal Planning
```typescript
logger.debug('MealPlanning', 'Creating recipe', { name: input.name });
logger.info('MealPlanning', 'Recipe created', { id, name, servings });
logger.error('MealPlanning', 'Recipe creation failed', { error: error.message });
```

---

## Troubleshooting

### Common Issues

**Problem**: Logs not appearing in console
- **Solution**: Ensure you're in development mode and console is open

**Problem**: TypeScript errors on logger import
- **Solution**: Check import path: `import { logger } from '@/services/logger';`

**Problem**: Too verbose output
- **Solution**: Use console filters or temporarily disable debug logs

**Problem**: Need to log in production
- **Solution**: Use `logger.warn()` or `logger.error()` - they work in production

**Problem**: Circular reference error
- **Solution**: Only log specific fields, not entire objects

---

## Migration from console.log

### Before (Direct console.log)
```typescript
console.log('Creating task:', task);
console.error('Error:', error);
```

### After (Logger Service)
```typescript
logger.debug('Tasks', 'Creating task', { name: task.name, id: task.id });
logger.error('Tasks', 'Failed to create task', { error: error.message });
```

### Benefits
- Environment-aware (no logs in production)
- Consistent formatting
- Better debugging with domains
- Ready for error tracking
- TypeScript safety

---

## Summary

✅ **74 mutation hooks** across 10 domains now have comprehensive logging
✅ **Consistent pattern** across all domains
✅ **Type-safe** with full TypeScript support
✅ **Production-ready** with error tracking integration
✅ **Zero overhead** in production for debug/info logs
✅ **Better debugging** with domain filtering and context

The logging system is now fully integrated and ready to help debug issues, monitor operations, and track errors in both development and production! 🚀
