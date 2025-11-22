# Automated Return Type Addition Guide

## Overview

This guide helps you systematically add return types to functions.

**Total functions needing return types:** ~1,388
- Exported functions: 360
- Internal functions: 1,028

## Strategy: TypeScript Inference Helper

Instead of guessing types, let TypeScript help you:

### Method 1: Type Inference in VS Code

1. Hover over function name
2. VS Code shows inferred return type
3. Add it explicitly

**Example:**
```typescript
// Before
export function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// Hover shows: (items: Item[]) => number

// After
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

### Method 2: Use tsc to Infer

Create a temporary file:

```bash
# scripts/infer-types.sh
#!/bin/bash

FILE=$1
npx tsc --noEmit --declaration --emitDeclarationOnly $FILE 2>&1 | \
  grep "function" | \
  grep -v "error"
```

This outputs the inferred signatures.

### Method 3: Batch Processing with AST

For systematic addition, use TypeScript's AST:

```typescript
// scripts/add-return-types.ts
import ts from 'typescript'
import fs from 'fs'

function addReturnTypes(filePath: string): void {
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  )

  // Visit all function declarations
  function visit(node: ts.Node): void {
    if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
      if (!node.type) {
        // Infer and add return type
        const signature = checker.getSignatureFromDeclaration(node)
        const returnType = checker.getReturnTypeOfSignature(signature!)
        const typeString = checker.typeToString(returnType)

        console.log(`${filePath}:${node.getStart()} needs return type: ${typeString}`)
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
}
```

## Categorized Approach

### Category 1: React Components (~300 errors)

**Pattern:**
```typescript
// Before
export const MyComponent = ({ prop1, prop2 }) => {
  return <div>...</div>
}

// After - Option 1: Inline types
export const MyComponent = ({
  prop1,
  prop2
}: {
  prop1: string
  prop2: number
}): JSX.Element => {
  return <div>...</div>
}

// After - Option 2: Interface (preferred)
interface MyComponentProps {
  prop1: string
  prop2: number
}

export const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  return <div>...</div>
}
```

**Batch command:**
```bash
# Find all React component files
find src -name "*.tsx" | \
  grep -v test | \
  xargs grep -l "export const.*= ({" > react-components.txt

# Process each file
cat react-components.txt | while read file; do
  echo "Processing: $file"
  # Open in editor, add types
done
```

### Category 2: API/Service Functions (~300 errors)

**Pattern:**
```typescript
// Before
export async function getUsers() {
  const response = await api.get('/users')
  return response.data
}

// After
export async function getUsers(): Promise<User[]> {
  const response = await api.get('/users')
  return response.data
}
```

**Common return types:**
- `Promise<void>` - Fire and forget
- `Promise<T>` - Async data fetch
- `Promise<T[]>` - List fetch
- `Promise<{ data: T; error?: string }>` - Result wrapper

### Category 3: Event Handlers (~200 errors)

**Pattern:**
```typescript
// Before
const handleClick = (e) => {
  console.log(e.target)
}

// After
const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
  console.log(e.target)
}
```

**Common event types:**
- `React.MouseEvent<HTMLButtonElement>`
- `React.ChangeEvent<HTMLInputElement>`
- `React.FormEvent<HTMLFormElement>`
- `React.KeyboardEvent<HTMLInputElement>`

### Category 4: Utility Functions (~400 errors)

**Pattern:**
```typescript
// Before
export function formatDate(date) {
  return new Date(date).toLocaleDateString()
}

// After
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString()
}
```

**Tips:**
- Simple getters: Usually return primitives
- Calculations: Usually return `number`
- Formatters: Usually return `string`
- Validators: Usually return `boolean`

### Category 5: Complex Functions (~200 errors)

These need manual analysis. Strategy:

1. **Read the function**
2. **Understand what it returns**
3. **Check all return paths**
4. **Add union type if multiple types**

```typescript
// Example with multiple return types
function getStatus(user: User): 'active' | 'inactive' | 'pending' {
  if (user.verified) return 'active'
  if (user.blocked) return 'inactive'
  return 'pending'
}
```

## Automation Scripts

### Script 1: List Functions Needing Types

```bash
#!/bin/bash
# scripts/list-missing-return-types.sh

npm run lint 2>&1 | \
  grep "explicit-function-return-type\|explicit-module-boundary-types" | \
  cut -d: -f1,2 | \
  sort -u > scripts/output/missing-return-types.txt

echo "Found $(wc -l < scripts/output/missing-return-types.txt) locations"
echo "See: scripts/output/missing-return-types.txt"
```

### Script 2: Categorize by File Type

```bash
#!/bin/bash
# scripts/categorize-return-types.sh

INPUT="scripts/output/missing-return-types.txt"

# React components
grep "\.tsx:" $INPUT > scripts/output/rt-components.txt || true

# API/Services
grep -E "(api|service|services).*\.ts:" $INPUT > scripts/output/rt-services.txt || true

# Utils
grep "utils.*\.ts:" $INPUT > scripts/output/rt-utils.txt || true

# Pages
grep "pages.*\.tsx:" $INPUT > scripts/output/rt-pages.txt || true

# Everything else
grep -v -E "(\.tsx:|api|service|utils|pages)" $INPUT > scripts/output/rt-other.txt || true

echo "Categorized into:"
echo "  Components: $(wc -l < scripts/output/rt-components.txt)"
echo "  Services: $(wc -l < scripts/output/rt-services.txt)"
echo "  Utils: $(wc -l < scripts/output/rt-utils.txt)"
echo "  Pages: $(wc -l < scripts/output/rt-pages.txt)"
echo "  Other: $(wc -l < scripts/output/rt-other.txt)"
```

### Script 3: Interactive Fixer

```bash
#!/bin/bash
# scripts/fix-return-types-interactive.sh

CATEGORY=$1  # components, services, utils, pages, other

if [ -z "$CATEGORY" ]; then
  echo "Usage: $0 <category>"
  echo "Categories: components, services, utils, pages, other"
  exit 1
fi

FILE="scripts/output/rt-$CATEGORY.txt"

if [ ! -f "$FILE" ]; then
  echo "Category file not found: $FILE"
  echo "Run: scripts/categorize-return-types.sh first"
  exit 1
fi

echo "Processing $CATEGORY return types..."
echo "Total: $(wc -l < $FILE)"
echo ""

# Process each unique file
cat $FILE | cut -d: -f1 | sort -u | while read filepath; do
  # Count errors in this file
  count=$(grep "^$filepath:" $FILE | wc -l)

  echo "📄 $filepath ($count errors)"
  echo "   Opening in editor... (Press ENTER to continue)"

  # Open file at first error line
  line=$(grep "^$filepath:" $FILE | head -1 | cut -d: -f2)

  # Open in VS Code (or your editor)
  code --goto "$filepath:$line"

  read -r
done

echo "✅ Category complete!"
```

## Daily Workflow

**Day 1: Components** (300 errors, ~2-3 hours)
```bash
./scripts/list-missing-return-types.sh
./scripts/categorize-return-types.sh
./scripts/fix-return-types-interactive.sh components
git add -A && git commit -m "fix: add return types to React components"
```

**Day 2: Services** (300 errors, ~2-3 hours)
```bash
./scripts/fix-return-types-interactive.sh services
git add -A && git commit -m "fix: add return types to service functions"
```

**Day 3: Utils** (400 errors, ~3-4 hours)
```bash
./scripts/fix-return-types-interactive.sh utils
git add -A && git commit -m "fix: add return types to utility functions"
```

**Day 4: Pages** (~200 errors, ~2 hours)
```bash
./scripts/fix-return-types-interactive.sh pages
git add -A && git commit -m "fix: add return types to page components"
```

**Day 5: Other** (~200 errors, ~2 hours)
```bash
./scripts/fix-return-types-interactive.sh other
git add -A && git commit -m "fix: add return types to remaining functions"
```

## Tips for Speed

1. **Use VS Code IntelliSense** - Hover shows inferred type
2. **Copy-paste common patterns** - Most are repetitive
3. **Work in batches of 20-30** - Commit frequently
4. **Use find/replace** for common patterns
5. **Don't overthink** - If TypeScript infers it correctly, use that

## Common Patterns Reference

```typescript
// Async functions
async function foo(): Promise<void> { }
async function bar(): Promise<User> { }
async function baz(): Promise<User[]> { }

// React components
const Comp: React.FC<Props> = () => { }
const Comp = (): JSX.Element => { }

// Event handlers
const handler = (e: React.MouseEvent): void => { }

// Utilities
function isValid(x: any): boolean { }
function format(x: any): string { }
function calculate(x: any): number { }

// Getters
function getName(): string { }
function getCount(): number { }
function getUser(): User | null { }
```

## Progress Tracking

After each session:
```bash
npm run lint 2>&1 | grep "explicit-function-return-type" | wc -l
```

Track in a file:
```bash
echo "$(date): $(npm run lint 2>&1 | grep 'explicit-function-return-type' | wc -l) remaining" >> progress.txt
```

Watch your progress decrease! 📉
