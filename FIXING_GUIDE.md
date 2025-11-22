# Complete ESLint Violation Fixing Guide

**Current Status:** 9,183 violations (from 9,341)
**Progress:** 158 fixed (1.7%)
**Target:** <100 violations

## 📋 Quick Start

### Today (30 minutes)
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run the analysis
./scripts/fix-unused-vars.sh

# Review output
ls scripts/output/
```

### This Week (8-12 hours)
1. **Unused variables** (455 errors) - 2-3 hours
2. **Return types - Components** (300 errors) - 2-3 hours
3. **Return types - Services** (300 errors) - 2-3 hours
4. **Floating promises** (148 errors) - 1-2 hours

### This Month (40-60 hours)
1. Week 1: API & Services type safety - 10-15 hours
2. Week 2: Components type safety - 10-15 hours
3. Week 3: Utilities type safety - 10-15 hours
4. Week 4: Third-party library types - 10-15 hours

## 📚 Detailed Guides

### 1. Unused Variables (455 errors)

**Script:** `scripts/fix-unused-vars.sh`
**Guide:** Inline in script
**Time:** 2-3 hours

```bash
./scripts/fix-unused-vars.sh
```

**What it does:**
- Extracts all unused variable errors
- Categorizes into imports vs parameters
- Generates fix lists

**Manual fixes:**
```bash
# Review unused imports
cat scripts/output/unused-imports.txt

# For each import, either:
# 1. Remove if truly unused
# 2. Use it if it should be used

# Review unused parameters
cat scripts/output/unused-params.txt

# For each parameter, either:
# 1. Use it if it should be used
# 2. Prefix with _ if intentionally unused
```

### 2. Return Types (1,388 errors)

**Guide:** `scripts/add-return-types.md`
**Time:** 8-12 hours total

**Quick workflow:**
```bash
# Generate categorized lists
npm run lint 2>&1 | grep "explicit-function-return-type" > return-types-raw.txt

# Filter by file type
grep "\.tsx:" return-types-raw.txt > components.txt
grep -E "(api|service)" return-types-raw.txt > services.txt
grep "utils" return-types-raw.txt > utils.txt

# Fix each category
# Open files, hover in VS Code to see inferred type, add explicitly
```

**Common patterns:**
```typescript
// React components
export const MyComponent: React.FC<Props> = ({ }) => { }

// Async functions
async function getData(): Promise<Data> { }

// Event handlers
const onClick = (e: React.MouseEvent): void => { }

// Utilities
function format(val: string): string { }
```

### 3. Type Safety (6,392 errors)

**Guide:** `scripts/fix-type-safety.md`
**Time:** 40-60 hours total

**Strategy:**
1. Find `any` hotspots with script
2. Create proper type definitions
3. Replace `any` with `unknown`
4. Add type guards
5. Test thoroughly

**Weekly plan:**
- Week 1: APIs (20-30 files, ~1,000 fixes)
- Week 2: Components (30-40 files, ~1,500 fixes)
- Week 3: Services/Utils (20-30 files, ~1,000 fixes)
- Week 4: Third-party libs (~1,500 fixes)
- Weeks 5-6: Cleanup (~1,392 remaining)

### 4. Floating Promises (148 errors)

**Pattern:**
```bash
# Find all floating promises
npm run lint 2>&1 | grep "no-floating-promises" > floating-promises.txt

# For each:
# 1. If intentional fire-and-forget: add `void`
# 2. If should wait: add `await`
```

**Examples:**
```typescript
// Before
doSomethingAsync()

// After (fire-and-forget)
void doSomethingAsync()

// After (should wait)
await doSomethingAsync()
```

### 5. File Size (43 files)

**Strategy:** Extract components systematically

**For each large file:**
1. Identify logical sections
2. Extract to separate files
3. Update imports
4. Test

**Defer this** until code stabilizes.

## 🎯 Recommended Schedule

### Option A: Aggressive (Full-time focus)

**Week 1:**
- Mon: Unused vars (455) + Easy return types (200)
- Tue: Component return types (300)
- Wed: Service return types (300)
- Thu: Util return types (400)
- Fri: Floating promises (148) + Remaining return types (188)

**Weeks 2-5:** Type safety (1,000 fixes/week)

**Week 6:** Final cleanup

**Total:** 6 weeks, ~40 hours/week

### Option B: Steady (Part-time)

**Each week:** 8-10 hours dedicated time

**Week 1:** Unused vars + Component return types
**Week 2:** Service + Util return types
**Week 3:** Floating promises + Easy type safety
**Weeks 4-10:** Type safety (1,000/week)
**Week 11-12:** Cleanup

**Total:** 12 weeks, ~8-10 hours/week

### Option C: Gradual (Sustainable)

**Each week:** 4-5 hours

**Progress:** ~500 fixes/week

**Timeline:** 16-20 weeks to completion

**Advantage:** Fits around feature work

## 📊 Tracking Progress

### Daily Check
```bash
npm run lint 2>&1 | grep "✖"
```

### Log Progress
```bash
# Add to progress log
echo "$(date +%Y-%m-%d): $(npm run lint 2>&1 | grep '✖' | awk '{print $2}') violations" >> PROGRESS.md

# View progress
cat PROGRESS.md
```

### Celebrate Milestones
- 9,000 → 8,000: 🎉 1,000 fixed!
- 8,000 → 7,000: 🎉 2,000 fixed!
- 7,000 → 6,000: 🎉 3,000 fixed!
- ...
- 1,000 → 100: 🎉 Almost done!
- 100 → 0: 🎉🎉🎉 COMPLETE!

## 🛠️ Tools & Scripts

All scripts in `scripts/` directory:

| Script | Purpose | Time |
|--------|---------|------|
| `fix-unused-vars.sh` | Analyze unused variables | 2 min |
| `add-return-types.md` | Guide for return types | Reference |
| `fix-type-safety.md` | Guide for type safety | Reference |

## ⚠️ Important Rules

### Before Each Session

1. **Pull latest code**
   ```bash
   git pull origin main
   ```

2. **Create a branch** for your fixes
   ```bash
   git checkout -b fix/eslint-batch-1
   ```

3. **Verify starting state**
   ```bash
   npm run lint 2>&1 | grep "✖"
   ```

### During Fixing

1. **Work in batches** (50-100 fixes)
2. **Test after each batch**
   ```bash
   npm run typecheck
   npm run lint
   npm test -- --run
   ```
3. **Commit frequently**
   ```bash
   git add -A
   git commit -m "fix: resolve 50 unused variable violations"
   ```

### After Each Session

1. **Run full validation**
   ```bash
   npm run validate
   ```

2. **Push your branch**
   ```bash
   git push origin fix/eslint-batch-1
   ```

3. **Log progress**
   ```bash
   echo "$(date): Fixed batch, now at $(npm run lint 2>&1 | grep '✖' | awk '{print $2}') violations" >> PROGRESS.md
   ```

## 🎓 Learning Resources

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

### ESLint
- [typescript-eslint rules](https://typescript-eslint.io/rules/)
- [no-unsafe-* rules explained](https://typescript-eslint.io/linting/troubleshooting/performance-troubleshooting/)

### Best Practices
- [Effective TypeScript](https://effectivetypescript.com/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

## 💡 Tips for Success

1. **Don't rush** - Quality over speed
2. **Take breaks** - Prevents fatigue mistakes
3. **Ask for help** - Use Claude or StackOverflow when stuck
4. **Celebrate wins** - Every 100 fixes is progress!
5. **Stay motivated** - You're preventing bugs!

## 🚨 When You Get Stuck

### Issue: "I don't know the type"

**Solution:** Use TypeScript to help
```typescript
// Temporarily use any
const temp: any = someValue

// Hover in VS Code to see what TypeScript infers
// Use that inferred type

// Or log it
console.log(typeof temp, temp)
```

### Issue: "Type is too complex"

**Solution:** Break it down
```typescript
// Instead of inline
function foo(data: { users: Array<{ id: string; name: string; meta: { created: Date; updated: Date } }> })

// Create types
interface UserMeta {
  created: Date
  updated: Date
}

interface User {
  id: string
  name: string
  meta: UserMeta
}

interface UserData {
  users: User[]
}

function foo(data: UserData) { }
```

### Issue: "Third-party library has no types"

**Solution:** Create declaration file
```bash
# Create
touch src/types/library-name.d.ts

# Add types
declare module 'library-name' {
  export function someFunction(): ReturnType
}
```

### Issue: "Tests are failing"

**Solution:** Fix types to match runtime behavior
```typescript
// If test expects null but type says User
function getUser(): User | null { // Add | null
  return null
}
```

## 📞 Get Help

- **Claude Code:** Ask me for guidance
- **VS Code:** Use IntelliSense (hover, peek definition)
- **TypeScript Playground:** Test type logic
- **Stack Overflow:** Search for similar issues

## Summary

**You have:**
- ✅ Comprehensive analysis (LINT_ANALYSIS.md)
- ✅ Detailed strategies (FIX_STRATEGY.md)
- ✅ Automated scripts (scripts/)
- ✅ Category guides (add-return-types.md, fix-type-safety.md)
- ✅ This master guide

**You can:**
- Fix violations systematically in batches
- Track progress objectively
- Work at your own pace
- Get wins daily

**Expected timeline:**
- Casual pace (4-5 hrs/week): 16-20 weeks
- Steady pace (8-10 hrs/week): 12 weeks
- Aggressive pace (40 hrs/week): 6 weeks

**Start here:**
```bash
chmod +x scripts/*.sh
./scripts/fix-unused-vars.sh
cat scripts/output/unused-imports.txt
# Start fixing!
```

Good luck! You've got this. 💪
