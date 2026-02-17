# Journal Tab UI/UX Enhancement Plan

**Status:** Ready to implement
**Reference Implementation:** Notes tab (commit 863a16f)
**Design Spec:** `journal-design-spec.html`
**Complexity:** Medium (2-3 hours, similar to Notes)

## Context

The Journal feature needs to match the Together tab UI/UX patterns, just like we completed for Notes. This document contains all lessons learned from the Notes implementation to prevent rework.

---

## Phase 0: Discovery & Setup (START HERE)

**Goal:** Understand current architecture and prevent issues before coding

### 1. Check for Duplicate Header
```bash
# Run the app and navigate to Journal page
# Look for duplicate "Journal" text (one from Layout, one from component)
```

**If duplicate exists:**
- Update `src/components/Layout.tsx` lines 295 and 340
- Add `&& activeView !== 'journal'` to both mobile and desktop header conditions
- Example: `{!isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'journal' && (`

### 2. Investigate Database Schema
```bash
# Check what tables store journal data
# Look for: journal_entries, attachments, tags, moods, etc.
```

**Files to check:**
- `src/api/journalAPI.ts` or similar
- `src/types/index.ts` (Journal interface)
- Database schema files

**Questions to answer:**
- Are moods stored in the main entry or separate table?
- Are tags stored in the main entry or separate table?
- Are attachments in a separate table? (like list_items for Notes)
- If separate tables exist, we'll need `useQueries` to fetch them

### 3. Verify API Functions Exist
**Files:** `src/api/journalAPI.ts`, `src/hooks/useJournalQuery.ts`

Check for:
- ✅ `getJournalEntries()` - Read
- ✅ `createJournalEntry()` - Create
- ⚠️ `updateJournalEntry()` - **Check if implemented** (was TODO in Notes)
- ⚠️ `deleteJournalEntry()` - **Check if implemented**

**Action:** If update/delete are TODO, implement them first before UI work.

### 4. Review Current V2 Components
**Location:** `src/journal/components/v2/`

Existing files:
- `JournalHeaderV2.tsx` - Needs update to match Together style
- `JournalEntryCardV2.tsx` - Needs styling updates
- `JournalEntryModalV2.tsx` - Needs complete overhaul
- `JournalCalendarViewV2.tsx` - Review if needed
- `index.ts` - Barrel export

### 5. Check for Merged Mode
- Does journal support partner sharing?
- Look for `useMergedJournalConnectionQuery` or similar
- If yes, we'll need OwnerFilter pills

---

## Reference: Notes Implementation

**Commit:** `863a16f`
**Files to reference:**
- `src/pages/Notes.tsx` - Main page structure
- `src/notes/components/v2/NoteFormModalV2.tsx` - Modal pattern
- `src/notes/components/v2/NoteCardV2.tsx` - Card styling
- `src/notes/components/v2/NotesHeaderV2.tsx` - Header style
- `src/components/common/OwnerFilter.tsx` - Filter pills

**Key patterns used:**
```jsx
// 1. Centered layout
<div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
  <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
    {/* Content */}
  </div>
</div>

// 2. Modal state management
const modals = useModalState({
  showForm: false,
  editingEntryId: null as string | null,
});

// 3. Fetching related data (if needed)
const relatedDataQueries = useQueries({
  queries: entries.filter(e => needsExtraData).map(entry => ({
    queryKey: ['relatedData', entry.id],
    queryFn: () => fetchRelatedData(entry.id),
  })),
});

// 4. Success toasts
showToast('Entry created! 📔', 'success');
showToast('Entry updated! ✏️', 'success');
showToast('Entry deleted! 🗑️', 'success');
```

---

## Implementation Phases

### Phase 1: Page Layout

**File:** `src/journal/JournalPage.tsx` or container component

**Changes:**
1. Add centered container wrapper (900px max-width)
2. Add `useThemeColors()` hook
3. Update Layout.tsx to exclude journal from header (if duplicate)

**Example:**
```jsx
const JournalPage: React.FC = () => {
  const colors = useThemeColors();

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        <JournalHeaderV2 />
        {/* Rest of content */}
      </div>
    </div>
  );
};
```

### Phase 2: Update JournalHeaderV2

**File:** `src/journal/components/v2/JournalHeaderV2.tsx`

**Change to simple style (remove gradient):**
```jsx
export const JournalHeaderV2: React.FC = () => {
  const colors = useThemeColors();

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
        <span className="text-4xl">📔</span>
        Journal
      </h1>
    </div>
  );
};
```

### Phase 3: Update JournalEntryModalV2 (CRITICAL)

**File:** `src/journal/components/v2/JournalEntryModalV2.tsx`

**Complete rewrite following Together pattern. Include:**

1. **Modal container with backdrop:**
```jsx
<div
  className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
  style={{
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
    marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
    paddingTop: 'env(safe-area-inset-top, 0px)',
    height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
  }}
  onClick={handleBackdropClick}
>
```

2. **Mobile drag handle:**
```jsx
<div className="lg:hidden pt-2 flex-shrink-0">
  <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
</div>
```

3. **Fixed header with close button:**
```jsx
<div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
  <h2 className="text-2xl font-bold text-gray-900">
    {isEditing ? 'Edit Entry' : 'New Entry'}
  </h2>
  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
    <X className="w-5 h-5 text-gray-500" />
  </button>
</div>
```

4. **Scrollable content area:**
```jsx
<div className="overflow-y-auto p-6 space-y-5 flex-1" style={{ maxHeight: 'calc(90vh - 140px)' }}>
  {/* Form fields */}
</div>
```

5. **Fixed footer with DELETE button:**
```jsx
<div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
  {/* DELETE BUTTON - Only when editing */}
  {isEditing && onDelete && (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => {
          if (window.confirm('Delete this entry? This cannot be undone.')) {
            onDelete();
          }
        }}
        className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl font-semibold text-red-600"
        aria-label="Delete entry"
      >
        🗑️ Delete Entry
      </button>
    </div>
  )}

  {/* Action buttons */}
  <div className="flex gap-3">
    <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700">
      Cancel
    </button>
    <button
      type="submit"
      disabled={isPending}
      className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
    >
      {isPending ? 'Saving...' : (isEditing ? 'Update Entry' : 'Create Entry')}
    </button>
  </div>
</div>
```

6. **Auto-save functionality:**
```jsx
const STORAGE_KEY = 'journal_entry_draft';

const loadDraft = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    logger.error('Journal', error as Error, { context: 'Failed to load draft' });
  }
  return null;
};

// Auto-save on change
useEffect(() => {
  if (!isEditing && (title || content)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, content, mood, tags }));
  }
}, [title, content, mood, tags, isEditing]);

// Clear on success
const handleSubmit = () => {
  // ... submit logic
  localStorage.removeItem(STORAGE_KEY);
  onClose();
};
```

7. **CRITICAL - Update form when initialData changes:**
```jsx
// This prevents the bug where clicking different entries doesn't update the modal
useEffect(() => {
  if (initialData) {
    setTitle(initialData.title || '');
    setContent(initialData.content || '');
    setMood(initialData.mood || '');
    setTags(initialData.tags?.join(', ') || '');
    // ... all other fields
  } else if (!isEditing) {
    // Reset to draft or defaults
    const draft = loadDraft();
    setTitle(draft?.title || '');
    setContent(draft?.content || '');
    // ...
  }
}, [initialData, isEditing]);
```

8. **ESC key support:**
```jsx
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  if (isOpen) {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }
}, [isOpen, onClose]);
```

9. **Backdrop click handler:**
```jsx
const handleBackdropClick = (e: React.MouseEvent) => {
  if (e.target === e.currentTarget) {
    onClose();
  }
};
```

10. **Props interface must include onDelete:**
```jsx
export interface JournalEntryModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JournalEntryData) => void;
  onDelete?: () => void; // IMPORTANT: Add this!
  initialData?: JournalEntryData;
  isEditing?: boolean;
  isPending?: boolean;
}
```

### Phase 4: Update JournalEntryCardV2

**File:** `src/journal/components/v2/JournalEntryCardV2.tsx`

**Match design spec styling:**
- Border-left accent (4px solid terracotta)
- White background
- Rounded corners (12px)
- Shadow: `0 2px 12px rgba(92, 74, 58, 0.08)`
- Title: 15px, bold, #5C4A3A
- Content preview: 13px, #6B5847, line-clamp-3
- Tags: #E8DCC8 background, 11px
- Timestamp: 11px, #9B8B7A (only in list view)
- Owner badge (if merged mode): absolute top-right

**Reference:** `src/notes/components/v2/NoteCardV2.tsx` (lines 72-215)

### Phase 5: Update Main Page with useModalState

**File:** Main journal container/page

**Import required hooks:**
```jsx
import { useModalState } from '../hooks/useModalState';
import { useToast } from '../hooks/useToast';
import { useThemeColors } from '../hooks/useThemeColors';
import { useQueries } from '@tanstack/react-query';
```

**Set up modal state:**
```jsx
const modals = useModalState({
  showForm: false,
  editingEntryId: null as string | null,
});

const { showToast } = useToast();
const colors = useThemeColors();
```

**Fetch related data if needed (like Notes list_items):**
```jsx
// Example: If moods/attachments are in separate table
const attachmentQueries = useQueries({
  queries: entries
    .filter(entry => entry.hasAttachments)
    .map(entry => ({
      queryKey: ['attachments', entry.id],
      queryFn: () => getAttachments(entry.id),
      enabled: !!entry.id,
    })),
});

// Create map for easy lookup
const attachmentsMap = useMemo(() => {
  const map = new Map();
  entries.forEach((entry, index) => {
    if (entry.hasAttachments) {
      const queryIndex = entries.slice(0, index).filter(e => e.hasAttachments).length;
      const items = attachmentQueries[queryIndex]?.data || [];
      map.set(entry.id, items);
    }
  });
  return map;
}, [entries, attachmentQueries]);
```

**Implement all CRUD handlers:**
```jsx
// Create/Update handler
const handleSubmit = (data: JournalEntryData) => {
  if (modals.state.editingEntryId) {
    // UPDATE
    updateMutation.mutate(
      {
        id: modals.state.editingEntryId,
        updates: data,
      },
      {
        onSuccess: () => {
          showToast('Entry updated! ✏️', 'success');
          modals.close('showForm');
          modals.set('editingEntryId', null);
        },
      }
    );
  } else {
    // CREATE
    createMutation.mutate(data, {
      onSuccess: () => {
        showToast('Entry created! 📔', 'success');
        modals.close('showForm');
      },
    });
  }
};

// Delete handler
const handleDelete = () => {
  if (modals.state.editingEntryId) {
    deleteMutation.mutate(modals.state.editingEntryId, {
      onSuccess: () => {
        showToast('Entry deleted! 🗑️', 'success');
        modals.close('showForm');
        modals.set('editingEntryId', null);
      },
    });
  }
};

// Edit handler
const handleEditEntry = (entry: JournalEntry) => {
  modals.set('editingEntryId', entry.id);
  modals.open('showForm');
};
```

**Get editing entry data:**
```jsx
const editingEntry = modals.state.editingEntryId
  ? entries.find(e => e.id === modals.state.editingEntryId)
  : null;

// If data is in separate tables, combine it
const editingContent = editingEntry
  ? {
      ...editingEntry,
      attachments: attachmentsMap.get(editingEntry.id) || [],
    }
  : null;
```

**Pass to modal:**
```jsx
<JournalEntryModalV2
  isOpen={modals.state.showForm}
  onClose={() => {
    modals.close('showForm');
    modals.set('editingEntryId', null);
  }}
  onSubmit={handleSubmit}
  onDelete={handleDelete} // IMPORTANT: Don't forget!
  initialData={editingContent}
  isEditing={!!modals.state.editingEntryId}
  isPending={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
/>
```

### Phase 6: View Toggle & Filters

**Update view toggle to Together style:**
```jsx
<div className="mb-6 p-1 rounded-xl flex gap-1" style={{ backgroundColor: colors.bg.secondary }}>
  <button
    onClick={() => setViewMode('list')}
    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
      viewMode === 'list' ? 'bg-white shadow-sm' : ''
    }`}
    style={{ color: viewMode === 'list' ? '#C18B5E' : colors.text.secondary }}
    aria-label="List view"
  >
    📄 List
  </button>
  <button
    onClick={() => setViewMode('calendar')}
    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
      viewMode === 'calendar' ? 'bg-white shadow-sm' : ''
    }`}
    style={{ color: viewMode === 'calendar' ? '#C18B5E' : colors.text.secondary }}
    aria-label="Calendar view"
  >
    📅 Calendar
  </button>
</div>
```

**If merged mode exists, add OwnerFilter:**
```jsx
{mergedConnection && (
  <div className="mb-6">
    <OwnerFilter
      value={ownerFilter}
      onChange={setOwnerFilter}
      partnerName={partnerName}
    />
  </div>
)}
```

### Phase 7: FAB Button

**Add floating action button:**
```jsx
<button
  onClick={() => {
    modals.set('editingEntryId', null);
    modals.open('showForm');
  }}
  className="fixed w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform active:scale-95"
  style={{
    bottom: '96px',
    right: '32px',
    background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
    boxShadow: '0 4px 16px rgba(193, 139, 94, 0.4)',
    zIndex: 50,
  }}
  aria-label="Create new entry"
>
  +
</button>
```

---

## Testing Checklist (CRITICAL)

Before committing, verify ALL of these:

### Functionality Tests
- [ ] Click entry → Modal opens with ALL content populated (not empty!)
- [ ] Click different entries → Modal updates each time (not stuck on first entry)
- [ ] Create new entry → Works + shows toast
- [ ] Update entry → Works + shows toast
- [ ] Delete entry → Shows confirmation + works + toast
- [ ] ESC key → Closes modal
- [ ] Click outside modal → Closes modal
- [ ] Auto-save → Close modal mid-entry, reopen → draft persists

### UI Tests
- [ ] No duplicate "Journal" header
- [ ] Content is centered (max 900px)
- [ ] Mobile: Modal slides from bottom, has drag handle
- [ ] Desktop: Modal is centered
- [ ] All entry content displays (check for data from separate tables)
- [ ] Tags/moods display correctly
- [ ] Timestamps show correctly
- [ ] View toggle works
- [ ] Owner filter works (if merged mode)

### Code Quality
- [ ] No TypeScript errors in journal files
- [ ] All debug logging removed
- [ ] Used `useModalState` (not manual useState)
- [ ] Success toasts on all operations
- [ ] Proper loading states (isPending)

---

## Common Pitfalls (From Notes Experience)

| ❌ Issue | ✅ Prevention |
|---------|--------------|
| Duplicate header | Update Layout.tsx in Phase 1 |
| Modal doesn't update when clicking different entries | Add useEffect for initialData in Phase 3 |
| Content shows as empty | Phase 0: Check for separate data tables, fetch with useQueries |
| Update function is TODO | Phase 0: Verify API exists before starting |
| No delete button | Phase 3: Add to modal from the start |
| Manual modal state management | Phase 5: Use useModalState hook |
| No user feedback | Phase 5: Add toasts to all operations |

---

## Files to Modify

**Estimate: 5-7 files**

### Must Update
1. `src/journal/JournalPage.tsx` or container - Main page structure
2. `src/journal/components/v2/JournalHeaderV2.tsx` - Header style
3. `src/journal/components/v2/JournalEntryModalV2.tsx` - Complete rewrite
4. `src/journal/components/v2/JournalEntryCardV2.tsx` - Card styling
5. `src/components/Layout.tsx` - Exclude journal from header (if duplicate)

### May Update
6. `src/journal/components/v2/index.ts` - Barrel exports
7. `src/api/journalAPI.ts` - If update/delete missing

---

## Commit Message Template

```
feat: Complete Journal tab UI/UX enhancement with Together tab patterns

Implements all 25 UI/UX enhancement standards from CLAUDE.md to match the Together tab reference implementation.

Key Changes:
- Centered page layout with 900px max-width container
- Simple header matching Together tab style
- Complete modal overhaul following Together patterns:
  * Full-screen overlay with blur backdrop
  * Mobile bottom-aligned, desktop centered
  * Safe area insets for mobile notches
  * Auto-save to localStorage with draft recovery
  * ESC key and backdrop click support
  * Fixed header/footer with scrollable content
  * Delete button with confirmation
- Entry card styling matching design spec
- [If applicable: Moods/attachments fetched from separate tables]
- Full CRUD operations with success toasts
- Used useModalState hook to reduce boilerplate
- View toggle and filters match Together style

Implementation Details:
- Updated V2 components in src/journal/components/v2/
- JournalEntryCardV2: Proper styling for entries
- JournalEntryModalV2: Complete Together pattern compliance
- JournalHeaderV2: Simple emoji + title header
- Updated Layout.tsx to hide duplicate header for Journal
- [If applicable: Fixed data loading from separate tables]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Next Steps

1. Start with Phase 0 (Discovery)
2. Work through phases sequentially
3. Test thoroughly before committing
4. Use Notes implementation as reference
5. Commit when all tests pass

**Good luck! 🚀**
