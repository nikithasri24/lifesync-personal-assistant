# Habits Tab UI/UX Enhancement Plan

**Status:** Ready to implement
**Reference Implementation:** Notes tab (commit 863a16f)
**Design Spec:** `habits-design-spec.html`
**Complexity:** Medium-High (3-4 hours - has streak tracking + daily completions)

## Context

The Habits feature needs to match the Together tab UI/UX patterns, just like we completed for Notes and Journal. Habits is slightly more complex due to:
- Daily completion tracking (habit_entries table)
- Streak calculations
- Weekly/monthly views
- Progress indicators

This document contains all lessons learned from the Notes implementation to prevent rework.

---

## Phase 0: Discovery & Setup (START HERE)

**Goal:** Understand current architecture and prevent issues before coding

### 1. Check for Duplicate Header
```bash
# Run the app and navigate to Habits page
# Look for duplicate "Habits" text (one from Layout, one from component)
```

**If duplicate exists:**
- Update `src/components/Layout.tsx` lines 295 and 340
- Add `&& activeView !== 'habits'` to both mobile and desktop header conditions
- Example: `{!isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'journal' && activeView !== 'habits' && (`

### 2. Understand Database Schema ✅
**Known structure:**
- **Main table:** `habits` - Stores habit definitions (name, frequency, target, etc.)
- **Completions table:** `habit_entries` - Stores daily completions (habit_id, date, notes)
- **Separate data:** YES - Like Notes list_items, completions are in separate table

**Key insight:** Must use `useQueries` or `useHabitEntries` to fetch completions separately.

### 3. Review Current Implementation ✅

**Files checked:**
- `src/pages/Habits.tsx` - Already migrated to React Query ✅
- `src/hooks/useHabitsQuery.ts` - All CRUD operations exist ✅
- `src/habits/components/v2/` - V2 components started ✅

**API functions available:**
- ✅ `useHabits()` - Fetch all habits
- ✅ `useHabitEntries()` - Fetch completions
- ✅ `useCreateHabit()` - Create
- ✅ `useUpdateHabit()` - Update
- ✅ `useDeleteHabit()` - Delete
- ✅ `useCreateHabitEntry()` - Mark complete
- ✅ `useDeleteHabitEntriesForDate()` - Unmark complete
- ✅ `useMergedHabitsConnectionQuery()` - Merged mode ✅

**Good news:** All CRUD operations already implemented!

### 4. Current V2 Components ✅

**Location:** `src/habits/components/v2/`

**Existing files:**
- `HabitsHeaderV2.tsx` - Needs update to match Together style
- `HabitCardV2.tsx` - Needs styling updates
- `HabitFormModalV2.tsx` - Needs Together pattern overhaul
- `StreakIndicatorV2.tsx` - Streak display component (keep as-is?)
- `index.ts` - Barrel export

### 5. Merged Mode ✅
- **YES** - Habits supports partner sharing
- Uses `useMergedHabitsConnectionQuery()`
- **Action:** We'll need OwnerFilter pills

---

## Habits-Specific Considerations

### Key Differences from Notes/Journal:

1. **Completions in separate table**
   - Similar to Notes list_items
   - Must fetch habit_entries separately
   - Need to map entries to habits by date

2. **Daily tracking**
   - Users check off habits each day
   - Need "Mark Complete" toggle on cards
   - Today's date is important

3. **Streak calculation**
   - Display current streak
   - Show progress toward target
   - Visual indicators (fire emoji, progress bars)

4. **Frequency types**
   - Daily, Weekly, Custom
   - Different completion rules
   - Affects how we display progress

5. **No "edit content" like Notes**
   - Habits are templates (name, target, frequency)
   - Completions are just checkmarks with optional notes
   - Modal is for editing the habit definition, not entries

---

## Reference: Notes Implementation

**Commit:** `863a16f`
**Files to reference:**
- `src/pages/Notes.tsx` - Main page structure
- `src/notes/components/v2/NoteFormModalV2.tsx` - Modal pattern
- `src/notes/components/v2/NoteCardV2.tsx` - Card styling
- `src/notes/components/v2/NotesHeaderV2.tsx` - Header style
- `src/components/common/OwnerFilter.tsx` - Filter pills

**Key patterns to reuse:**
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
  editingHabitId: null as string | null,
});

// 3. Success toasts
showToast('Habit created! 💪', 'success');
showToast('Habit updated! ✏️', 'success');
showToast('Habit deleted! 🗑️', 'success');
showToast('Marked complete! ✅', 'success');
```

---

## Implementation Phases

### Phase 1: Page Layout

**File:** `src/pages/Habits.tsx`

**Current state:** Already uses React Query, has basic structure

**Changes:**
1. Add centered container wrapper (900px max-width)
2. Verify `useThemeColors()` is used
3. Update Layout.tsx to exclude habits from header (if duplicate)

**Example:**
```jsx
const Habits: React.FC = () => {
  const colors = useThemeColors();
  const { showToast } = useToast();

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        <HabitsHeaderV2 />
        {/* Rest of content */}
      </div>
    </div>
  );
};
```

### Phase 2: Update HabitsHeaderV2

**File:** `src/habits/components/v2/HabitsHeaderV2.tsx`

**Change to simple style (remove any gradient):**
```jsx
export const HabitsHeaderV2: React.FC = () => {
  const colors = useThemeColors();

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
        <span className="text-4xl">🎯</span>
        Habits
      </h1>
    </div>
  );
};
```

### Phase 3: Update HabitFormModalV2 (CRITICAL)

**File:** `src/habits/components/v2/HabitFormModalV2.tsx`

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

3. **Fixed header:**
```jsx
<div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
  <h2 className="text-2xl font-bold text-gray-900">
    {isEditing ? 'Edit Habit' : 'New Habit'}
  </h2>
  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
    <X className="w-5 h-5 text-gray-500" />
  </button>
</div>
```

4. **Scrollable content area:**
```jsx
<div className="overflow-y-auto p-6 space-y-5 flex-1" style={{ maxHeight: 'calc(90vh - 140px)' }}>
  {/* Habit Name */}
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">Habit Name</label>
    <input
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Exercise, Read, Meditate..."
      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
      required
      autoFocus
    />
  </div>

  {/* Frequency */}
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
    <select
      value={frequency}
      onChange={(e) => setFrequency(e.target.value)}
      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
    >
      <option value="daily">📅 Daily</option>
      <option value="weekly">📆 Weekly</option>
      <option value="custom">⚙️ Custom</option>
    </select>
  </div>

  {/* Target (optional) */}
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">Target (optional)</label>
    <input
      type="number"
      value={target}
      onChange={(e) => setTarget(e.target.value)}
      placeholder="7 times per week"
      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
    />
  </div>

  {/* Icon/Emoji (optional) */}
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">Icon (optional)</label>
    <input
      type="text"
      value={icon}
      onChange={(e) => setIcon(e.target.value)}
      placeholder="💪 🏃 📚 🧘"
      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
    />
  </div>
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
          if (window.confirm('Delete this habit? All completion history will be lost. This cannot be undone.')) {
            onDelete();
          }
        }}
        className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl font-semibold text-red-600 transition-colors flex items-center justify-center gap-2"
        aria-label="Delete habit"
      >
        <span>🗑️</span>
        Delete Habit
      </button>
    </div>
  )}

  {/* Action buttons */}
  <div className="flex gap-3">
    <button
      type="button"
      onClick={onClose}
      className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={isPending || !name.trim()}
      className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
    >
      {isPending ? 'Saving...' : (isEditing ? 'Update Habit' : 'Create Habit')}
    </button>
  </div>
</div>
```

6. **Auto-save functionality:**
```jsx
const STORAGE_KEY = 'habit_draft';

const loadDraft = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    logger.error('Habits', error as Error, { context: 'Failed to load draft' });
  }
  return null;
};

// Auto-save on change
useEffect(() => {
  if (!isEditing && (name || target || icon)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, frequency, target, icon }));
  }
}, [name, frequency, target, icon, isEditing]);

// Clear on success
const handleSubmit = () => {
  // ... submit logic
  localStorage.removeItem(STORAGE_KEY);
  onClose();
};
```

7. **CRITICAL - Update form when initialData changes:**
```jsx
// This prevents the bug where clicking different habits doesn't update the modal
useEffect(() => {
  if (initialData) {
    setName(initialData.name || '');
    setFrequency(initialData.frequency || 'daily');
    setTarget(initialData.target?.toString() || '');
    setIcon(initialData.icon || '');
    // ... all other fields
  } else if (!isEditing) {
    // Reset to draft or defaults
    const draft = loadDraft();
    setName(draft?.name || '');
    setFrequency(draft?.frequency || 'daily');
    // ...
  }
}, [initialData, isEditing]);
```

8. **ESC key + backdrop click:**
```jsx
// ESC key support
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

// Backdrop click handler
const handleBackdropClick = (e: React.MouseEvent) => {
  if (e.target === e.currentTarget) {
    onClose();
  }
};
```

9. **Props interface must include onDelete:**
```jsx
export interface HabitFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HabitDraft) => void;
  onDelete?: () => void; // IMPORTANT: Add this!
  initialData?: HabitDraft;
  isEditing?: boolean;
  isPending?: boolean;
}
```

### Phase 4: Update HabitCardV2 (COMPLEX)

**File:** `src/habits/components/v2/HabitCardV2.tsx`

**This is more complex than Notes because:**
- Shows daily completion checkbox
- Displays streak/progress
- Has different states (completed today, on streak, missed)

**Match design spec styling:**
```jsx
export const HabitCardV2: React.FC<HabitCardV2Props> = ({
  habit,
  completedToday,
  streak,
  onToggleComplete,
  onEdit,
  viewMode = 'list',
  showOwnerBadge = false,
  owner,
}) => {
  const colors = useThemeColors();

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="relative cursor-pointer"
      style={{
        backgroundColor: 'white',
        borderLeft: `4px solid ${completedToday ? '#22c55e' : '#D4A574'}`,
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      {/* Owner badge (top-right, only in merged mode) */}
      {showOwnerBadge && owner && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 8px',
            background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#C18B5E',
          }}
        >
          {owner.displayName}
        </div>
      )}

      {/* Top section: Icon, Name, Checkbox */}
      <div className="flex items-center gap-3 mb-3">
        {/* Icon */}
        <span className="text-3xl">{habit.icon || '🎯'}</span>

        {/* Name */}
        <div className="flex-1" onClick={onEdit}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#5C4A3A' }}>
            {habit.name}
          </h3>
          <p style={{ fontSize: '12px', color: '#9B8B7A' }}>
            {habit.frequency === 'daily' ? '📅 Daily' :
             habit.frequency === 'weekly' ? '📆 Weekly' : '⚙️ Custom'}
          </p>
        </div>

        {/* Completion checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          className="flex-shrink-0"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: `2px solid ${completedToday ? '#22c55e' : '#C18B5E'}`,
            background: completedToday ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          aria-label={completedToday ? 'Mark incomplete' : 'Mark complete'}
        >
          {completedToday && <span style={{ color: 'white', fontSize: '16px' }}>✓</span>}
        </button>
      </div>

      {/* Streak indicator */}
      {streak > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px' }}>🔥</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#ea580c' }}>
            {streak} day streak!
          </span>
        </div>
      )}

      {/* Progress bar (if has target) */}
      {habit.target && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: '#6B5847' }}>Weekly Progress</span>
            <span style={{ fontSize: '11px', color: '#6B5847', fontWeight: 600 }}>
              {/* Calculate from entries */} 5/{habit.target}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#E8DCC8',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(5 / habit.target) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};
```

**Key features:**
- Border changes color when completed (green vs terracotta)
- Large checkbox on right for quick completion
- Streak indicator with fire emoji
- Progress bar for habits with targets
- Click card to edit, click checkbox to toggle

### Phase 5: Update Main Page with useModalState

**File:** `src/pages/Habits.tsx`

**Import required:**
```jsx
import { useModalState } from '../hooks/useModalState';
import { useToast } from '../hooks/useToast';
import { useThemeColors } from '../hooks/useThemeColors';
```

**Set up modal state:**
```jsx
const modals = useModalState({
  showForm: false,
  editingHabitId: null as string | null,
});

const { showToast } = useToast();
const colors = useThemeColors();
```

**Fetch habits and entries:**
```jsx
// Fetch habits
const { data: habits = [], isLoading: habitsLoading } = useHabits();

// Fetch entries for current week/month (depending on view)
const { start, end } = getWeekBoundaries(); // Helper function
const { data: entries = [], isLoading: entriesLoading } = useHabitEntries({
  startDate: start,
  endDate: end,
});

// Check merged mode
const { data: mergedConnection } = useMergedHabitsConnectionQuery();
const { data: currentUserId } = useCurrentUserId();
```

**Calculate completions and streaks:**
```jsx
// Map entries to habits for today
const today = new Date().toISOString().split('T')[0];
const completionsToday = useMemo(() => {
  const map = new Map<string, boolean>();
  entries
    .filter(entry => entry.date === today)
    .forEach(entry => map.set(entry.habit_id, true));
  return map;
}, [entries, today]);

// Calculate streaks (simplified - you may have a helper function)
const streaks = useMemo(() => {
  const map = new Map<string, number>();
  // Calculate streak for each habit based on consecutive days
  // This is complex - refer to existing habitHelpers or streak calculation logic
  return map;
}, [entries, habits]);
```

**Implement CRUD handlers:**
```jsx
const createMutation = useCreateHabit();
const updateMutation = useUpdateHabit();
const deleteMutation = useDeleteHabit();
const createEntryMutation = useCreateHabitEntry();
const deleteEntryMutation = useDeleteHabitEntriesForDate();

// Create/Update handler
const handleSubmit = (data: HabitDraft) => {
  if (modals.state.editingHabitId) {
    // UPDATE
    updateMutation.mutate(
      {
        id: modals.state.editingHabitId,
        updates: data,
      },
      {
        onSuccess: () => {
          showToast('Habit updated! ✏️', 'success');
          modals.close('showForm');
          modals.set('editingHabitId', null);
        },
      }
    );
  } else {
    // CREATE
    createMutation.mutate(data, {
      onSuccess: () => {
        showToast('Habit created! 💪', 'success');
        modals.close('showForm');
      },
    });
  }
};

// Delete handler
const handleDelete = () => {
  if (modals.state.editingHabitId) {
    deleteMutation.mutate(modals.state.editingHabitId, {
      onSuccess: () => {
        showToast('Habit deleted! 🗑️', 'success');
        modals.close('showForm');
        modals.set('editingHabitId', null);
      },
    });
  }
};

// Toggle completion
const handleToggleComplete = (habitId: string) => {
  const isCompleted = completionsToday.get(habitId);

  if (isCompleted) {
    // Unmark complete
    deleteEntryMutation.mutate(
      { habitId, date: today },
      {
        onSuccess: () => {
          showToast('Marked incomplete', 'success');
        },
      }
    );
  } else {
    // Mark complete
    createEntryMutation.mutate(
      { habitId, date: today },
      {
        onSuccess: () => {
          showToast('Marked complete! ✅', 'success');
        },
      }
    );
  }
};

// Edit handler
const handleEditHabit = (habit: Habit) => {
  modals.set('editingHabitId', habit.id);
  modals.open('showForm');
};
```

**Get editing habit data:**
```jsx
const editingHabit = modals.state.editingHabitId
  ? habits.find(h => h.id === modals.state.editingHabitId)
  : null;

const editingDraft = editingHabit ? toHabitDraft(editingHabit) : undefined;
```

**Pass to modal:**
```jsx
<HabitFormModalV2
  isOpen={modals.state.showForm}
  onClose={() => {
    modals.close('showForm');
    modals.set('editingHabitId', null);
  }}
  onSubmit={handleSubmit}
  onDelete={handleDelete} // IMPORTANT!
  initialData={editingDraft}
  isEditing={!!modals.state.editingHabitId}
  isPending={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
/>
```

**Render habit cards:**
```jsx
<div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
  {filteredHabits.map((habit) => (
    <HabitCardV2
      key={habit.id}
      habit={habit}
      completedToday={completionsToday.get(habit.id) || false}
      streak={streaks.get(habit.id) || 0}
      onToggleComplete={() => handleToggleComplete(habit.id)}
      onEdit={() => handleEditHabit(habit)}
      viewMode={viewMode}
      showOwnerBadge={!!mergedConnection}
      owner={
        mergedConnection
          ? {
              isOwner: habit.user_id === currentUserId,
              displayName: habit.user_id === currentUserId ? 'You' : partnerName,
            }
          : undefined
      }
    />
  ))}
</div>
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
    onClick={() => setViewMode('grid')}
    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
      viewMode === 'grid' ? 'bg-white shadow-sm' : ''
    }`}
    style={{ color: viewMode === 'grid' ? '#C18B5E' : colors.text.secondary }}
    aria-label="Grid view"
  >
    📱 Grid
  </button>
</div>
```

**Add OwnerFilter (merged mode):**
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
    modals.set('editingHabitId', null);
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
  aria-label="Create new habit"
>
  +
</button>
```

---

## Testing Checklist (CRITICAL)

Before committing, verify ALL of these:

### Functionality Tests
- [ ] Click habit card → Modal opens with ALL data populated
- [ ] Click different habits → Modal updates each time
- [ ] Create new habit → Works + shows toast
- [ ] Update habit → Works + shows toast
- [ ] Delete habit → Shows confirmation + works + toast
- [ ] **Toggle completion checkbox** → Marks complete/incomplete + toast
- [ ] **Streak displays correctly** after multiple completions
- [ ] **Progress bar updates** when completing habits
- [ ] ESC key → Closes modal
- [ ] Click outside modal → Closes modal
- [ ] Auto-save → Close modal mid-entry, reopen → draft persists

### UI Tests
- [ ] No duplicate "Habits" header
- [ ] Content is centered (max 900px)
- [ ] Mobile: Modal slides from bottom, has drag handle
- [ ] Desktop: Modal is centered
- [ ] Completion checkbox is large and easy to tap
- [ ] Completed habits have green border
- [ ] Streak indicator shows fire emoji
- [ ] Progress bar fills correctly
- [ ] View toggle works (list/grid)
- [ ] Owner filter works (if merged mode)

### Code Quality
- [ ] No TypeScript errors in habits files
- [ ] All debug logging removed
- [ ] Used `useModalState` (not manual useState)
- [ ] Success toasts on all operations
- [ ] Proper loading states (isPending)

---

## Common Pitfalls (From Notes Experience)

| ❌ Issue | ✅ Prevention |
|---------|--------------|
| Duplicate header | Update Layout.tsx in Phase 1 |
| Modal doesn't update when clicking different habits | Add useEffect for initialData in Phase 3 |
| Completions not showing | Phase 5: Fetch habit_entries with useHabitEntries |
| Streak calculation wrong | Use existing streak helper functions |
| No delete button | Phase 3: Add to modal from the start |
| Manual modal state | Phase 5: Use useModalState hook |
| No user feedback | Phase 5: Add toasts to all operations |
| Checkbox too small | Phase 4: Make it 32x32px minimum |

---

## Habits-Specific Challenges

### 1. Completion Toggle Logic
**Challenge:** Checking/unchecking needs to create/delete entries in habit_entries table

**Solution:**
```jsx
const handleToggleComplete = (habitId: string) => {
  const today = new Date().toISOString().split('T')[0];
  const isCompleted = completionsToday.get(habitId);

  if (isCompleted) {
    deleteEntryMutation.mutate({ habitId, date: today });
  } else {
    createEntryMutation.mutate({ habitId, date: today });
  }
};
```

### 2. Streak Calculation
**Challenge:** Need consecutive days of completions

**Recommendation:** Use existing helper if available, or implement:
```jsx
const calculateStreak = (habitId: string, entries: HabitEntry[]): number => {
  const habitEntries = entries
    .filter(e => e.habit_id === habitId)
    .map(e => e.date)
    .sort()
    .reverse();

  let streak = 0;
  let checkDate = new Date();

  for (const entryDate of habitEntries) {
    const entry = new Date(entryDate);
    const diff = Math.floor((checkDate.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === streak) {
      streak++;
      checkDate = entry;
    } else if (diff > streak) {
      break;
    }
  }

  return streak;
};
```

### 3. Progress Calculation
**Challenge:** Weekly progress toward target

**Solution:**
```jsx
const getWeeklyProgress = (habitId: string, target: number): number => {
  const thisWeek = entries.filter(e =>
    e.habit_id === habitId &&
    isThisWeek(new Date(e.date))
  );
  return Math.min(thisWeek.length, target);
};
```

---

## Files to Modify

**Estimate: 5-6 files**

### Must Update
1. `src/pages/Habits.tsx` - Main page structure
2. `src/habits/components/v2/HabitsHeaderV2.tsx` - Header style
3. `src/habits/components/v2/HabitFormModalV2.tsx` - Complete rewrite
4. `src/habits/components/v2/HabitCardV2.tsx` - Card styling + completion logic
5. `src/components/Layout.tsx` - Exclude habits from header (if duplicate)

### May Update
6. `src/habits/components/v2/index.ts` - Barrel exports
7. `src/habits/components/v2/StreakIndicatorV2.tsx` - May need styling updates

---

## Commit Message Template

```
feat: Complete Habits tab UI/UX enhancement with Together tab patterns

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
- Habit card styling matching design spec:
  * Large completion checkbox (32x32px)
  * Green border when completed
  * Streak indicator with fire emoji
  * Progress bar for targets
- Full CRUD operations with success toasts
- Toggle completion with optimistic updates
- Used useModalState hook to reduce boilerplate
- View toggle and filters match Together style

Implementation Details:
- Updated V2 components in src/habits/components/v2/
- HabitCardV2: Completion toggle, streak display, progress bars
- HabitFormModalV2: Complete Together pattern compliance
- HabitsHeaderV2: Simple emoji + title header
- Updated Layout.tsx to hide duplicate header for Habits
- Habit entries fetched from separate table (like Notes list_items)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Next Steps

1. Start with Phase 0 (Discovery) - check for duplicate header
2. Work through phases sequentially
3. Pay special attention to completion toggle logic
4. Test thoroughly - especially streak and progress calculations
5. Use Notes implementation as reference (commit 863a16f)
6. Commit when all tests pass

**Good luck! 💪**
