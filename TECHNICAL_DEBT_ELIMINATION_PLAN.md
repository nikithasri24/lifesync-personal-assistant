# Technical Debt Elimination Plan
**Goal**: Fix all identified issues + Prevent future technical debt

---

## Phase 1: Prevention Infrastructure (Do First!) - 4 hours

### 1.1 ESLint Rules Setup (1 hour)

**File**: `.eslintrc.cjs` or `.eslintrc.json`

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended', // Accessibility
  ],
  rules: {
    // Prevent 'any' types
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',

    // Prevent console usage
    'no-console': ['error', { allow: ['warn', 'error'] }],

    // React best practices
    'react/jsx-key': 'error',
    'react/display-name': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Accessibility
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-role': 'error',

    // Code quality
    'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
    'complexity': ['warn', 15],
    'max-depth': ['warn', 4],
  },
};
```

**Install dependencies**:
```bash
npm install -D \
  eslint-plugin-jsx-a11y \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser
```

---

### 1.2 TypeScript Strict Mode (1 hour)

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Migration Strategy**:
- Enable one flag at a time
- Fix errors module by module
- Use `// @ts-expect-error` with TODO comments for complex cases

---

### 1.3 Pre-commit Hooks (1 hour)

**File**: `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format

# Run affected tests
npm run test -- --onlyChanged
```

**Install**:
```bash
npm install -D husky lint-staged
npx husky install
```

**File**: `.lintstagedrc.json`

```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
    "bash -c 'tsc --noEmit'"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

---

### 1.4 CI/CD Quality Gates (1 hour)

**File**: `.github/workflows/quality-check.yml`

```yaml
name: Quality Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type Check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test -- --coverage

      - name: Build
        run: npm run build

      - name: Bundle Size Check
        run: npm run bundlesize

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

---

## Phase 2: Quick Wins (4-6 hours)

### 2.1 Add Error Boundary (1 hour)

**Create**: `src/components/ErrorBoundary.tsx`

```typescript
import React, { Component, ReactNode } from 'react';
import { logger } from '../services/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught error', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">⚠️</div>
                <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
              </div>
              <p className="text-gray-600 mb-4">
                We're sorry, but something unexpected happened. The error has been logged.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

**Update**: `src/App.tsx`

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      {/* existing app code */}
    </ErrorBoundary>
  );
}
```

---

### 2.2 Consolidate OwnerBadge (2-3 hours)

**Create**: `src/components/common/OwnerBadge.tsx` (unified version)

```typescript
import React from 'react';
import { User } from 'lucide-react';

export type OwnerBadgeSize = 'sm' | 'md' | 'lg';
export type OwnerBadgeVariant = 'default' | 'compact';

interface OwnerBadgeProps {
  userId: string;
  currentUserId: string | null;
  partnerName?: string;
  size?: OwnerBadgeSize;
  variant?: OwnerBadgeVariant;
  showIcon?: boolean;
  className?: string;
}

const sizeClasses: Record<OwnerBadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const OwnerBadge = React.memo<OwnerBadgeProps>(
  ({
    userId,
    currentUserId,
    partnerName = 'Partner',
    size = 'sm',
    variant = 'default',
    showIcon = false,
    className = '',
  }) => {
    if (!currentUserId) return null;

    const isCurrentUser = userId === currentUserId;
    const label = isCurrentUser ? 'Me' : partnerName;
    const colorClasses = isCurrentUser
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';

    if (variant === 'compact') {
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${colorClasses} ${className}`}
          aria-label={`Owned by ${label}`}
        >
          {showIcon && <User className="w-3 h-3" />}
          {label}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${colorClasses} ${className}`}
        aria-label={`Owned by ${label}`}
      >
        {showIcon && <User className="w-4 h-4" />}
        <span>{label}</span>
      </span>
    );
  }
);

OwnerBadge.displayName = 'OwnerBadge';

// Export compact variant as separate component for convenience
export const CompactOwnerBadge: React.FC<Omit<OwnerBadgeProps, 'variant'>> = (props) => (
  <OwnerBadge {...props} variant="compact" />
);
```

**Migration Script**: `scripts/migrate-owner-badge.sh`

```bash
#!/bin/bash
# Automatically update imports across codebase

# Find all files importing OwnerBadge
FILES=$(grep -rl "from.*OwnerBadge" src/)

for file in $FILES; do
  # Update import path
  sed -i '' "s|from '../components/OwnerBadge'|from '@/components/common/OwnerBadge'|g" "$file"
  sed -i '' "s|from '../../components/common/OwnerBadge'|from '@/components/common/OwnerBadge'|g" "$file"
  sed -i '' "s|from '../finance/components/OwnerBadge'|from '@/components/common/OwnerBadge'|g" "$file"
  sed -i '' "s|from '../shopping/components/common/OwnerBadge'|from '@/components/common/OwnerBadge'|g" "$file"
done

echo "✅ Updated imports in $(echo "$FILES" | wc -l) files"
```

**Delete old implementations**:
```bash
rm src/finance/components/OwnerBadge.tsx
rm src/shopping/components/common/OwnerBadge.tsx
```

---

### 2.3 Fix VisaCalculator N+1 Query (1 hour)

**Update**: `src/travel/components/VisaCalculator.tsx`

```typescript
// Replace lines 136-160 and 173-180 with single useMemo
const { filteredVisas, validVisaCountries, additionalAccessFromVisas } = React.useMemo(() => {
  const checkDate = new Date(travelDate);

  // Filter by owner once
  let filtered = userVisas;
  if (mergedConnection && currentUserId) {
    if (passportOwnerFilter === 'me') {
      filtered = userVisas.filter(v => v.userId === currentUserId);
    } else if (passportOwnerFilter === 'partner') {
      filtered = userVisas.filter(v => v.userId === mergedConnection.partnerId);
    }
    // 'both' = no filtering
  }

  // Filter by validity
  const validVisas = filtered.filter(v => new Date(v.expiryDate) >= checkDate);
  const countries = validVisas.map(v => v.countryName);
  const access = getAdditionalAccessFromVisas(countries);

  return {
    filteredVisas: filtered,
    validVisaCountries: countries,
    additionalAccessFromVisas: access,
  };
}, [userVisas, travelDate, passportOwnerFilter, mergedConnection, currentUserId]);
```

---

## Phase 3: Performance Optimization (8-12 hours)

### 3.1 Add React.memo to Heavy Components (6-8 hours)

**Create**: `scripts/add-react-memo.sh`

```bash
#!/bin/bash
# Helper to wrap components in React.memo

COMPONENTS=(
  "src/todos/components/TaskRow.tsx"
  "src/finance/components/transactions/EditableTransactionRow.tsx"
  "src/shopping/components/items/MasterItemCard.tsx"
  "src/mealPlanning/components/recipe/RecipeCard.tsx"
)

for component in "${COMPONENTS[@]}"; do
  echo "Adding React.memo to $component"
  # Manual process - can't fully automate due to custom comparison logic
done
```

**Template**:
```typescript
export const ComponentName = React.memo<Props>(
  ({ prop1, prop2 }) => {
    // Component logic
  },
  (prevProps, nextProps) => {
    // Custom equality check for optimization
    return (
      prevProps.id === nextProps.id &&
      prevProps.status === nextProps.status &&
      // ... check only props that affect rendering
    );
  }
);

ComponentName.displayName = 'ComponentName';
```

---

### 3.2 Refactor ShoppingSmart.tsx (4-6 hours)

**Create new files**:
```
src/shopping/views/
  ├── MasterListView.tsx
  ├── DistributeView.tsx (already exists, enhance)
  ├── StoreListsView.tsx
  └── PantryView.tsx (already exists, enhance)
```

**Update**: `src/pages/ShoppingSmart.tsx` becomes orchestrator:

```typescript
// Reduced to ~200 lines
export default function ShoppingSmart() {
  const [activeView, setActiveView] = useState<ShoppingView>('master');

  return (
    <ErrorBoundary>
      <ShoppingProvider>
        <ShoppingHeader view={activeView} onViewChange={setActiveView} />
        <ShoppingViewRenderer view={activeView} />
      </ShoppingProvider>
    </ErrorBoundary>
  );
}
```

---

## Phase 4: Type Safety (6-10 hours)

### 4.1 Remove 'any' Types (4-6 hours)

**Create**: `scripts/find-any-types.sh`

```bash
#!/bin/bash
# Find all 'any' type usage

echo "Finding 'any' types..."
grep -rn ": any" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules

echo ""
echo "Finding explicit any casts..."
grep -rn "as any" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

**Systematic approach**:
1. Run script to find all instances
2. Fix module by module (start with utils, then components)
3. Add proper interfaces/types

**Example fixes**:
```typescript
// Before
function useHasMergedPermission(mergedConnection: any) { }

// After
import type { MergedConnectionResult } from '@/types/connections';
function useHasMergedPermission(
  mergedConnection: MergedConnectionResult | null | undefined
): boolean { }
```

---

### 4.2 Add Type Guards (2-3 hours)

**Create**: `src/types/guards.ts`

```typescript
import type { ShoppingItem, Task, Transaction, Goal } from './index';

export function isShoppingItem(value: unknown): value is ShoppingItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as ShoppingItem).name === 'string'
  );
}

export function isTask(value: unknown): value is Task {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    typeof (value as Task).title === 'string'
  );
}

export function isTransaction(value: unknown): value is Transaction {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'amount' in value &&
    typeof (value as Transaction).amount === 'number'
  );
}

// Add more as needed
```

**Usage**:
```typescript
// Replace unsafe casts
const item = data as ShoppingItem; // ❌ Unsafe

// With type guard
if (isShoppingItem(data)) {
  // ✅ TypeScript knows data is ShoppingItem here
  console.log(data.name);
}
```

---

## Phase 5: Accessibility (6-8 hours)

### 5.1 ARIA Labels Audit (4 hours)

**Create**: `scripts/check-accessibility.sh`

```bash
#!/bin/bash
# Find buttons/inputs without ARIA labels

echo "Buttons without aria-label or aria-labelledby:"
grep -rn "<button" src/ --include="*.tsx" | \
  grep -v "aria-label" | \
  grep -v "aria-labelledby" | \
  wc -l

echo "Inputs without labels:"
grep -rn "<input" src/ --include="*.tsx" | \
  grep -v "aria-label" | \
  grep -v "htmlFor" | \
  wc -l
```

**Template for fixes**:
```typescript
// Icon-only buttons
<button
  onClick={handleClick}
  aria-label="Delete task"
  className="..."
>
  <Trash2 className="w-4 h-4" />
</button>

// Expandable sections
<button
  onClick={toggleExpand}
  aria-label={isExpanded ? "Collapse section" : "Expand section"}
  aria-expanded={isExpanded}
>
  {isExpanded ? <ChevronDown /> : <ChevronRight />}
</button>

// Form inputs
<label htmlFor="task-title" className="...">
  Task Title <span className="text-red-500" aria-label="required">*</span>
</label>
<input
  id="task-title"
  type="text"
  aria-invalid={hasError}
  aria-describedby={hasError ? "task-title-error" : undefined}
  required
/>
{hasError && (
  <div id="task-title-error" role="alert">
    {errorMessage}
  </div>
)}
```

---

### 5.2 Keyboard Navigation (2 hours)

**Checklist**:
- [ ] All interactive elements accessible via Tab
- [ ] Escape key closes modals
- [ ] Enter key submits forms
- [ ] Arrow keys navigate lists
- [ ] Focus visible indicators

**Add global styles**: `src/index.css`

```css
/* Focus indicators */
*:focus-visible {
  outline: 2px solid theme('colors.blue.500');
  outline-offset: 2px;
}

/* Skip to main content link */
.skip-to-main {
  position: absolute;
  left: -9999px;
  z-index: 999;
}

.skip-to-main:focus {
  left: 50%;
  transform: translateX(-50%);
  top: 1rem;
}
```

---

## Phase 6: Code Quality (6-8 hours)

### 6.1 Replace console.* with Logger (2 hours)

**Create**: `scripts/replace-console.sh`

```bash
#!/bin/bash
# Find and replace console usage

# Find all console.log
grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx" > console-usage.txt

# Find all console.error
grep -rn "console\.error" src/ --include="*.ts" --include="*.tsx" >> console-usage.txt

echo "Found $(wc -l < console-usage.txt) instances"
echo "Review console-usage.txt and replace with logger service"
```

**Pattern**:
```typescript
// Before
console.log('User clicked button', data);
console.error('API failed', error);

// After
import { logger } from '@/services/logger';

logger.debug('Component', 'User clicked button', { data });
logger.error('Component', error instanceof Error ? error : new Error(String(error)));
```

---

### 6.2 Standardize Error Handling (2-3 hours)

**Create**: `src/hooks/useToast.ts`

```typescript
import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, toast.duration || 5000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
}));

export function useToast() {
  const addToast = useToastStore(state => state.addToast);

  return {
    showToast: addToast,
    showError: (message: string, description?: string) =>
      addToast({ type: 'error', message, description }),
    showSuccess: (message: string, description?: string) =>
      addToast({ type: 'success', message, description }),
  };
}
```

**Replace all `alert()` calls**:
```typescript
// Before
catch (error) {
  alert('Failed to save');
}

// After
const { showError } = useToast();

catch (error) {
  showError(
    'Failed to save',
    error instanceof Error ? error.message : undefined
  );
}
```

---

## Phase 7: Documentation (2-4 hours)

### 7.1 Component Documentation

**Create**: `docs/COMPONENT_PATTERNS.md`

```markdown
# Component Patterns Guide

## Creating a New Component

### Template
\`\`\`typescript
import React from 'react';

interface Props {
  // Props here
}

/**
 * ComponentName - Brief description
 *
 * @example
 * <ComponentName prop1="value" prop2={123} />
 */
export const ComponentName = React.memo<Props>(
  ({ prop1, prop2 }) => {
    // Component logic
    return <div>...</div>;
  }
);

ComponentName.displayName = 'ComponentName';
\`\`\`

### Rules
1. Always use TypeScript
2. Wrap in React.memo if component is:
   - Rendered in lists
   - Re-renders frequently
   - Has expensive computations
3. Add displayName for debugging
4. Add JSDoc comments
5. Use semantic HTML
6. Add ARIA labels to interactive elements
7. Keep under 300 lines (split if larger)

## Checklist
- [ ] TypeScript interfaces defined
- [ ] Props documented with JSDoc
- [ ] Wrapped in React.memo (if needed)
- [ ] DisplayName set
- [ ] ARIA labels added
- [ ] Error handling in place
- [ ] Loading states handled
- [ ] Keyboard navigation works
- [ ] Tests written
```

---

### 7.2 Coding Standards

**Create**: `docs/CODING_STANDARDS.md`

```markdown
# Coding Standards

## TypeScript
- ❌ Never use `any`
- ✅ Use strict mode
- ✅ Use type guards for runtime checks
- ✅ Prefer interfaces over types for objects

## React
- ✅ Use functional components
- ✅ Use hooks (no class components)
- ✅ Wrap expensive components in React.memo
- ✅ Use useCallback for event handlers passed to memoized children
- ✅ Keep components under 300 lines

## Error Handling
- ✅ Always use try/catch in async functions
- ✅ Use toast notifications (not alert())
- ✅ Log errors with logger service
- ❌ Never swallow errors silently

## Accessibility
- ✅ Add aria-label to icon-only buttons
- ✅ Use semantic HTML (button, not div with onClick)
- ✅ Test keyboard navigation
- ✅ Add alt text to images
- ✅ Use proper label associations for form inputs

## Performance
- ✅ Use React Query for data fetching
- ✅ Implement optimistic updates
- ✅ Add loading skeletons
- ✅ Lazy load routes and heavy components
```

---

## Automation Tools

### Tool 1: Auto-fix Script

**Create**: `scripts/auto-fix.sh`

```bash
#!/bin/bash
# Automated fixes for common issues

echo "🔧 Running automated fixes..."

# Format code
npm run format

# Fix linting issues
npm run lint -- --fix

# Type check
npm run type-check

echo "✅ Automated fixes complete"
echo "⚠️  Review changes before committing"
```

---

### Tool 2: Quality Dashboard

**Create**: `scripts/quality-report.sh`

```bash
#!/bin/bash
# Generate quality metrics

echo "📊 Quality Report"
echo "=================="

# Count files
echo ""
echo "📁 Codebase Size:"
echo "   TypeScript files: $(find src -name "*.ts" -o -name "*.tsx" | wc -l)"
echo "   Total lines: $(find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1)"

# Find issues
echo ""
echo "⚠️  Issues Found:"
echo "   'any' types: $(grep -r ": any" src --include="*.ts" --include="*.tsx" | wc -l)"
echo "   console.* calls: $(grep -r "console\." src --include="*.ts" --include="*.tsx" | wc -l)"
echo "   Missing keys: $(grep -r "\.map(" src --include="*.tsx" | grep -v "key=" | wc -l)"
echo "   Large files (>400 lines): $(find src -name "*.tsx" -exec wc -l {} \; | awk '$1 > 400' | wc -l)"

# Type coverage
echo ""
echo "🎯 Type Coverage:"
npm run type-check 2>&1 | grep "error TS" | wc -l | xargs echo "   TypeScript errors:"

# Test coverage
echo ""
echo "🧪 Test Coverage:"
npm test -- --coverage --silent 2>&1 | grep "All files" | awk '{print "   " $4 " covered"}'

echo ""
echo "✅ Run 'npm run fix-all' to auto-fix common issues"
```

---

## Execution Plan

### Week 1: Foundation
**Mon**: Phase 1 - Prevention Infrastructure (4h)
**Tue**: Phase 2.1-2.2 - Error Boundary + OwnerBadge (3h)
**Wed**: Phase 2.3 - Fix VisaCalculator (1h)
**Thu**: Phase 3.1 - React.memo (start, 3h)
**Fri**: Phase 3.1 - React.memo (continue, 3h)

### Week 2: Optimization
**Mon**: Phase 3.1 - React.memo (finish, 2h) + Phase 3.2 (start, 2h)
**Tue**: Phase 3.2 - Refactor ShoppingSmart (4h)
**Wed**: Phase 4.1 - Remove 'any' types (4h)
**Thu**: Phase 4.2 - Type guards (2h) + Phase 5.1 (start, 2h)
**Fri**: Phase 5.1 - ARIA labels (2h) + Phase 5.2 (2h)

### Week 3: Polish
**Mon**: Phase 6.1-6.2 - Logger + Error handling (4h)
**Tue**: Phase 7 - Documentation (4h)
**Wed**: Testing + Bug fixes (4h)
**Thu**: Final review + PR (4h)
**Fri**: Buffer day for unexpected issues

**Total**: ~60 hours over 3 weeks

---

## Package.json Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,md}\"",
    "fix-all": "npm run format && npm run lint:fix",
    "quality-report": "bash scripts/quality-report.sh",
    "test:coverage": "vitest run --coverage",
    "prepare": "husky install"
  }
}
```

---

## Success Metrics

Track progress with:

```bash
# Before starting
npm run quality-report > metrics-before.txt

# After each phase
npm run quality-report > metrics-week1.txt

# Compare
diff metrics-before.txt metrics-week1.txt
```

**Target Goals**:
- ❌ 'any' types: 30 → 0
- ❌ console.* calls: 50 → 0
- ❌ Missing ARIA labels: 100 → 0
- ❌ TypeScript errors: 50 → 0
- ✅ Test coverage: 40% → 80%
- ✅ Bundle size: Current → -15%

---

## Conclusion

This plan eliminates technical debt systematically while preventing future issues through:
1. **Automation** (linting, type checking, pre-commit hooks)
2. **Documentation** (patterns, standards, examples)
3. **Tooling** (quality dashboard, auto-fix scripts)
4. **CI/CD** (quality gates, coverage tracking)

**Estimated Total Time**: 56-72 hours
**Suggested Schedule**: 3 weeks at ~20 hours/week
**ROI**: Prevents future bugs, improves maintainability, faster development

Let's build quality into the process! 🚀
