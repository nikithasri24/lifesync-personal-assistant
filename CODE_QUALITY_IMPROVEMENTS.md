# Code Quality Improvements - Prevention Strategy

**Date:** 2026-02-17
**Issue:** Recurring code quality issues in new features requiring cleanup rounds
**Solution:** Implemented comprehensive prevention strategy

---

## Problem Analysis

When implementing the Together feature, the following issues were discovered that required a second cleanup pass:

| Issue | Root Cause | Impact |
|-------|-----------|--------|
| Console.log violations | Not following CLAUDE.md standards | Technical debt, inconsistent logging |
| Status type mismatch (`'unlocked'` vs `'completed'`) | Not verifying database schema | Runtime bugs, type errors |
| Field name mismatch (`scheduled_for` vs `reveal_date`) | Guessing field names instead of checking | Database query failures |
| Missing error boundary | Not following established patterns | Poor error handling UX |
| Incomplete TODO | Leaving work unfinished | Feature gaps, confusion |
| No dedicated API layer | Not following architectural patterns | Code organization issues |
| No real-time subscriptions | Missing feature requirements | Poor collaborative UX |
| No merged mode | Not checking similar features | Missing expected functionality |

**Common Theme:** All issues stemmed from not checking existing patterns, standards, and schemas before writing code.

---

## Solutions Implemented

### 1. Pre-Coding Checklist (`.claude/PRE_CODING_CHECKLIST.md`)

**Purpose:** Mandatory checklist to complete BEFORE writing any new feature

**Sections:**
1. **Standards Review** (5 min)
   - Read CLAUDE.md
   - Review logging, error handling, accessibility requirements
   - Review hook patterns and size limits

2. **Pattern Research** (10 min)
   - Find 1-2 similar existing features
   - Study their file structure and architecture
   - Check for error boundaries, merged mode, real-time, API layer

3. **Database Schema Verification** (5 min)
   - Check migrations for exact field names
   - Verify types and nullability
   - Document DB → TypeScript mapping

4. **Required Patterns Checklist**
   - 🔴 Critical: Logger, typed errors, error boundaries, accessibility
   - 🟡 Architectural: API layer, React Query hooks, hook size limits
   - 🟢 Feature-specific: Merged mode, real-time updates

5. **Implementation Plan**
   - Answer key questions before coding
   - List database tables/fields
   - Document key user flows
   - Plan error handling

6. **Code Review Self-Check**
   - Verify no console.log
   - Verify typed error classes
   - Verify ARIA labels
   - Verify API layer separation
   - Verify no TODOs
   - Verify schema field names

7. **Testing Checklist**
   - Happy path, error states, loading states
   - Accessibility, real-time, merged mode

**Time Investment:** 20 minutes of planning saves hours of refactoring

---

### 2. Updated `.claude/rules.md`

**Added mandatory section at the top:**

```markdown
### 🔴 MANDATORY: Pre-Coding Checklist (Added 2026-02-17)

BEFORE writing ANY new feature or significant code change:
1. READ .claude/PRE_CODING_CHECKLIST.md - This is MANDATORY
2. COMPLETE all checklist items before writing code
3. VERIFY you've followed existing patterns
```

**Why this works:**
- Impossible to miss (at top of rules file)
- Clear consequence (technical debt)
- Emphasizes pattern-following

---

### 3. Reference Examples Table

Created quick reference for finding similar features:

| New Feature | Similar Feature | Reference Files |
|-------------|----------------|-----------------|
| Together | Habits, Goals | `src/habits/`, `src/goals/` |
| Shopping List | Meal Planning | `src/mealPlanning/` |
| Travel Planning | Finance | `src/finance/` |

---

### 4. Anti-Patterns Documentation

**Clear DON'Ts with WHY:**

❌ **DON'T:**
- Use `console.*` → Use `logger.*` (centralized, filterable, production-safe)
- Create generic `Error()` → Use typed classes (better error handling, user messages)
- Skip accessibility → Add ARIA labels (screen reader support, compliance)
- Embed Supabase in hooks → Create API layer (separation of concerns, testability)
- Leave TODOs → Complete or remove (prevents forgotten work)
- Guess DB field names → Verify schema (prevents runtime errors)
- Forget error boundaries → Wrap features (graceful error recovery)

---

### 5. Quick Reference Commands

Added bash commands to quickly check patterns:

```bash
# Check similar features
ls src/habits src/goals src/finance

# Find pattern examples
grep -r "FeatureErrorBoundary" src/pages/
grep -r "useMerged" src/hooks/
grep -r "logger.error" src/

# Verify database schema
cat supabase/migrations/*_create_[table].sql
```

---

## Expected Benefits

### Immediate Benefits

1. **Fewer Cleanup Rounds**
   - Code written correctly the first time
   - No need for "fix the issues" follow-up tasks

2. **Consistency**
   - All features follow same patterns
   - Easier for developers to navigate codebase

3. **Better Onboarding**
   - New developers have clear examples to follow
   - Checklist guides them through standards

### Long-term Benefits

1. **Reduced Technical Debt**
   - Standards enforced from day one
   - Less accumulation of "quick fixes"

2. **Faster Development**
   - No time wasted on cleanup
   - Patterns become muscle memory

3. **Higher Quality**
   - Better error handling
   - Better accessibility
   - Better architecture

---

## How to Use (For Claude)

### When User Requests New Feature

**Step 1:** Before ANY code
```
"I'm going to start by reviewing the Pre-Coding Checklist..."
```

**Step 2:** Review similar features
```
"I found that [Feature X] is similar. Let me study its patterns:
- Has error boundary: Yes/No
- Has API layer: Yes/No
- Has merged mode: Yes/No
- File structure: ..."
```

**Step 3:** Verify schema
```
"Checking database schema:
- Table: [table_name]
- Fields: [field1 (type), field2 (type)]
- Mapping: DB snake_case → TS camelCase"
```

**Step 4:** Present plan
```
"Here's my implementation plan:

Files to create:
- src/[feature]/api/[feature]API.ts
- src/[feature]/hooks/use[Feature]Query.ts
- src/[feature]/components/[Feature]View.tsx

Patterns to follow:
- Error boundary: ✓
- API layer: ✓
- Logger service: ✓
- Merged mode: ✓

Ready to proceed?"
```

**Step 5:** After coding, self-check
```
"Self-check before showing code:
- ✓ No console.log
- ✓ Typed errors
- ✓ ARIA labels
- ✓ Error boundary
- ✓ API layer
- ✓ No TODOs
- ✓ Schema verified"
```

---

## Metrics to Track Success

### Before Implementation (Baseline)
- Together feature: 8 issues requiring fixes
- Time spent: 2 hours coding + 1 hour fixing = 3 hours total

### After Implementation (Target)
- Next feature: 0-2 minor issues
- Time spent: 0.5 hours planning + 2 hours coding = 2.5 hours total
- **Savings: 0.5 hours per feature + higher quality**

### Success Criteria
- ✅ New features require <2 fix-up issues
- ✅ No console.log violations
- ✅ No schema field mismatches
- ✅ All features have error boundaries
- ✅ All features follow established patterns

---

## Example: How This Would Have Prevented Together Issues

| Issue | How Checklist Prevents It |
|-------|--------------------------|
| Console.log violations | **Standards Review** section: "Review logging requirements (use logger, never console.*)" |
| Status type mismatch | **Schema Verification** section: "Verify exact column names, types" |
| Field name mismatch | **Schema Verification** section: "Check migrations for exact field names" |
| Missing error boundary | **Pattern Research** section: "Check if similar feature has error boundary wrapper" + **Required Patterns**: "Error boundary - Must have" |
| Incomplete TODO | **Code Review Self-Check** section: "Verify no TODOs left incomplete" |
| No API layer | **Pattern Research** section: "Check if similar feature has dedicated API layer" + **Required Patterns**: "API Layer Separation - Should have" |
| No real-time | **Pattern Research** section: "Check for real-time subscriptions" |
| No merged mode | **Pattern Research** section: "Check for merged mode support" + **Required Patterns**: "Merged Mode - Nice to have (if multi-user)" |

**Result:** All 8 issues would have been caught during the 20-minute planning phase!

---

## Rollout Plan

### Phase 1: Immediate (Completed)
- ✅ Created `.claude/PRE_CODING_CHECKLIST.md`
- ✅ Updated `.claude/rules.md` to mandate checklist
- ✅ Documented this improvement strategy

### Phase 2: Next Feature
- Test checklist on next new feature
- Collect feedback on checklist effectiveness
- Refine checklist based on experience

### Phase 3: Enforcement
- Add checklist verification to PR template
- Consider automated checks where possible
- Update checklist as new patterns emerge

---

## Conclusion

**The Problem:** Rushing into coding without reviewing standards and patterns leads to preventable issues.

**The Solution:** Mandatory 20-minute pre-coding checklist that ensures:
- Standards compliance (CLAUDE.md)
- Pattern consistency (similar features)
- Schema accuracy (migrations)
- Architecture alignment (API layer, error boundaries, etc.)

**The Result:** Code that's right the first time, saving hours of cleanup and improving overall quality.

**Key Insight:** "An ounce of prevention is worth a pound of cure" - 20 minutes of planning prevents hours of refactoring.

---

## Next Steps

1. ✅ Checklist created and mandated
2. 📝 Apply checklist to next new feature
3. 📊 Measure success (issues found during development vs after)
4. 🔄 Iterate and improve checklist based on results
5. 📚 Share lessons learned with team

---

**Remember:** The goal isn't perfection, but continuous improvement. Every feature should be better than the last.
