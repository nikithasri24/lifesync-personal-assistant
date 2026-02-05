# Quick Start: Quality Improvements

**Goal**: Fix technical debt systematically and prevent future issues

---

## 🚀 Getting Started (5 minutes)

### Step 1: Run Quality Report

See current state of the codebase:

```bash
./scripts/quality-report.sh
```

This shows:
- Code quality issues (any types, console calls, etc.)
- Accessibility problems
- Code duplication
- **Quality Score** (0-100)

---

### Step 2: Find Specific Issues

```bash
# See all issue categories
./scripts/find-issues.sh all

# Find specific issues
./scripts/find-issues.sh any         # Find 'any' types
./scripts/find-issues.sh console     # Find console.* usage
./scripts/find-issues.sh aria        # Find missing ARIA labels
./scripts/find-issues.sh duplicates  # Find duplicate code
```

---

### Step 3: Run Auto-Fix

Fix what can be automated:

```bash
./scripts/auto-fix.sh
```

This automatically:
- ✅ Formats code with Prettier
- ✅ Fixes auto-fixable ESLint issues
- ✅ Reports TypeScript errors

---

## 📋 Prioritized Fix Plan

### Phase 1: Quick Wins (4-6 hours) ⚡

**Do these first for immediate impact:**

1. **Add Error Boundary** (1 hour)
   - See: `TECHNICAL_DEBT_ELIMINATION_PLAN.md` Phase 2.1
   - Protects entire app from crashes

2. **Consolidate OwnerBadge** (2-3 hours)
   - Currently 3 duplicate implementations
   - See: `TECHNICAL_DEBT_ELIMINATION_PLAN.md` Phase 2.2
   - Affects 28 files

3. **Fix VisaCalculator N+1** (1 hour)
   - Performance improvement
   - See: `TECHNICAL_DEBT_ELIMINATION_PLAN.md` Phase 2.3

**Start with**:
```bash
# Track progress
./scripts/quality-report.sh > metrics-before.txt

# Work on Phase 1 fixes...

# Check improvement
./scripts/quality-report.sh > metrics-after-phase1.txt
diff metrics-before.txt metrics-after-phase1.txt
```

---

### Phase 2: Performance (8-12 hours) 🚀

1. **Add React.memo** to heavy components (6-8 hours)
   - TaskRow, TransactionRow, RecipeCard, etc.
   - See: `TECHNICAL_DEBT_ELIMINATION_PLAN.md` Phase 3.1

2. **Refactor ShoppingSmart.tsx** (4-6 hours)
   - Currently 600+ lines
   - Break into smaller components
   - See: `TECHNICAL_DEBT_ELIMINATION_PLAN.md` Phase 3.2

---

### Phase 3: Type Safety (6-10 hours) 🎯

1. **Remove 'any' types** (4-6 hours)
   - Currently ~30 instances
   - See: `TECHNICAL_DEBT_ELIMINATION_PLAN.md` Phase 4.1

2. **Add type guards** (2-3 hours)
   - Runtime type validation
   - See: `TECHNICAL_DEBT_ELIMINATION_PLAN.md` Phase 4.2

---

### Phase 4: Accessibility (6-8 hours) ♿

1. **Add ARIA labels** (4 hours)
   - Buttons, inputs, interactive elements
   - See: `TECHNICAL_DEBT_ELIMINATION_PLAN.md` Phase 5.1

2. **Keyboard navigation** (2 hours)
   - Tab navigation, Escape to close, etc.
   - See: `TECHNICAL_DEBT_ELIMINATION_PLAN.md` Phase 5.2

---

## 🛡️ Prevention (Set Up Once)

### Install Dependencies

```bash
# ESLint plugins for quality checks
npm install -D \
  eslint-plugin-jsx-a11y \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  husky \
  lint-staged
```

### Setup Pre-commit Hooks

```bash
npx husky install
npx husky add .husky/pre-commit "npm run type-check && npm run lint"
```

### Enable Strict TypeScript

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

### Add package.json Scripts

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json}\"",
    "fix-all": "bash scripts/auto-fix.sh",
    "quality": "bash scripts/quality-report.sh",
    "find-issues": "bash scripts/find-issues.sh"
  }
}
```

---

## 📊 Track Progress

### Daily Workflow

```bash
# Morning: Check current state
npm run quality

# Find specific issues to fix
npm run find-issues any

# Work on fixes...

# Before committing: Auto-fix
npm run fix-all

# Check improvements
npm run quality
```

### Weekly Review

```bash
# Generate weekly report
npm run quality > quality-week-$(date +%U).txt

# Compare to previous week
diff quality-week-*.txt
```

---

## 🎯 Success Metrics

Track these over time:

| Metric | Before | Target | Current |
|--------|--------|--------|---------|
| 'any' types | 30 | 0 | ? |
| console.* | 50 | 0 | ? |
| Missing ARIA | 100 | 0 | ? |
| Quality Score | ? | 90+ | ? |
| Test Coverage | 40% | 80% | ? |

**Update Current**:
```bash
npm run quality
```

---

## 💡 Tips for Efficient Fixes

### 1. Start Small
- Fix one type of issue at a time
- One module at a time (e.g., all Finance, then Shopping)
- Commit frequently

### 2. Use Search & Replace
```bash
# Find all instances
grep -r "console.log" src

# Replace with logger
# Use your editor's find/replace across files
```

### 3. Leverage AI
- Use Claude Code to help with:
  - Adding React.memo to components
  - Converting 'any' to proper types
  - Adding ARIA labels
  - Writing type guards

### 4. Test As You Go
```bash
npm test -- --watch
```

---

## 🚨 Common Issues & Solutions

### "Too many TypeScript errors!"
**Solution**: Enable strict mode gradually
```bash
# Fix one module at a time
npx tsc --noEmit src/finance/**/*.ts
```

### "ESLint errors won't auto-fix"
**Solution**: Some need manual fixes
```bash
# See what can't be fixed
npm run lint 2>&1 | grep "error"
```

### "Quality score not improving"
**Solution**: Focus on high-impact issues first
- OwnerBadge consolidation: Big impact
- Remove 'any' types: Big impact
- ARIA labels: Big impact

---

## 📚 Resources

- **Full Plan**: `TECHNICAL_DEBT_ELIMINATION_PLAN.md`
- **Component Patterns**: Will be in `docs/COMPONENT_PATTERNS.md`
- **Coding Standards**: Will be in `docs/CODING_STANDARDS.md`

---

## 🎉 Quick Start Commands

```bash
# Check current state
npm run quality

# Find issues
npm run find-issues all

# Auto-fix what's possible
npm run fix-all

# Start with Phase 1 (Quick Wins)
# See TECHNICAL_DEBT_ELIMINATION_PLAN.md Phase 2
```

---

## ⏱️ Time Estimates

- **Phase 1 (Quick Wins)**: 4-6 hours
- **Phase 2 (Performance)**: 8-12 hours
- **Phase 3 (Type Safety)**: 6-10 hours
- **Phase 4 (Accessibility)**: 6-8 hours

**Total**: 24-36 hours spread over 2-3 weeks

**Suggested Schedule**:
- Week 1: Phase 1 + start Phase 2
- Week 2: Finish Phase 2 + Phase 3
- Week 3: Phase 4 + cleanup

---

## ✅ Ready to Start?

1. Run quality report: `./scripts/quality-report.sh`
2. Review: `TECHNICAL_DEBT_ELIMINATION_PLAN.md`
3. Start with Phase 1 Quick Wins
4. Track progress daily with `npm run quality`

**Let's build quality into the process!** 🚀
