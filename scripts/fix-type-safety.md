# Type Safety Violation Fixing Guide

## Overview

**Total type safety violations:** ~6,392
- `no-unsafe-member-access`: 2,468
- `no-unsafe-assignment`: 1,396
- `no-unsafe-call`: 886
- `no-unsafe-argument`: 346
- `no-explicit-any`: 408
- `no-unsafe-return`: 212

## Root Causes

### 1. Third-Party Libraries Without Types

**Problem:** Libraries like Commander.js don't have complete type definitions

**Solution:** Create custom type declarations

```typescript
// src/types/commander.d.ts
import { Command as CommanderCommand } from 'commander'

declare module 'commander' {
  interface Command {
    opts<T = any>(): T
    // Add other missing methods
  }
}
```

### 2. `any` Type Propagation

**Problem:** One `any` infects everything it touches

```typescript
// This creates unsafe operations everywhere
const data: any = await fetch(...)

data.foo // unsafe-member-access
const x = data.bar // unsafe-assignment
data.method() // unsafe-call
```

**Solution:** Use proper types or `unknown` with type guards

```typescript
// Option 1: Proper types
interface ApiResponse {
  foo: string
  bar: number
  method: () => void
}
const data: ApiResponse = await fetch(...)

// Option 2: unknown with type guards
const data: unknown = await fetch(...)

function isApiResponse(val: unknown): val is ApiResponse {
  return (
    typeof val === 'object' &&
    val !== null &&
    'foo' in val &&
    typeof val.foo === 'string'
  )
}

if (isApiResponse(data)) {
  data.foo // ✅ Safe!
}
```

## Systematic Fixing Strategy

### Phase 1: Type the Entry Points

Fix `any` types at **source** (APIs, external data):

**Files to target:**
```bash
# Find all uses of 'any' type
grep -r ": any\|<any>\|as any" src --include="*.ts" --include="*.tsx" | \
  grep -v test | \
  cut -d: -f1 | \
  sort -u > scripts/output/files-with-any.txt
```

**Priority order:**
1. API client files (`src/api/*.ts`)
2. Service adapters (`src/services/*.ts`)
3. External library wrappers
4. Data transformers

### Phase 2: Create Type Guards

**Template:**
```typescript
// src/types/guards.ts

export function isUser(val: unknown): val is User {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'name' in val &&
    typeof (val as any).id === 'string' &&
    typeof (val as any).name === 'string'
  )
}

export function isUserArray(val: unknown): val is User[] {
  return Array.isArray(val) && val.every(isUser)
}
```

### Phase 3: Replace `any` with `unknown`

**Before:**
```typescript
const data: any = JSON.parse(input)
return data.users // unsafe
```

**After:**
```typescript
const data: unknown = JSON.parse(input)

if (isApiData(data)) {
  return data.users // ✅ safe!
}

throw new Error('Invalid API response')
```

### Phase 4: Type Third-Party Libraries

#### Commander.js (CLI)

**Create:** `src/types/commander-ext.d.ts`

```typescript
import type { Command } from 'commander'

export interface TaskCommandOptions {
  list?: boolean
  add?: string
  complete?: string
  delete?: string
  project?: string
  priority?: string
  due?: string
}

export interface MealCommandOptions {
  date?: string
  type?: string
  servings?: string
  people?: string
  notes?: string
}

// Extend Command type
declare module 'commander' {
  interface Command {
    opts<T = Record<string, unknown>>(): T
    processedArgs: unknown[]
  }
}
```

**Usage:**
```typescript
// Before
const options = program.opts() // type: any
const value = options.someField // unsafe

// After
import type { TaskCommandOptions } from '@/types/commander-ext'

const options = program.opts<TaskCommandOptions>()
const value = options.list // ✅ type: boolean | undefined
```

#### Other Libraries

**Pattern:**
```typescript
// src/types/<library>-ext.d.ts

declare module '<library-name>' {
  export interface MissingInterface {
    // Add types
  }

  export function missingFunction(): ReturnType
}
```

## Automated Scripts

### Script 1: Find `any` Hotspots

```bash
#!/bin/bash
# scripts/find-any-hotspots.sh

echo "🔍 Finding files with most 'any' usage..."

# Count 'any' occurrences per file
find src -name "*.ts" -o -name "*.tsx" | \
  grep -v test | \
  while read file; do
    count=$(grep -c ": any\|<any>\|as any" "$file" 2>/dev/null || echo 0)
    if [ "$count" -gt 0 ]; then
      echo "$count $file"
    fi
  done | \
  sort -rn | \
  head -20 > scripts/output/any-hotspots.txt

echo "Top 20 files with 'any' usage:"
cat scripts/output/any-hotspots.txt
```

### Script 2: Generate Type Guards

```bash
#!/bin/bash
# scripts/generate-type-guards.sh

INTERFACE_NAME=$1

if [ -z "$INTERFACE_NAME" ]; then
  echo "Usage: $0 <InterfaceName>"
  exit 1
fi

# Generate type guard template
cat > "src/types/guards/${INTERFACE_NAME}Guard.ts" <<EOF
import type { ${INTERFACE_NAME} } from '@/types'

export function is${INTERFACE_NAME}(val: unknown): val is ${INTERFACE_NAME} {
  return (
    typeof val === 'object' &&
    val !== null &&
    // TODO: Add property checks
    // 'propertyName' in val &&
    // typeof (val as any).propertyName === 'expectedType'
    true
  )
}

export function is${INTERFACE_NAME}Array(val: unknown): val is ${INTERFACE_NAME}[] {
  return Array.isArray(val) && val.every(is${INTERFACE_NAME})
}
EOF

echo "✅ Created src/types/guards/${INTERFACE_NAME}Guard.ts"
echo "   Edit file and add property checks"
```

### Script 3: Replace `any` with `unknown`

```bash
#!/bin/bash
# scripts/replace-any-with-unknown.sh

FILE=$1

if [ -z "$FILE" ]; then
  echo "Usage: $0 <file-path>"
  exit 1
fi

# Backup
cp "$FILE" "$FILE.backup"

# Replace common patterns
# Note: This is a simple regex, review changes carefully!
sed -i '' 's/: any\b/: unknown/g' "$FILE"
sed -i '' 's/<any>/<unknown>/g' "$FILE"

echo "✅ Replaced 'any' with 'unknown' in $FILE"
echo "   Review changes and add type guards where needed"
echo "   Backup saved as $FILE.backup"
```

## Common Patterns & Solutions

### Pattern 1: API Response

**Before:**
```typescript
async function fetchUsers(): Promise<any> {
  const response = await fetch('/api/users')
  return response.json()
}

const users = await fetchUsers()
users.forEach(u => console.log(u.name)) // unsafe
```

**After:**
```typescript
interface User {
  id: string
  name: string
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users')
  const data: unknown = await response.json()

  if (!isUserArray(data)) {
    throw new Error('Invalid API response')
  }

  return data
}

const users = await fetchUsers()
users.forEach(u => console.log(u.name)) // ✅ safe
```

### Pattern 2: Event Handlers

**Before:**
```typescript
const handleChange = (e: any) => {
  const value = e.target.value // unsafe
  setValue(value)
}
```

**After:**
```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
  const value = e.target.value // ✅ safe
  setValue(value)
}
```

### Pattern 3: Function Parameters

**Before:**
```typescript
function processData(data: any) {
  return data.items.map((item: any) => item.id)
}
```

**After:**
```typescript
interface DataWithItems {
  items: Array<{ id: string }>
}

function processData(data: DataWithItems): string[] {
  return data.items.map(item => item.id)
}
```

### Pattern 4: Destructuring

**Before:**
```typescript
const { foo, bar }: any = someObject
```

**After:**
```typescript
interface SomeObject {
  foo: string
  bar: number
}

const { foo, bar }: SomeObject = someObject as SomeObject
// Or better: type the source
const someObject: SomeObject = getSomeObject()
const { foo, bar } = someObject
```

## Daily Workflow

**Week 1: API & Services** (~1,000 fixes)
```bash
# Day 1: Find hotspots
./scripts/find-any-hotspots.sh

# Day 2-3: Type API responses
# For each API file:
# 1. Define response interfaces
# 2. Create type guards
# 3. Replace any with unknown
# 4. Add type guards

# Day 4-5: Type services
# Same process for service files
```

**Week 2: Components** (~1,500 fixes)
```bash
# Type component props
# Type event handlers
# Type hooks
```

**Week 3: Utilities** (~1,000 fixes)
```bash
# Add proper parameter types
# Add proper return types
# Remove any from generic functions
```

**Week 4: Third-Party Libraries** (~1,500 fixes)
```bash
# Create .d.ts files
# Type Commander.js
# Type other libraries
```

**Week 5-6: Cleanup** (~1,392 remaining)
```bash
# Fix edge cases
# Review and refine
# Achieve <100 violations
```

## Progress Tracking

```bash
# Check current state
npm run lint 2>&1 | grep -E "no-unsafe|no-explicit-any" | wc -l

# Track daily
echo "$(date +%Y-%m-%d): $(npm run lint 2>&1 | grep -E 'no-unsafe|no-explicit-any' | wc -l)" >> type-safety-progress.txt

# View progress
cat type-safety-progress.txt
```

## Testing Strategy

After fixing a batch:

```bash
# 1. Type check
npm run typecheck

# 2. Lint
npm run lint

# 3. Run tests
npm test -- --run

# 4. Manual smoke test
npm run dev
# Test the features you modified
```

## Safety Tips

1. **Work in small batches** (50-100 fixes at a time)
2. **Commit frequently** with descriptive messages
3. **Test after each batch**
4. **Don't rush** - type safety is about correctness
5. **When uncertain, use `unknown`** and add type guard later

## Resources

- TypeScript Type Guards: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Writing .d.ts files: https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html
- Unknown vs Any: https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown

---

**Remember:** Each `any` you fix prevents potential runtime bugs. This is valuable work!
