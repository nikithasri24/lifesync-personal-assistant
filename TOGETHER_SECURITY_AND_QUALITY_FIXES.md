# Together Feature - Security & Quality Improvements

**Date:** 2026-02-17
**Status:** Implementation Phase 2 - Advanced Issues

---

## Overview

After the initial cleanup pass (console.log violations, type mismatches, missing patterns), a second review revealed additional security vulnerabilities, performance issues, and code quality concerns. This document tracks all fixes.

---

## 🔴 Critical Security Fixes

### 1. RLS Policy Gaps (Task #11) ✅ FIXED

**Issue:** Database RLS policies allow viewing partner data but don't validate that `partner_id` matches the actual partner in the connection.

**Vulnerability:**
```sql
-- ❌ VULNERABLE: Checks connection exists but not partner_id
EXISTS (
  SELECT 1 FROM profile_connections
  WHERE id = milestones.connection_id
    AND status = 'active'
    AND auth.uid() IN (requester_id, receiver_id)
)
```

**Attack Scenario:**
1. User creates milestone with valid `connection_id`
2. Sets `partner_id` to ANY user ID (not their partner)
3. RLS allows access because connection is valid
4. User can view/manipulate data for unrelated users

**Fix:** Enhanced RLS policies with `partner_id` validation

```sql
-- ✅ SECURE: Validates partner_id matches other user in connection
EXISTS (
  SELECT 1 FROM profile_connections pc
  WHERE pc.id = milestones.connection_id
    AND pc.status = 'active'
    AND auth.uid() IN (pc.requester_id, pc.receiver_id)
    AND (
      milestones.partner_id IS NULL
      OR
      milestones.partner_id = CASE
        WHEN auth.uid() = pc.requester_id THEN pc.receiver_id
        WHEN auth.uid() = pc.receiver_id THEN pc.requester_id
      END
    )
)
```

**Files:**
- `/supabase/migrations/20260217_fix_together_rls_security.sql`

**Tables Fixed:**
- ✅ `milestones` - Enhanced SELECT and INSERT policies
- ✅ `partner_messages` - Enhanced INSERT policy
- ✅ `achievement_rewards` - Enhanced INSERT policy

---

### 2. Input Validation & XSS Prevention (Task #12) ✅ FIXED

**Issues:**
- No XSS sanitization for message bodies (rich text)
- No file type/size validation for uploads
- Basic form validation (only required fields checked)

**Risks:**
- **XSS Attack:** Malicious HTML/JavaScript in message bodies
- **DoS Attack:** Uploading huge files to exhaust storage
- **Malware Upload:** Uploading executable files disguised as images

**Fix:** Comprehensive validation layer

**Created: `src/together/utils/validation.ts`**

#### File Upload Validation

```typescript
// Image validation
validateImageFile(file): FileValidationResult
- Allowed types: JPEG, PNG, GIF, WebP
- Max size: 10 MB
- Sanitizes filename (prevents path traversal)

// Video validation
validateVideoFile(file): FileValidationResult
- Allowed types: MP4, WebM, QuickTime
- Max size: 100 MB

// Audio validation (background music)
validateAudioFile(file): FileValidationResult
- Allowed types: MP3, WAV
- Max size: 20 MB
```

#### XSS Sanitization

```typescript
// Sanitize rich text (allows safe HTML formatting)
sanitizeMessageBody(content: string): string
- Uses DOMPurify with safe tag whitelist
- Allowed: <p>, <strong>, <em>, <a>, headings, lists
- Blocks: <script>, <iframe>, <object>, event handlers
- Logs potential XSS attempts

// Sanitize plain text (strips all HTML)
sanitizePlainText(text: string): string
- Removes ALL HTML tags
- Use for titles, descriptions

// Sanitize titles (length limit)
sanitizeTitle(title: string, maxLength = 200): string
- Plain text only
- Truncates to max length
```

#### Form Validation

```typescript
// Milestone validation
validateMilestone(data): { valid: boolean; errors: Record<string, string> }
- Title: Required, max 200 chars
- Date: Required, valid date format
- Type: Must be one of allowed types
- For whom: Must be 'me', 'partner', or 'both'

// Message validation
validatePartnerMessage(data): { valid: boolean; errors: Record<string, string> }
- Title: Required, max 200 chars
- Body: Required, max 10,000 chars, XSS sanitized
- Reveal trigger: Must be valid trigger type
- Reveal date: Required for scheduled messages, must be future date

// Challenge validation
validateChallenge(data): { valid: boolean; errors: Record<string, string> }
- Title: Required, max 200 chars
- Target value: Must be > 0, < 1,000,000
- Reward description: Optional, max 1,000 chars
- Expiration: Optional, must be future date
```

#### URL Validation

```typescript
validateUrl(url: string): { valid: boolean; sanitized?: string; error?: string }
- Only allows HTTP/HTTPS protocols
- Prevents javascript:, data:, file: URLs
- Returns sanitized URL
```

**Dependencies Needed:**
```bash
npm install isomorphic-dompurify
```

---

## 🟡 Performance & UX Improvements

### 3. Granular Query Invalidation (Task #13) ⏳ PENDING

**Issue:** Mutations invalidate entire query keys, causing unnecessary refetches

```typescript
// ❌ Current: Invalidates ALL milestones
onSuccess: () => {
  void queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
}

// ✅ Better: Invalidate only affected queries
onSuccess: (data) => {
  // Invalidate lists
  void queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
  // Update specific item in cache
  queryClient.setQueryData(milestoneKeys.detail(data.id), data);
}
```

**Action Items:**
- Update `useMilestonesQuery.ts` to use granular invalidation
- Update `usePartnerMessagesQuery.ts` similarly
- Update `useAchievementRewardsQuery.ts` similarly

---

### 4. Optimistic Updates (Task #14) ⏳ PENDING

**Issue:** All mutations wait for server response before updating UI

**Current Experience:**
1. User completes challenge
2. UI shows loading spinner
3. Wait 200-500ms for server
4. UI updates

**Better Experience (Optimistic):**
1. User completes challenge
2. UI updates **instantly** (optimistic)
3. Server confirms in background
4. Rollback if error (rare)

**Example Implementation:**

```typescript
export function useUpdateAchievementProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProgress,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: achievementRewardKeys.detail(variables.id) });

      // Snapshot previous value
      const previous = queryClient.getQueryData(achievementRewardKeys.detail(variables.id));

      // Optimistically update
      queryClient.setQueryData(achievementRewardKeys.detail(variables.id), (old) => ({
        ...old,
        current_progress: variables.progress,
        progress_percentage: (variables.progress / old.target_value) * 100,
      }));

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(achievementRewardKeys.detail(variables.id), context.previous);
      }
    },
    onSettled: () => {
      // Refetch to ensure sync
      void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.all });
    },
  });
}
```

**Action Items:**
- Implement for completing challenges
- Implement for marking messages as read
- Implement for milestone updates

---

### 5. Pagination (Task #15) ⏳ PENDING

**Issue:** All messages/milestones loaded at once, could be slow with years of data

**Current:**
```typescript
// Loads ALL milestones (could be 100+)
const { data: milestones } = useMilestones();
```

**Better:**
```typescript
// Option 1: Pagination
const { data: milestonePage } = useMilestones({ page: 1, limit: 20 });

// Option 2: Infinite scroll (better for mobile)
const {
  data,
  fetchNextPage,
  hasNextPage,
} = useInfiniteMilestones({ limit: 20 });
```

**Implementation:**
- Add `useInfiniteMilestones` hook using `useInfiniteQuery`
- Add `useInfinitePartnerMessages` hook
- UI: Scroll to bottom loads more (or "Load More" button)

---

## 🟢 Code Quality Improvements

### 6. Modal State Management (Task #16) ⏳ PENDING

**Issue:** Manual `useState` for each modal instead of using `useModalState`

**Current (MilestonesView.tsx):**
```typescript
// ❌ Boilerplate for each modal (repetitive)
const [addMilestoneOpen, setAddMilestoneOpen] = React.useState(false);
const [editingMilestone, setEditingMilestone] = React.useState<string | null>(null);
const [viewingMilestone, setViewingMilestone] = React.useState<string | null>(null);

const openAddMilestone = () => setAddMilestoneOpen(true);
const closeAddMilestone = () => setAddMilestoneOpen(false);
// ... repeat for each modal
```

**Better:**
```typescript
// ✅ Clean, concise (per CLAUDE.md hook patterns)
const modals = useModalState({
  addMilestone: false,
  editingMilestone: null,
  viewingMilestone: null,
});

modals.open('addMilestone');
modals.close('editingMilestone');
modals.setState('viewingMilestone', id);
```

**Action Items:**
- Refactor `MilestonesView.tsx` to use `useModalState`
- Refactor `MessagesView.tsx` to use `useModalState`
- Refactor `ChallengesView.tsx` to use `useModalState`

**Benefit:** Reduces ~30 lines of boilerplate per component

---

### 7. Standardize Error Handling (Task #17) ⏳ PENDING

**Issue:** Inconsistent error handling across mutations

**Current State:**
```typescript
// Some modals: Toast error
onError: (error) => {
  toast(getUserErrorMessage(error), 'error');
}

// Others: Silent failure (just logs)
onError: (error) => {
  logger.error('Together', error);
  // User sees nothing!
}

// Others: Error state in component
const [error, setError] = useState<string | null>(null);
```

**Standard Pattern:**
```typescript
// ✅ Consistent: Error boundary + toast
export function useCreateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMilestone,
    onSuccess: (data) => {
      toast('Milestone created!', 'success');
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
    },
    onError: (error) => {
      const message = getUserErrorMessage(error);
      toast(message, 'error');
      logger.error('Together', error as Error, {
        operation: 'createMilestone',
      });
    },
  });
}
```

**Action Items:**
- Add toast notifications to ALL mutations
- Log ALL errors with context
- Remove silent failures

---

### 8. Type Guards (Task #18) ⏳ PENDING

**Issue:** Unsafe null checks without type guards

**Current (MessagesView.tsx):**
```typescript
// ❌ Optional chaining but no type guard
const viewingMessage = viewingMessageId
  ? messages.find(m => m.id === viewingMessageId) || null
  : null;

// Later in JSX:
{viewingMessage && (
  <ViewMessageModal message={viewingMessage} onClose={...} />
  //                          ^ TypeScript doesn't guarantee this exists
)}
```

**Better:**
```typescript
// ✅ Type guard ensures safety
import { isPartnerMessage } from '@/together/types/guards';

const viewingMessage = viewingMessageId
  ? messages?.find(m => m.id === viewingMessageId)
  : undefined;

if (viewingMessage && isPartnerMessage(viewingMessage)) {
  // TypeScript KNOWS viewingMessage is PartnerMessage here
  return <ViewMessageModal message={viewingMessage} onClose={...} />;
}
```

**Action Items:**
- Create `src/together/types/guards.ts` with type guards
- Add `isPartnerMessage`, `isMilestone`, `isAchievementReward`
- Replace `|| null` patterns with type guards
- Update components to use type guards

---

## Implementation Priority

### Phase 1: Security (CRITICAL) ✅
- ✅ Task #11: RLS policy fixes - **COMPLETE**
- ✅ Task #12: Input validation - **COMPLETE**

### Phase 2: Performance (IMPORTANT) ⏳
- Task #13: Granular invalidation
- Task #14: Optimistic updates
- Task #15: Pagination

### Phase 3: Code Quality (NICE TO HAVE) ⏳
- Task #16: Modal state refactor
- Task #17: Error handling
- Task #18: Type guards

---

## Testing Strategy

### Security Testing
- [ ] Test RLS policies with malicious `partner_id` values
- [ ] Test XSS injection in message bodies
- [ ] Test file upload with invalid types/sizes
- [ ] Test URL validation with javascript: protocol

### Performance Testing
- [ ] Load 100+ milestones and measure render time
- [ ] Test infinite scroll with 200+ messages
- [ ] Measure time-to-interactive with optimistic updates

### Quality Testing
- [ ] Verify error handling shows user-friendly messages
- [ ] Test type guards catch invalid data
- [ ] Verify modal state management works correctly

---

## Dependencies to Add

```json
{
  "dependencies": {
    "isomorphic-dompurify": "^2.11.0"
  }
}
```

Install with:
```bash
npm install isomorphic-dompurify
```

---

## Files Created/Modified

### Created
- `/supabase/migrations/20260217_fix_together_rls_security.sql` - RLS fixes
- `/src/together/utils/validation.ts` - Validation & sanitization

### Modified (Pending)
- `/src/together/hooks/useMilestonesQuery.ts` - Granular invalidation
- `/src/together/hooks/usePartnerMessagesQuery.ts` - Granular invalidation
- `/src/together/hooks/useAchievementRewardsQuery.ts` - Optimistic updates
- `/src/together/components/MilestonesView.tsx` - useModalState
- `/src/together/components/MessagesView.tsx` - useModalState
- `/src/together/components/ChallengesView.tsx` - useModalState

---

## Key Takeaways

1. **Security is paramount** - RLS policies and input validation prevent serious vulnerabilities
2. **Performance matters** - Pagination and optimistic updates improve UX significantly
3. **Code quality saves time** - Using established patterns (useModalState) reduces boilerplate
4. **Testing prevents regressions** - Comprehensive test coverage ensures fixes work

---

**Next Steps:** Apply validation functions to all forms, run security tests, implement performance optimizations.
