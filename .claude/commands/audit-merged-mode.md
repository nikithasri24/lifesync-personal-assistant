# Audit Merged Mode Implementation

Comprehensively audit all features in the LifeSync app to determine merged mode implementation status, identify gaps, and provide actionable recommendations.

## Process:

1. **Identify all features in the app:**
   - Check `src/pages/` for main feature pages
   - Check `src/api/` for API modules
   - Common features: Tasks, Habits, Finance, Shopping, Meals, Goals, Travel, Notes, Projects, Calendar, Journal, Focus, Skincare, Nutrition

2. **For each feature, check 5 implementation layers:**

   ### Layer 1: API Level
   - Read `src/api/{feature}API.ts` or `src/{feature}/api/`
   - Look for: `getMergedConnectionId('{feature}')`
   - Look for: Cached merged connection variable
   - Look for: RLS policy comments indicating merged support
   - Check if API fetches both user's and partner's data when merged

   ### Layer 2: Database/Migration Level
   - Check `supabase/migrations/` for feature's table
   - Look for: `user_id` field (owner identification)
   - Look for: Optional `connection_id` field (shared records)
   - Look for: RLS policies mentioning `profile_connections`
   - Look for: Policies allowing partner data access

   ### Layer 3: Hooks Level
   - Check `src/hooks/use{Feature}Query.ts` or `src/{feature}/hooks/`
   - Look for: `useMerged{Feature}ConnectionQuery()` hook
   - Look for: `useQuery` hooks that fetch merged data
   - Check if hooks use `getMergedConnectionId` result

   ### Layer 4: UI Components Level
   - Check `src/{feature}/components/` or `src/components/{feature}/`
   - Look for: `<OwnerBadge>` component usage
   - Look for: `<OwnerFilter>` component (All/Mine/Partner dropdown)
   - Look for: Owner information display (e.g., "Me" vs partner name)
   - Check if components show whose data belongs to whom

   ### Layer 5: Page Level
   - Check `src/pages/{Feature}.tsx` or `src/{feature}/pages/`
   - Look for: Merged connection query being used
   - Look for: Owner filtering logic
   - Check if page properly displays merged data

3. **For each feature, assign status:**
   - ✅ **Complete**: All 5 layers implemented correctly
   - 🟡 **Partial**: Some layers implemented (e.g., API ready, UI missing)
   - ❌ **Missing**: No merged mode support

4. **Verify merged mode infrastructure:**
   - Check `src/shared/api/SharedDataProvider.ts` exists
   - Verify `getMergedConnectionId(module)` function exists
   - Check `src/shared/api/connectionsAPI.ts` for connection management
   - Verify `profile_connections` table exists
   - Verify `module_permissions` table exists

5. **Check for common components:**
   - Look for reusable `OwnerBadge` component
   - Look for reusable `OwnerFilter` component
   - Check if finance has owner utilities that can be reused

6. **Identify implementation patterns:**
   - Document the standard pattern used in complete features
   - Note any variations or inconsistencies
   - Identify best practices

7. **Generate comprehensive report:**

## Report Structure:

### 1. Executive Summary
- Total features analyzed
- Features with complete merged mode
- Features with partial merged mode
- Features missing merged mode
- Overall completion percentage

### 2. Infrastructure Status
- ✅/❌ `SharedDataProvider.ts` exists and functional
- ✅/❌ `connectionsAPI.ts` exists
- ✅/❌ Database tables (`profile_connections`, `module_permissions`)
- ✅/❌ Reusable UI components (`OwnerBadge`, `OwnerFilter`)

### 3. Feature-by-Feature Breakdown

For each feature, provide:

```
### [Feature Name] - [Status ✅/🟡/❌]

**API Layer**: ✅/🟡/❌
- File: src/api/[feature]API.ts
- getMergedConnectionId: [Yes/No]
- Fetches partner data: [Yes/No/Unknown]
- Notes: [Any observations]

**Database Layer**: ✅/🟡/❌
- Migration file: [filename or "Not found"]
- RLS policies: [Yes/No]
- Supports merged access: [Yes/No]
- Notes: [Any observations]

**Hooks Layer**: ✅/🟡/❌
- Hook file: [path or "Not found"]
- Merged connection hook: [Yes/No]
- Notes: [Any observations]

**UI Components**: ✅/🟡/❌
- Owner badges: [Yes/No]
- Owner filter: [Yes/No]
- Components checked: [list]
- Notes: [Any observations]

**Page Integration**: ✅/🟡/❌
- Page file: [path]
- Uses merged data: [Yes/No]
- Notes: [Any observations]

**Overall Status**: [Complete/Partial/Missing]
**Estimated effort to complete**: [e.g., "2 hours", "30 minutes", "N/A"]
**Priority for user**: [High/Medium/Low based on collaboration value]
```

### 4. Prioritized Action Plan

List features in order of implementation priority:

**Priority 1 - High Collaboration Value (Implement First):**
- Tasks/Todos - [Status] - [Reason: daily shared task lists]
- Projects - [Status] - [Reason: project collaboration]

**Priority 2 - Medium Collaboration Value:**
- Calendar - [Status]
- Habits - [Status]

**Priority 3 - Low Priority / Optional:**
- Journal - [Status] - [Reason: private by nature]

### 5. Common Issues Found

List any patterns of problems:
- Missing RLS policies
- Inconsistent owner badge usage
- API fetches but UI doesn't display ownership
- etc.

### 6. Recommendations

- Quick wins (features almost complete, small effort to finish)
- Standard implementation template to follow
- Common pitfalls to avoid
- Suggested next steps

### 7. Implementation Checklist Template

Provide a checklist for adding merged mode to a new feature:

```
## Adding Merged Mode to [Feature]

- [ ] API: Add getMergedConnectionId('[feature]') call
- [ ] API: Cache merged connection result
- [ ] API: Update fetch logic to include partner data
- [ ] Migration: Add/verify RLS policy for merged access
- [ ] Hooks: Create useMerged[Feature]ConnectionQuery()
- [ ] UI: Add OwnerBadge to list items
- [ ] UI: Optional - Add OwnerFilter dropdown
- [ ] Page: Integrate merged connection query
- [ ] Test: Verify data shows for both users
- [ ] Test: Verify owner information displays correctly
```

## Important Rules:

- ✅ DO check EVERY major feature
- ✅ DO provide specific file paths
- ✅ DO give concrete examples
- ✅ DO prioritize by collaboration value
- ✅ DO estimate effort to complete
- ❌ DO NOT skip features
- ❌ DO NOT make assumptions without checking files
- ❌ DO NOT list features without verifying their existence

## Features to Check:

Core productivity:
- Tasks/Todos
- Projects
- Habits
- Focus/Pomodoro
- Notes

Finance:
- Finance (already complete, verify)

Planning:
- Calendar
- Meal Planning (already complete, verify)
- Shopping (already complete, verify)

Lifestyle:
- Travel/Visa (partial, complete audit)
- Life Goals (already complete, verify)
- Journal
- Nutrition
- Skincare/Self-Care

Other:
- National Parks
- Gamification

## Output Format:

Generate a markdown report that can be saved as:
`MERGED_MODE_AUDIT_REPORT_[DATE].md`

Include:
- Date of audit
- LifeSync version/commit hash
- Total features analyzed
- Summary table with all features and status
- Detailed breakdown per feature
- Action plan

## Verification Steps:

After generating report:
1. Verify all file paths are correct
2. Double-check status assignments
3. Ensure recommendations are actionable
4. Prioritize realistically based on user value
5. Include time estimates

## Example Output Snippet:

```markdown
# Merged Mode Audit Report
Date: 2026-02-04
Commit: 7375e64

## Summary
- Total Features: 15
- Complete: 5 (33%)
- Partial: 1 (7%)
- Missing: 9 (60%)

## Status Table

| Feature | API | DB/RLS | Hooks | UI | Page | Status | Priority |
|---------|-----|--------|-------|----|----|--------|----------|
| Shopping | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | - |
| Finance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete | - |
| Tasks | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ Missing | High |
| Projects | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ Missing | High |
...

[Detailed breakdown follows]
```

## Definition of Done:

- [ ] All features checked across 5 layers
- [ ] Status assigned to each feature
- [ ] File paths verified
- [ ] Priority assigned based on collaboration value
- [ ] Effort estimates provided
- [ ] Action plan created
- [ ] Report generated in markdown format
- [ ] Recommendations are specific and actionable
