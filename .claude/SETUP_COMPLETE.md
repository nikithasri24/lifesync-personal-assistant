# ESLint Rules Setup - Complete ✅

## What We've Configured

### 1. ESLint Configuration (`eslint.config.js`)

Updated with **strict enforcement rules** that align with `.claude/rules.md`:

#### 🚨 Critical Rules (ERROR - Will Fail Build)

**TypeScript Type Safety:**
- ❌ `@typescript-eslint/no-explicit-any` - NEVER use `any` type
- ❌ `@typescript-eslint/no-unsafe-assignment` - No unsafe assignments
- ❌ `@typescript-eslint/no-unsafe-call` - No unsafe function calls
- ❌ `@typescript-eslint/no-unsafe-member-access` - No unsafe property access
- ❌ `@typescript-eslint/no-unsafe-return` - No unsafe returns
- ❌ `@typescript-eslint/no-unsafe-argument` - No unsafe arguments

**Explicit Types:**
- ❌ `@typescript-eslint/explicit-function-return-type` - All functions MUST have return types
- ❌ `@typescript-eslint/explicit-module-boundary-types` - Exported functions MUST have types

**Code Quality:**
- ❌ `no-console` - Use `logger` instead of `console.log/warn/error`
- ❌ `max-lines` - Files limited to **400 lines** (excluding blanks/comments)
- ❌ `no-debugger` - No debugger statements
- ❌ `no-alert` - No alert() calls

**Modern JavaScript:**
- ❌ `no-var` - Use `const` or `let`
- ❌ `prefer-const` - Use const when variable isn't reassigned
- ❌ `@typescript-eslint/no-unused-vars` - No unused variables (allow `_` prefix)

#### ⚠️ Warnings (Should Fix But Won't Fail Build)

- ⚠️ `@typescript-eslint/prefer-nullish-coalescing` - Use `??` instead of `||`
- ⚠️ `@typescript-eslint/prefer-optional-chain` - Use `?.` for safety
- ⚠️ `@typescript-eslint/no-non-null-assertion` - Warn on `!` usage
- ⚠️ `react-hooks/exhaustive-deps` - Warn on missing hook dependencies

#### ✅ Exceptions (Rules Relaxed)

**Test Files** (`*.test.ts`, `*.spec.ts`, `__tests__/**`):
- ✅ Allow `any` types (testing needs flexibility)
- ✅ No file size limit

**Type Declaration Files** (`*.d.ts`):
- ✅ Allow `any` in type definitions
- ✅ Allow unused variables

**Data/Fixture Files** (`data/**`, `fixtures/**`):
- ✅ No file size limit (data can be large)
- ⚠️ `any` types warn instead of error

### 2. Package.json Scripts Updated

**New/Modified Scripts:**

```bash
# Linting (STRICT - no warnings allowed)
npm run lint          # Fails if ANY warnings or errors
npm run lint:fix      # Auto-fix issues, fails if can't fix all

# Full validation (run before committing)
npm run validate      # typecheck + lint + tests
```

**How Linting Changed:**
- **Before:** `eslint .` (allowed warnings)
- **After:** `eslint . --max-warnings 0` (fails on ANY warning)

### 3. Global Ignores

ESLint now ignores:
- `dist/` - Build output
- `__mocks__/` - Mock files

## What This Means for Development

### ✅ What Will Happen Now

**When Claude writes code:**
1. ❌ Cannot use `any` type → ESLint will error
2. ❌ Cannot use `console.log` → ESLint will error
3. ❌ Cannot create files >400 lines → ESLint will error
4. ❌ Cannot skip return types → ESLint will error

**When you commit code:**
1. Git hooks will run `lint-staged`
2. ESLint will check changed files
3. Commit will FAIL if any errors exist

**When CI runs:**
1. `npm run lint` will fail build if errors exist
2. Forces code quality before merge

### ⚠️ Current State Warning

**The codebase currently has violations.** Running `npm run lint` will show MANY errors:
- ~959 `any` type usages
- Console.log statements
- Files over 400 lines
- Missing return types

### 📋 Recommended Next Steps

#### Option A: Gradual Migration (Recommended)

1. **Add ESLint disable comments to existing violations**
   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const data: any = ...
   ```

2. **Fix violations incrementally**
   - Pick one rule at a time
   - Fix files one by one
   - Remove disable comments as you fix

3. **New code is clean from day 1**
   - All new code must follow rules
   - Old code gets fixed over time

#### Option B: Fix Everything Now (Hardcore)

1. **Run lint and see all errors**
   ```bash
   npm run lint > lint-errors.txt 2>&1
   ```

2. **Systematic cleanup**
   - Group errors by type
   - Fix all of one type (e.g., all `any` types)
   - Then move to next type

3. **Could take days/weeks** depending on codebase size

#### Option C: Relax Rules Temporarily

1. **Change errors to warnings** for migration period
2. **Gradually promote warnings to errors** as you fix
3. **Timeline-based approach** (e.g., "all `any` fixed by end of month")

## How to Use These Rules

### When Starting New Work

**Before writing code:**
```bash
# Check current state
npm run typecheck
npm run lint
npm test -- --run
```

**While writing code:**
- ESLint will show errors in real-time (in VS Code with ESLint extension)
- Fix errors as you go
- Don't let errors accumulate

**Before committing:**
```bash
# Run full validation
npm run validate

# If it passes, you're good to commit
git add .
git commit -m "feat: add new feature"
```

### When Claude Writes Code

**In your prompts, add:**
```markdown
Remember:
- Follow .claude/rules.md
- No `any` types
- Use logger instead of console
- Keep files under 400 lines
- Run `npm run lint` before showing me code
```

**Or use the shorthand:**
```markdown
@rules - Follow all rules in .claude/rules.md
```

### Checking Compliance

**Count remaining violations:**
```bash
# Count 'any' types
grep -r ": any\|<any>\|as any" src --include="*.ts" --include="*.tsx" | wc -l

# Count console.log usage
grep -r "console\." src --include="*.ts" --include="*.tsx" | wc -l

# Find files over 400 lines
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 400 {print $2, $1}'
```

## Testing the Setup

### Quick Test

Create a test file to verify rules work:

```typescript
// src/test-eslint-rules.ts

// This should ERROR - no 'any' types
const test1: any = 'bad'

// This should ERROR - no console
console.log('test')

// This should ERROR - missing return type
export function testFunc() {
  return 'bad'
}

// This should PASS
export function goodFunc(): string {
  return 'good'
}
```

Run: `npm run lint`

You should see 3 errors for the violations.

### Full Validation Test

```bash
# Should show all current violations
npm run lint

# Should fix auto-fixable issues
npm run lint:fix

# Should run all checks
npm run validate
```

## Configuration Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `.claude/rules.md` | Human-readable rules for Claude | ✅ Created |
| `eslint.config.js` | ESLint enforcement rules | ✅ Updated |
| `package.json` | Scripts for validation | ✅ Updated |
| `.husky/pre-commit` | Git hooks (to be updated next) | ⏳ Pending |

## Next Steps

1. **Test the setup:** Run `npm run lint` to see current violations
2. **Decide migration strategy:** Option A, B, or C above
3. **Update git hooks:** Enforce rules at commit time
4. **Document exceptions:** If you need to allow `any` somewhere, document why

---

**Status:** ESLint rules configured and enforced ✅
**Impact:** New code must follow rules, old code needs migration
**Recommendation:** Use gradual migration (Option A)
