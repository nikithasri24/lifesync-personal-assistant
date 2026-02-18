# Goals Tab UI/UX Enhancement Plan

## Context

The Goals feature (LifeGoals.tsx) needs to be updated to match the design specifications in `goals-design-spec.html` and apply all 25 UI/UX enhancement patterns from CLAUDE.md (established by the Together tab reference implementation).

**Current State:**
- Goals page exists at `src/pages/LifeGoals.tsx` with existing layout components
- Has two tabs: Goals and Dreams
- Uses old modal patterns (not matching Together tab)
- Has gradient header (needs to be simplified)
- Missing: centered page layout, proper modal structure, auto-save, enhanced styling
- Has: Stats cards, filter bar, templates, milestones, check-ins

**Goal:**
- Match `goals-design-spec.html` styling exactly
- Apply all Together tab UI patterns
- Maintain existing functionality (milestones, check-ins, merged mode, templates)
- Ensure responsive mobile/desktop behavior
- Simplify header to match Together tab

**Why This Matters:**
- Goals is a complex feature with dual tabs (Goals + Dreams)
- Has unique components (milestones, check-ins, progress tracking)
- Demonstrates how to handle multi-tab features
- Will serve as reference for other complex features

---

## Critical Files to Modify

### Primary Files (Must Update)
1. `src/pages/LifeGoals.tsx` - Main page component (currently ~700 lines)
2. `src/goals/components/layout/LifeGoalsHeader.tsx` - Page header (simplify to match Together)
3. `src/goals/components/layout/GoalFormModal.tsx` - Create/Edit modal for goals
4. `src/goals/components/layout/DreamFormModal.tsx` - Create/Edit modal for dreams
5. `src/goals/components/layout/StatsCards.tsx` - Stats cards component
6. `src/goals/components/layout/FilterBar.tsx` - Filter pills
7. `src/goals/components/GoalCard.tsx` - Goal card styling
8. `src/goals/components/DreamCard.tsx` - Dream card styling
9. `src/goals/components/GoalMilestones.tsx` - Milestones component
10. `src/goals/components/GoalCheckins.tsx` - Check-ins component
11. `src/goals/components/ProgressBar.tsx` - Progress bar styling
12. `src/goals/components/StatusBadge.tsx` - Status badge styling
13. `src/goals/components/PriorityBadge.tsx` - Priority badge styling

### V2 Components to Create
1. `src/goals/components/v2/GoalsHeaderV2.tsx` - Simple header
2. `src/goals/components/v2/GoalFormModalV2.tsx` - Together-style modal
3. `src/goals/components/v2/DreamFormModalV2.tsx` - Together-style modal
4. `src/goals/components/v2/GoalCardV2.tsx` - Enhanced card
5. `src/goals/components/v2/DreamCardV2.tsx` - Enhanced card
6. `src/goals/components/v2/StatsCardsV2.tsx` - Enhanced stats
7. `src/goals/components/v2/FilterBarV2.tsx` - Pill-style filters
8. `src/goals/components/v2/index.ts` - Barrel exports

### Reference Files (Do NOT Modify)
- `src/pages/Together.tsx` - Reference implementation
- `src/pages/Notes.tsx` - Recent implementation with lessons learned
- `goals-design-spec.html` - Design specification
- `CLAUDE.md` - UI/UX standards

---

## Phase 0: Discovery & Verification ⭐ **START HERE**

Before making any changes, verify the current state to avoid wasted effort.

### Step 1: Compare with Design Spec
```bash
# Open design spec in browser
open goals-design-spec.html

# Run dev server and navigate to Goals tab
npm run dev
# Navigate to: http://localhost:5173/ → Goals tab
```

**Compare side-by-side:**
- [ ] Header design (gradient vs simple)
- [ ] Tab navigation (Goals/Dreams)
- [ ] Stats cards styling
- [ ] Filter bar styling (dropdown vs pills)
- [ ] Goal cards appearance
- [ ] Dream cards appearance
- [ ] Modal structure
- [ ] Progress bars
- [ ] Badges (status, priority)
- [ ] Empty states
- [ ] FAB placement

### Step 2: Inspect Current Database Schema
```typescript
// Goals stored in: life_goals table
// Dreams stored in: life_dreams table
// Milestones: life_goal_milestones table
// Check-ins: life_goal_checkins table

// Key fields to verify:
// - progress (0-100 integer)
// - status (not-started | in-progress | completed | on-hold | abandoned)
// - priority (low | medium | high | critical)
// - category (personal | health | career | financial | fitness)
// - trackingMode (combined | individual) - for merged mode
// - connectionId - for shared goals/dreams
```

### Step 3: Check Current Component Structure
```bash
# List existing components
ls -la src/goals/components/
ls -la src/goals/components/layout/

# Check if V2 directory exists
ls -la src/goals/components/v2/ 2>/dev/null || echo "V2 directory doesn't exist yet"
```

### Step 4: Review Current Hooks
```bash
# Check Goals query hook
cat src/hooks/useLifeGoalsQuery.ts | head -50
```

**Verify hooks available:**
- [ ] `useLifeGoalsQuery()` - Fetch all goals
- [ ] `useLifeDreamsQuery()` - Fetch all dreams
- [ ] `useCreateLifeGoalMutation()` - Create goal
- [ ] `useUpdateLifeGoalMutation()` - Update goal
- [ ] `useDeleteLifeGoalMutation()` - Delete goal
- [ ] `useCreateLifeDreamMutation()` - Create dream
- [ ] `useUpdateLifeDreamMutation()` - Update dream
- [ ] `useDeleteLifeDreamMutation()` - Delete dream
- [ ] `useMergedGoalsConnectionQuery()` - Merged mode connection

### Step 5: Identify Gaps

**From design spec comparison, identify missing/broken:**
- Header styling (gradient → simple)
- Modal structure (old pattern → Together pattern)
- Filter bar (dropdown → pills)
- Stats cards styling
- Card component styling
- Progress bars
- Badges

**Document in notes:**
```
Current Issues to Fix:
1. Header has gradient background (should be simple like Together)
2. Modals don't match Together pattern (no mobile drag handle, etc.)
3. Filter bar uses dropdowns (should be pills)
4. [Add more as you discover them]
```

---

## Implementation Plan

### Phase 1: Page Layout - Centered Container

**File:** `src/pages/LifeGoals.tsx`

**Current structure:**
```typescript
// Current (no centered container)
return (
  <div className="pb-20">
    <LifeGoalsHeader ... />
    {/* Content */}
  </div>
);
```

**Changes:**
1. Wrap entire page content in centered container pattern:
   ```tsx
   import { useThemeColors } from '@/hooks/useThemeColors';

   const colors = useThemeColors();

   return (
     <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
       <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
         {/* All content */}
         <GoalsHeaderV2 />
         {/* Stats, Tabs, Filters, Content */}
       </div>
     </div>
   );
   ```

2. Update Layout.tsx to exclude duplicate header:
   ```typescript
   // src/components/Layout.tsx
   {!isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && (
   {isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && (
   ```

**Expected Outcome:**
- Content centered on desktop (max 900px wide)
- Full width on mobile (minus padding)
- No duplicate "Life Goals" header
- Matches Together/Notes layout

---

### Phase 2: Create GoalsHeaderV2 Component

**File:** `src/goals/components/v2/GoalsHeaderV2.tsx` (Create new)

**Changes:**
1. Create simple header matching Together tab pattern:
   ```tsx
   import React from 'react';
   import { useThemeColors } from '@/hooks/useThemeColors';

   export const GoalsHeaderV2: React.FC = () => {
     const colors = useThemeColors();

     return (
       <div className="mb-6">
         <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
           <span className="text-4xl">🎯</span>
           Life Goals
         </h1>
         <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
           Track your aspirations and celebrate achievements
         </p>
       </div>
     );
   };
   ```

**Why This Change:**
- Old header has gradient background (too prominent)
- Simple header matches Together tab pattern
- Cleaner, more focused design
- Emoji + title + subtitle (no gradient)

**Expected Outcome:**
- Simple header with emoji 🎯
- No gradient background
- Matches Together tab style
- Single "Life Goals" text (no duplication)

---

### Phase 3: Create StatsCardsV2 Component

**File:** `src/goals/components/v2/StatsCardsV2.tsx` (Create new)

**Changes:**
1. Create enhanced stats cards with proper styling:
   ```tsx
   import React from 'react';
   import { useThemeColors } from '@/hooks/useThemeColors';

   interface StatsCardsV2Props {
     stats: {
       total: number;
       completed: number;
       inProgress: number;
     };
     type: 'goals' | 'dreams';
   }

   export const StatsCardsV2: React.FC<StatsCardsV2Props> = ({ stats, type }) => {
     const colors = useThemeColors();

     return (
       <div className="grid grid-cols-3 gap-3 mb-6">
         {/* Total Card */}
         <div
           className="p-4 rounded-xl border"
           style={{
             backgroundColor: colors.bg.white,
             borderColor: colors.border.light,
           }}
         >
           <div className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>
             {stats.total}
           </div>
           <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>
             Total {type === 'goals' ? 'Goals' : 'Dreams'}
           </div>
         </div>

         {/* Completed/Achieved Card */}
         <div
           className="p-4 rounded-xl border"
           style={{
             backgroundColor: colors.bg.white,
             borderColor: colors.border.light,
           }}
         >
           <div className="flex items-center gap-2 mb-1">
             <div className="text-2xl font-bold" style={{ color: '#10B981' }}>
               {stats.completed}
             </div>
             <span className="text-lg">✅</span>
           </div>
           <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>
             {type === 'goals' ? 'Completed' : 'Achieved'}
           </div>
         </div>

         {/* In Progress Card */}
         <div
           className="p-4 rounded-xl border"
           style={{
             backgroundColor: colors.bg.white,
             borderColor: colors.border.light,
           }}
         >
           <div className="flex items-center gap-2 mb-1">
             <div className="text-2xl font-bold" style={{ color: '#C18B5E' }}>
               {stats.inProgress}
             </div>
             <span className="text-lg">🔥</span>
           </div>
           <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>
             In Progress
           </div>
         </div>
       </div>
     );
   };
   ```

**Expected Outcome:**
- Three-column grid on mobile/desktop
- Rounded cards with borders
- Icons for completed/in-progress
- Terracotta theme colors
- Responsive text sizes

---

### Phase 4: Create Tab Navigation (Goals/Dreams)

**File:** `src/pages/LifeGoals.tsx`

**Changes:**
1. Use SegmentedControlV2 for tab navigation:
   ```tsx
   import { SegmentedControlV2 } from '@/components/v2/SegmentedControlV2';

   const [activeTab, setActiveTab] = useState<'goals' | 'dreams'>('goals');

   // In render:
   <div className="mb-6">
     <SegmentedControlV2
       options={[
         { value: 'goals', label: '🎯 Goals' },
         { value: 'dreams', label: '✨ Dreams' },
       ]}
       value={activeTab}
       onChange={(value) => setActiveTab(value as 'goals' | 'dreams')}
     />
   </div>
   ```

**Expected Outcome:**
- Pill-style tab navigation
- Active tab highlighted with terracotta
- Smooth transitions
- Matches Together tab pattern

---

### Phase 5: Create FilterBarV2 Component

**File:** `src/goals/components/v2/FilterBarV2.tsx` (Create new)

**Changes:**
1. Replace dropdown filters with pill-style buttons:
   ```tsx
   import React from 'react';
   import { useThemeColors } from '@/hooks/useThemeColors';

   export type StatusFilter = 'all' | 'active' | 'completed';
   export type OwnershipFilter = 'all' | 'mine' | 'partner' | 'shared';

   interface FilterBarV2Props {
     statusFilter: StatusFilter;
     onStatusFilterChange: (filter: StatusFilter) => void;
     ownershipFilter?: OwnershipFilter;
     onOwnershipFilterChange?: (filter: OwnershipFilter) => void;
     isMergedMode?: boolean;
     partnerName?: string;
   }

   export const FilterBarV2: React.FC<FilterBarV2Props> = ({
     statusFilter,
     onStatusFilterChange,
     ownershipFilter,
     onOwnershipFilterChange,
     isMergedMode = false,
     partnerName = 'Partner',
   }) => {
     const colors = useThemeColors();

     const statusOptions: { value: StatusFilter; label: string }[] = [
       { value: 'all', label: 'All' },
       { value: 'active', label: 'Active' },
       { value: 'completed', label: 'Completed' },
     ];

     const ownershipOptions: { value: OwnershipFilter; label: string }[] = [
       { value: 'all', label: 'All' },
       { value: 'mine', label: 'Mine' },
       { value: 'partner', label: partnerName },
       { value: 'shared', label: 'Shared' },
     ];

     return (
       <div className="mb-6 space-y-3">
         {/* Status Filter Pills */}
         <div className="flex gap-2 flex-wrap">
           {statusOptions.map((option) => (
             <button
               key={option.value}
               onClick={() => onStatusFilterChange(option.value)}
               className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
               style={{
                 background: statusFilter === option.value
                   ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                   : colors.bg.secondary,
                 borderWidth: '2px',
                 borderStyle: 'solid',
                 borderColor: statusFilter === option.value ? '#C18B5E' : 'transparent',
                 color: statusFilter === option.value ? '#C18B5E' : colors.text.secondary,
               }}
             >
               {option.label}
             </button>
           ))}
         </div>

         {/* Ownership Filter Pills (only in merged mode) */}
         {isMergedMode && ownershipFilter && onOwnershipFilterChange && (
           <div className="flex gap-2 flex-wrap">
             {ownershipOptions.map((option) => (
               <button
                 key={option.value}
                 onClick={() => onOwnershipFilterChange(option.value)}
                 className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                 style={{
                   background: ownershipFilter === option.value
                     ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                     : colors.bg.secondary,
                   borderWidth: '2px',
                   borderStyle: 'solid',
                   borderColor: ownershipFilter === option.value ? '#C18B5E' : 'transparent',
                   color: ownershipFilter === option.value ? '#C18B5E' : colors.text.secondary,
                 }}
               >
                 {option.label}
               </button>
             ))}
           </div>
         )}
       </div>
     );
   };
   ```

**Expected Outcome:**
- Pill-style filter buttons (not dropdowns)
- Two rows: Status filter + Ownership filter (merged mode only)
- Active pills highlighted with terracotta gradient + border
- Smooth transitions

---

### Phase 6: Create GoalFormModalV2 Component

**File:** `src/goals/components/v2/GoalFormModalV2.tsx` (Create new)

**This is a COMPLETE rewrite following Together tab modal pattern.**

**Changes:**

1. **Modal Container** - Match Together pattern exactly:
   ```tsx
   import React, { useState, useEffect } from 'react';
   import { X, Target, Calendar, Flag } from 'lucide-react';
   import type { GoalCategory, GoalPriority, TrackingMode } from '../../types/lifeGoals';
   import { logger } from '@/services/logger';

   const GOAL_CATEGORIES: { value: GoalCategory; label: string; emoji: string }[] = [
     { value: 'personal', label: 'Personal', emoji: '🌟' },
     { value: 'health', label: 'Health', emoji: '💪' },
     { value: 'career', label: 'Career', emoji: '💼' },
     { value: 'financial', label: 'Financial', emoji: '💰' },
     { value: 'fitness', label: 'Fitness', emoji: '🏃' },
   ];

   const GOAL_PRIORITIES: { value: GoalPriority; label: string; color: string }[] = [
     { value: 'low', label: 'Low', color: '#6B7280' },
     { value: 'medium', label: 'Medium', color: '#3B82F6' },
     { value: 'high', label: 'High', color: '#F59E0B' },
     { value: 'critical', label: 'Critical', color: '#EF4444' },
   ];

   export interface GoalFormModalV2Props {
     isOpen: boolean;
     onClose: () => void;
     onSubmit: (data: {
       title: string;
       description: string;
       category: GoalCategory;
       priority: GoalPriority;
       targetDate: string;
       isShared: boolean;
       trackingMode: TrackingMode;
     }) => void;
     onDelete?: () => void;
     initialData?: {
       title: string;
       description: string;
       category: GoalCategory;
       priority: GoalPriority;
       targetDate: string;
       isShared: boolean;
       trackingMode: TrackingMode;
     };
     isEditing?: boolean;
     isPending?: boolean;
     isMergedModeAvailable?: boolean;
   }

   const STORAGE_KEY = 'goals_create_draft';

   export const GoalFormModalV2: React.FC<GoalFormModalV2Props> = ({
     isOpen,
     onClose,
     onSubmit,
     onDelete,
     initialData,
     isEditing = false,
     isPending = false,
     isMergedModeAvailable = false,
   }) => {
     // Load draft from localStorage
     const loadDraft = () => {
       try {
         const saved = localStorage.getItem(STORAGE_KEY);
         if (saved) return JSON.parse(saved);
       } catch (error) {
         logger.error('Goals', error as Error, { context: 'Failed to load draft' });
       }
       return null;
     };

     const savedDraft = !initialData ? loadDraft() : null;

     const [title, setTitle] = useState(initialData?.title || savedDraft?.title || '');
     const [description, setDescription] = useState(initialData?.description || savedDraft?.description || '');
     const [category, setCategory] = useState<GoalCategory>(initialData?.category || savedDraft?.category || 'personal');
     const [priority, setPriority] = useState<GoalPriority>(initialData?.priority || savedDraft?.priority || 'medium');
     const [targetDate, setTargetDate] = useState(
       initialData?.targetDate || savedDraft?.targetDate ||
       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
     );
     const [isShared, setIsShared] = useState(initialData?.isShared || savedDraft?.isShared || false);
     const [trackingMode, setTrackingMode] = useState<TrackingMode>(initialData?.trackingMode || savedDraft?.trackingMode || 'combined');

     // Update form when initialData changes
     useEffect(() => {
       if (initialData) {
         setTitle(initialData.title || '');
         setDescription(initialData.description || '');
         setCategory(initialData.category || 'personal');
         setPriority(initialData.priority || 'medium');
         setTargetDate(initialData.targetDate || '');
         setIsShared(initialData.isShared || false);
         setTrackingMode(initialData.trackingMode || 'combined');
       } else if (!isEditing) {
         const draft = loadDraft();
         if (draft) {
           setTitle(draft.title || '');
           setDescription(draft.description || '');
           setCategory(draft.category || 'personal');
           setPriority(draft.priority || 'medium');
           setTargetDate(draft.targetDate || '');
           setIsShared(draft.isShared || false);
           setTrackingMode(draft.trackingMode || 'combined');
         }
       }
     }, [initialData, isEditing]);

     // Auto-save to localStorage
     useEffect(() => {
       if (!isEditing && (title || description)) {
         localStorage.setItem(STORAGE_KEY, JSON.stringify({
           title,
           description,
           category,
           priority,
           targetDate,
           isShared,
           trackingMode,
         }));
       }
     }, [title, description, category, priority, targetDate, isShared, trackingMode, isEditing]);

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

     const handleSubmit = (e: React.FormEvent) => {
       e.preventDefault();

       if (!title.trim()) return;

       onSubmit({
         title: title.trim(),
         description: description.trim(),
         category,
         priority,
         targetDate,
         isShared,
         trackingMode,
       });

       // Clear draft on successful submit
       localStorage.removeItem(STORAGE_KEY);

       // Reset form
       setTitle('');
       setDescription('');
       setCategory('personal');
       setPriority('medium');
       setTargetDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
       setIsShared(false);
       setTrackingMode('combined');
     };

     if (!isOpen) return null;

     return (
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
         <div
           className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
           style={{ maxHeight: '90vh', maxWidth: '600px' }}
         >
           {/* Mobile drag handle */}
           <div className="lg:hidden pt-2 flex-shrink-0">
             <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
           </div>

           {/* Fixed Header */}
           <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
             <h2 className="text-2xl font-bold text-gray-900">
               {isEditing ? 'Edit Goal' : 'Create Goal'}
             </h2>
             <button
               type="button"
               onClick={onClose}
               className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
               aria-label="Close"
             >
               <X className="w-5 h-5 text-gray-500" />
             </button>
           </div>

           {/* Scrollable Form Content */}
           <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
             <div
               className="overflow-y-auto p-6 space-y-5 flex-1"
               style={{ maxHeight: 'calc(90vh - 140px)' }}
             >
               {/* Title Input */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Goal Title
                 </label>
                 <input
                   type="text"
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   placeholder="What do you want to achieve?"
                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                   required
                   autoFocus
                 />
               </div>

               {/* Description Textarea */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Description (optional)
                 </label>
                 <textarea
                   rows={4}
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="Add more details about your goal..."
                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                 />
               </div>

               {/* Category Selection */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Category
                 </label>
                 <div className="grid grid-cols-2 gap-2">
                   {GOAL_CATEGORIES.map((cat) => (
                     <button
                       key={cat.value}
                       type="button"
                       onClick={() => setCategory(cat.value)}
                       className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                         category === cat.value
                           ? 'bg-terracotta-100 text-terracotta-600 border-2 border-terracotta-400'
                           : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                       }`}
                       style={{
                         background: category === cat.value
                           ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                           : '#F3F4F6',
                         borderColor: category === cat.value ? '#C18B5E' : 'transparent',
                         color: category === cat.value ? '#C18B5E' : '#374151',
                       }}
                     >
                       {cat.emoji} {cat.label}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Priority Selection */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Priority
                 </label>
                 <div className="grid grid-cols-2 gap-2">
                   {GOAL_PRIORITIES.map((pri) => (
                     <button
                       key={pri.value}
                       type="button"
                       onClick={() => setPriority(pri.value)}
                       className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2`}
                       style={{
                         background: priority === pri.value
                           ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                           : '#F3F4F6',
                         borderColor: priority === pri.value ? '#C18B5E' : 'transparent',
                         color: priority === pri.value ? '#C18B5E' : '#374151',
                       }}
                     >
                       <Flag className="w-4 h-4 inline mr-1" style={{ color: pri.color }} />
                       {pri.label}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Target Date */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Target Date
                 </label>
                 <input
                   type="date"
                   value={targetDate}
                   onChange={(e) => setTargetDate(e.target.value)}
                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                 />
               </div>

               {/* Shared Goal (Merged Mode Only) */}
               {isMergedModeAvailable && (
                 <div>
                   <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                     <input
                       type="checkbox"
                       checked={isShared}
                       onChange={(e) => setIsShared(e.target.checked)}
                       className="w-5 h-5 text-terracotta-400 rounded focus:ring-terracotta-300"
                     />
                     <span className="font-medium text-gray-900">Share this goal with partner</span>
                   </label>

                   {/* Tracking Mode (only if shared) */}
                   {isShared && (
                     <div className="mt-3 pl-8">
                       <label className="block text-sm font-semibold text-gray-700 mb-2">
                         Tracking Mode
                       </label>
                       <div className="space-y-2">
                         <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                           <input
                             type="radio"
                             name="trackingMode"
                             value="combined"
                             checked={trackingMode === 'combined'}
                             onChange={(e) => setTrackingMode(e.target.value as TrackingMode)}
                             className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                           />
                           <div>
                             <div className="font-medium text-gray-900">Combined Progress</div>
                             <div className="text-xs text-gray-600">Track as one shared goal</div>
                           </div>
                         </label>
                         <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                           <input
                             type="radio"
                             name="trackingMode"
                             value="individual"
                             checked={trackingMode === 'individual'}
                             onChange={(e) => setTrackingMode(e.target.value as TrackingMode)}
                             className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                           />
                           <div>
                             <div className="font-medium text-gray-900">Individual Progress</div>
                             <div className="text-xs text-gray-600">Each person tracks separately</div>
                           </div>
                         </label>
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </div>

             {/* Fixed Footer */}
             <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
               {/* Delete button (only when editing) */}
               {isEditing && onDelete && (
                 <div className="mb-3">
                   <button
                     type="button"
                     onClick={() => {
                       if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
                         onDelete();
                       }
                     }}
                     className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl font-semibold text-red-600 transition-colors flex items-center justify-center gap-2"
                     aria-label="Delete goal"
                   >
                     <span>🗑️</span>
                     Delete Goal
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
                   disabled={isPending || !title.trim()}
                   className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
                   style={{
                     background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                   }}
                 >
                   {isPending ? 'Saving...' : (isEditing ? 'Update Goal' : 'Create Goal')}
                 </button>
               </div>
             </div>
           </form>
         </div>
       </div>
     );
   };
   ```

**Expected Outcome:**
- Modal matches Together tab pattern exactly
- Auto-saves drafts to localStorage
- Proper mobile/desktop responsive behavior
- ESC key and backdrop click support
- All inputs styled correctly
- Category and priority as button grids
- Shared goal toggle (merged mode)
- Tracking mode selection (combined/individual)
- Delete button in footer for edit mode
- Loading states for buttons

---

### Phase 7: Create DreamFormModalV2 Component

**File:** `src/goals/components/v2/DreamFormModalV2.tsx` (Create new)

**Similar to GoalFormModalV2 but for Dreams:**

```tsx
// Very similar structure to GoalFormModalV2, but with:
// - Dream categories: travel, experiences, possessions, achievements, relationships, lifestyle
// - estimatedCost field (text input)
// - estimatedTimeframe field (text input)
// - No priority field
// - Dream-specific language ("What do you dream of?")
```

**Expected Outcome:**
- Same modal structure as GoalFormModalV2
- Dream-specific fields and categories
- Auto-save support
- All Together tab patterns applied

---

### Phase 8: Create GoalCardV2 Component

**File:** `src/goals/components/v2/GoalCardV2.tsx` (Create new)

**Changes:**
1. Create enhanced goal card with proper styling:
   ```tsx
   import React from 'react';
   import { useThemeColors } from '@/hooks/useThemeColors';
   import type { LifeGoal, GoalStatus, GoalPriority } from '../../types/lifeGoals';
   import { getRelativeTime } from '@/utils/dateUtils';

   interface GoalCardV2Props {
     goal: LifeGoal;
     onClick: () => void;
     showOwnerBadge?: boolean;
     owner?: {
       isOwner: boolean;
       displayName: string;
     };
   }

   export const GoalCardV2: React.FC<GoalCardV2Props> = ({
     goal,
     onClick,
     showOwnerBadge = false,
     owner,
   }) => {
     const colors = useThemeColors();

     // Priority colors
     const priorityColors: Record<GoalPriority, string> = {
       low: '#6B7280',
       medium: '#3B82F6',
       high: '#F59E0B',
       critical: '#EF4444',
     };

     // Status colors
     const statusColors: Record<GoalStatus, string> = {
       'not-started': '#9CA3AF',
       'in-progress': '#3B82F6',
       'completed': '#10B981',
       'on-hold': '#F59E0B',
       'abandoned': '#6B7280',
     };

     return (
       <div
         onClick={onClick}
         className="relative cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98]"
         style={{
           backgroundColor: 'white',
           borderLeft: `4px solid ${priorityColors[goal.priority]}`,
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

         {/* Title and Status */}
         <div className="mb-3">
           <div className="flex items-start justify-between gap-2 mb-2">
             <h3
               style={{
                 fontSize: '15px',
                 fontWeight: 700,
                 color: colors.text.primary,
                 lineHeight: 1.3,
                 paddingRight: showOwnerBadge ? '60px' : '0',
               }}
             >
               {goal.title}
             </h3>
           </div>

           {/* Status Badge */}
           <div
             style={{
               display: 'inline-block',
               padding: '4px 8px',
               borderRadius: '8px',
               fontSize: '11px',
               fontWeight: 600,
               backgroundColor: `${statusColors[goal.status]}20`,
               color: statusColors[goal.status],
             }}
           >
             {goal.status.replace('-', ' ')}
           </div>
         </div>

         {/* Description */}
         {goal.description && (
           <p
             style={{
               fontSize: '13px',
               color: colors.text.secondary,
               lineHeight: 1.4,
               marginBottom: '12px',
               display: '-webkit-box',
               WebkitLineClamp: 2,
               WebkitBoxOrient: 'vertical',
               overflow: 'hidden',
             }}
           >
             {goal.description}
           </p>
         )}

         {/* Progress Bar */}
         <div className="mb-3">
           <div className="flex items-center justify-between mb-1">
             <span className="text-xs font-medium" style={{ color: colors.text.secondary }}>
               Progress
             </span>
             <span className="text-xs font-bold" style={{ color: '#C18B5E' }}>
               {goal.progress}%
             </span>
           </div>
           <div
             className="w-full h-2 rounded-full overflow-hidden"
             style={{ backgroundColor: colors.border.light }}
           >
             <div
               className="h-full transition-all duration-500"
               style={{
                 width: `${goal.progress}%`,
                 background: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
               }}
             />
           </div>
         </div>

         {/* Footer: Category, Priority, Target Date */}
         <div className="flex items-center justify-between flex-wrap gap-2">
           {/* Category */}
           <div
             style={{
               padding: '4px 8px',
               background: colors.bg.tertiary,
               borderRadius: '8px',
               fontSize: '11px',
               fontWeight: 600,
               color: colors.text.secondary,
             }}
           >
             {goal.category}
           </div>

           {/* Target Date */}
           {goal.targetDate && (
             <div className="text-xs" style={{ color: colors.text.tertiary }}>
               🎯 {new Date(goal.targetDate).toLocaleDateString()}
             </div>
           )}
         </div>
       </div>
     );
   };
   ```

**Expected Outcome:**
- Card matches design spec styling
- Border-left accent based on priority color
- Progress bar with terracotta gradient
- Status badge with appropriate color
- Owner badge in merged mode
- Hover/tap animations
- All metadata displayed clearly

---

### Phase 9: Create DreamCardV2 Component

**File:** `src/goals/components/v2/DreamCardV2.tsx` (Create new)

**Similar to GoalCardV2 but for Dreams:**
- Different border color (use status color instead of priority)
- Show estimated cost and timeframe
- No progress bar
- Dream-specific styling

**Expected Outcome:**
- Dream card matches design spec
- Shows cost and timeframe
- Status-based border color
- All Together patterns applied

---

### Phase 10: Update Main Page with V2 Components

**File:** `src/pages/LifeGoals.tsx`

**Changes:**
1. Replace all old components with V2 versions:
   ```tsx
   import { GoalsHeaderV2 } from '../goals/components/v2/GoalsHeaderV2';
   import { StatsCardsV2 } from '../goals/components/v2/StatsCardsV2';
   import { FilterBarV2 } from '../goals/components/v2/FilterBarV2';
   import { GoalCardV2 } from '../goals/components/v2/GoalCardV2';
   import { DreamCardV2 } from '../goals/components/v2/DreamCardV2';
   import { GoalFormModalV2 } from '../goals/components/v2/GoalFormModalV2';
   import { DreamFormModalV2 } from '../goals/components/v2/DreamFormModalV2';
   import { useModalState } from '@/hooks/useModalState';

   // Replace manual state with useModalState
   const modals = useModalState({
     showGoalForm: false,
     showDreamForm: false,
     showTemplates: false,
     editingGoalId: null as string | null,
     editingDreamId: null as string | null,
   });
   ```

2. Update render to use V2 components
3. Apply centered layout
4. Remove old header, stats, filter components

**Expected Outcome:**
- All V2 components integrated
- useModalState used for all modal state
- Centered layout applied
- Clean, consistent code

---

### Phase 11: Update Layout.tsx to Exclude Duplicate Header

**File:** `src/components/Layout.tsx`

**Changes:**
```typescript
// Line ~295 (mobile header)
{!isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && (

// Line ~340 (desktop header)
{isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && (
```

**Expected Outcome:**
- No duplicate "Life Goals" header
- Single header from GoalsHeaderV2

---

### Phase 12: Create V2 Barrel Export

**File:** `src/goals/components/v2/index.ts` (Create new)

**Changes:**
```typescript
export { GoalsHeaderV2 } from './GoalsHeaderV2';
export { StatsCardsV2 } from './StatsCardsV2';
export { FilterBarV2 } from './FilterBarV2';
export { GoalCardV2 } from './GoalCardV2';
export { DreamCardV2 } from './DreamCardV2';
export { GoalFormModalV2 } from './GoalFormModalV2';
export { DreamFormModalV2 } from './DreamFormModalV2';
```

---

## Testing Checklist

After implementation, verify ALL of the following:

### Visual Comparison
- [ ] Open `goals-design-spec.html` in browser
- [ ] Open Goals tab in app
- [ ] Compare side-by-side on mobile (375px width)
- [ ] Compare on desktop (1200px width)
- [ ] All spacing, colors, fonts match exactly

### Page Layout
- [ ] Content centered on desktop (max 900px)
- [ ] Full width on mobile (minus padding)
- [ ] No duplicate "Life Goals" header
- [ ] Proper padding: 1.5rem all sides, 5rem bottom

### Header
- [ ] Simple header (emoji + title + subtitle)
- [ ] No gradient background
- [ ] Matches Together tab style

### Tabs
- [ ] Goals/Dreams tabs work correctly
- [ ] Active tab highlighted with terracotta
- [ ] Smooth transitions

### Stats Cards
- [ ] Three-column grid
- [ ] Proper styling (rounded, bordered)
- [ ] Icons for completed/in-progress
- [ ] Correct numbers displayed

### Filter Bar
- [ ] Pill-style buttons (not dropdowns)
- [ ] Active pills highlighted with terracotta
- [ ] Status filter works (all/active/completed)
- [ ] Ownership filter works in merged mode (all/mine/partner/shared)
- [ ] Smooth transitions

### Goal Cards
- [ ] Border-left accent based on priority
- [ ] Progress bar displays correctly
- [ ] Status badge shows correct color
- [ ] Owner badge in merged mode
- [ ] Hover animation works
- [ ] Click opens modal

### Dream Cards
- [ ] Border-left accent based on status
- [ ] Cost and timeframe displayed
- [ ] Status badge shows correct color
- [ ] Owner badge in merged mode
- [ ] Hover animation works
- [ ] Click opens modal

### Goal Modal
- [ ] Opens on create/edit
- [ ] Together pattern structure (drag handle, fixed header/footer)
- [ ] All fields present: title, description, category, priority, target date
- [ ] Category buttons work (grid layout)
- [ ] Priority buttons work (grid layout)
- [ ] Shared goal toggle (merged mode only)
- [ ] Tracking mode selection (combined/individual)
- [ ] Auto-save to localStorage
- [ ] Draft loads on reopen
- [ ] ESC key closes modal
- [ ] Backdrop click closes modal
- [ ] Delete button in edit mode
- [ ] Validation works (title required)
- [ ] Success toast on save
- [ ] Modal updates when clicking different goals

### Dream Modal
- [ ] Opens on create/edit
- [ ] Together pattern structure
- [ ] All fields present: title, description, category, cost, timeframe
- [ ] Category buttons work
- [ ] Auto-save to localStorage
- [ ] ESC key closes modal
- [ ] Backdrop click closes modal
- [ ] Delete button in edit mode
- [ ] Success toast on save

### Functionality
- [ ] Create goal → saves correctly
- [ ] Update goal → updates correctly
- [ ] Delete goal → removes correctly
- [ ] Create dream → saves correctly
- [ ] Update dream → updates correctly
- [ ] Delete dream → removes correctly
- [ ] Templates modal works
- [ ] Milestones display (if implemented)
- [ ] Check-ins display (if implemented)

### Merged Mode
- [ ] Ownership filter appears
- [ ] Partner name displays correctly
- [ ] Shared goals marked correctly
- [ ] Filter by ownership works
- [ ] Tracking mode toggle appears for shared items

### Responsive Testing
- [ ] Mobile (375px) → proper layout
- [ ] Tablet (768px) → appropriate sizing
- [ ] Desktop (1200px+) → centered with max 900px
- [ ] Modal: bottom-aligned mobile, centered desktop

### Accessibility
- [ ] Tab navigation works
- [ ] All buttons have aria-label
- [ ] Form inputs have proper labels
- [ ] Focus visible on all interactive elements

### Performance
- [ ] Auto-save debounced (if needed)
- [ ] Smooth animations (60fps)
- [ ] No layout shifts
- [ ] Fast initial render

---

## Common Pitfalls (Lessons from Notes)

| Issue | Solution | Prevention |
|-------|----------|------------|
| Duplicate headers | Exclude route from Layout.tsx | Check Layout.tsx before adding page header |
| Modal not updating on click | Add useEffect for initialData | Always update form state when initialData changes |
| Progress not displaying | Check database schema | Verify field names match between API and UI |
| Filters not working | Verify filter logic | Test all filter combinations |
| Stats incorrect | Check calculation logic | Test with different data states |
| Auto-save conflicts with edit mode | Only auto-save when !isEditing | Add isEditing check to auto-save useEffect |
| TypeScript errors in cards | Use inline styles for complex CSS | Avoid Tailwind classes not in config |

---

## Goals-Specific Challenges

### Challenge 1: Dual Tab Navigation (Goals + Dreams)
**Solution:**
- Use SegmentedControlV2 for tab navigation
- Separate state for each tab's filters
- Separate stats calculations
- Two separate modals (GoalFormModalV2 and DreamFormModalV2)

### Challenge 2: Progress Tracking
**Solution:**
- Progress bar component with terracotta gradient
- Show percentage (0-100%)
- Smooth transition animation
- Update on goal update mutation

### Challenge 3: Milestones & Check-ins
**Solution:**
- These are advanced features - implement basic UI/UX first
- Can enhance later if time permits
- Focus on core CRUD operations first

### Challenge 4: Shared Goals with Tracking Modes
**Solution:**
- Only show "Share with partner" toggle in merged mode
- Show tracking mode selection only when isShared is true
- Combined = one shared progress
- Individual = each person tracks separately (future enhancement)

### Challenge 5: Priority and Status Badges
**Solution:**
- Use color-coded badges
- Priority colors: low=gray, medium=blue, high=orange, critical=red
- Status colors: completed=green, in-progress=blue, on-hold=orange, etc.
- Display as small pills with matching background opacity

---

## File Modification Summary

**Files to Create:** 8
- ✏️ `src/goals/components/v2/GoalsHeaderV2.tsx`
- ✏️ `src/goals/components/v2/StatsCardsV2.tsx`
- ✏️ `src/goals/components/v2/FilterBarV2.tsx`
- ✏️ `src/goals/components/v2/GoalCardV2.tsx`
- ✏️ `src/goals/components/v2/DreamCardV2.tsx`
- ✏️ `src/goals/components/v2/GoalFormModalV2.tsx`
- ✏️ `src/goals/components/v2/DreamFormModalV2.tsx`
- ✏️ `src/goals/components/v2/index.ts`

**Files to Update:** 2
- ✏️ `src/pages/LifeGoals.tsx` - Integrate V2 components
- ✏️ `src/components/Layout.tsx` - Exclude duplicate header

**Reference Files:** 4
- 📖 `goals-design-spec.html`
- 📖 `src/pages/Together.tsx`
- 📖 `src/pages/Notes.tsx`
- 📖 `CLAUDE.md`

---

## Phase X: Code Quality & Cleanup (Post-Implementation) ⭐ **CRITICAL**

After completing the V2 implementation, perform these code quality improvements based on lessons learned from Notes and Journal modules.

### Step 1: Add Error Boundary (CRITICAL - Do First)

**Why:** Prevents crashes in one feature from taking down entire app

**File:** `src/pages/LifeGoals.tsx`

**Changes:**
```typescript
// BEFORE
const LifeGoalsPage: React.FC = () => {
  return <LifeGoalsContent />;
};

export default LifeGoalsPage;

// AFTER
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';

const LifeGoalsContent: React.FC = () => {
  // All existing content
};

const LifeGoalsPage: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="LifeGoals">
      <LifeGoalsContent />
    </FeatureErrorBoundary>
  );
};

export default LifeGoalsPage;
```

**Impact:** High - App stability improved, errors isolated to feature

---

### Step 2: Investigate and Remove Dead Code

**Why:** Reduces maintenance burden, improves clarity, smaller bundle

**Investigation Commands:**
```bash
# List all component files
find src/goals -name "*.tsx" -o -name "*.ts"

# Check if component is imported anywhere
grep -r "ComponentName" src --exclude-dir=goals

# Check if routed in App.tsx
grep "goals\|LifeGoals" src/App.tsx

# Check exports
grep -r "from.*goals" src
```

**Process:**
1. List all components in legacy directories (`components/layout/`, `components/old/`, etc.)
2. For each component:
   - Search codebase for imports
   - Check if routed in App.tsx
   - Check if exported in index.ts
   - If NOT used → Mark for deletion
3. Delete unused files
4. Clean up barrel exports (index.ts)

**Common Dead Code Patterns:**
- Old form components replaced by V2 modals
- Legacy header/footer components
- Unused loading/error states
- Duplicate card components
- View wrapper abstractions

**Example Cleanup:**
```bash
# After investigation, delete unused files
rm -rf src/goals/components/layout/OldComponent.tsx
rm -rf src/goals/components/old/

# Update index.ts to remove deleted exports
# (Manual edit to remove references to deleted components)

# Stage deletions
git add -u src/goals/
```

**Expected Impact:** -200 to -1,000 lines depending on module size

---

### Step 3: Replace Duplicate Date Formatting

**Why:** DRY principle, consistent formatting, less code to maintain

**Problem Pattern:**
```typescript
// ❌ DUPLICATE in component (10-20 lines)
const formatRelativeTime = (date: string) => {
  const now = new Date();
  const entryDate = new Date(date);
  const diffMs = now.getTime() - entryDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return entryDate.toLocaleDateString();
};
```

**Solution:**
```typescript
// ✅ USE SHARED UTILITY
import { getRelativeTime } from '@/utils/dateUtils';

// In component:
{getRelativeTime(createdAt)}
```

**Available Utilities in `src/utils/dateUtils.ts`:**
- `getRelativeTime(date)` - Returns "2 hours ago", "Yesterday", etc.
- `isSameDay(date1, date2)` - Compares dates ignoring time
- `formatDateForDisplay(date)` - Returns "Jan 15, 2025"
- `formatDateTimeForDisplay(date)` - Returns "Jan 15, 2025 at 3:30 PM"
- `addDays(date, days)` - Add/subtract days
- `startOfDay(date)` - Set to 00:00:00
- `endOfDay(date)` - Set to 23:59:59

**Search for Duplicates:**
```bash
# Find potential date formatting code
grep -r "toLocaleDateString\|getTime\|setHours.*0.*0.*0" src/goals/components/
```

**Expected Impact:** -15 to -40 lines per card component

---

### Step 4: Replace Framer Motion with CSS Transitions

**Why:** Smaller bundle (-20-30KB), better performance, native browser optimization

**Problem:**
```typescript
// ❌ HEAVY LIBRARY for simple hover/tap effects
import { motion } from 'framer-motion';

<motion.div
  whileHover={{ scale: 1.01 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
>
```

**Solution:**
```typescript
// ✅ CSS TRANSITIONS (equivalent effect, zero JS)
<div
  className="transition-transform hover:scale-[1.01] active:scale-[0.98]"
  style={{ transitionDuration: '150ms' }}
>
```

**Common Framer Motion Replacements:**

| Framer Motion | CSS Equivalent |
|---------------|----------------|
| `whileHover={{ scale: 1.01 }}` | `hover:scale-[1.01]` |
| `whileTap={{ scale: 0.98 }}` | `active:scale-[0.98]` |
| `whileHover={{ opacity: 0.8 }}` | `hover:opacity-80` |
| `transition={{ duration: 0.15 }}` | `style={{ transitionDuration: '150ms' }}` |
| `initial={{ opacity: 0 }}` | Use CSS `@keyframes` or remove (not needed for simple cards) |

**Search for Usage:**
```bash
# Find Framer Motion imports
grep -r "framer-motion" src/goals/
```

**Expected Impact:** -20-30KB bundle size

---

### Step 5: Use Theme Colors Consistently

**Why:** Automatic dark mode support, consistency, easier theming

**Problem:**
```typescript
// ❌ HARDCODED COLORS (no dark mode support)
<div style={{ color: '#5C4A3A' }}>
<div style={{ backgroundColor: '#F5F0EA' }}>
<div style={{ borderColor: '#E8DCC8' }}>
```

**Solution:**
```typescript
// ✅ THEME COLORS (automatic dark mode)
import { useThemeColors } from '@/hooks/useThemeColors';

const colors = useThemeColors();

<div style={{ color: colors.text.primary }}>
<div style={{ backgroundColor: colors.bg.secondary }}>
<div style={{ borderColor: colors.border.light }}>
```

**Theme Colors Reference:**
```typescript
// Background colors
colors.bg.primary      // Page background
colors.bg.secondary    // Section background
colors.bg.tertiary     // Card accent background
colors.bg.white        // Card background

// Text colors
colors.text.primary    // Headings, important text
colors.text.secondary  // Body text, labels
colors.text.tertiary   // Muted text, timestamps

// Border colors
colors.border.light    // Subtle borders
colors.border.medium   // Standard borders

// Accent colors (terracotta)
colors.accent.start    // #D4A574 (gradient start)
colors.accent.end      // #C18B5E (gradient end)

// Badge colors
colors.badge.bg        // Badge background
colors.badge.text      // Badge text
```

**Search for Hardcoded Colors:**
```bash
# Find hex colors in components
grep -r "#[0-9A-Fa-f]\{6\}" src/goals/components/
```

**Expected Impact:** 5-15 hardcoded colors replaced per module

---

### Step 6: Use Shared Date Comparison Utilities

**Why:** DRY principle, consistent date logic

**Problem:**
```typescript
// ❌ DUPLICATE date comparison (8-10 lines)
const selectedItems = items.filter((item) => {
  const itemDate = new Date(item.createdAt);
  itemDate.setHours(0, 0, 0, 0);
  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0);
  return itemDate.getTime() === selected.getTime();
});
```

**Solution:**
```typescript
// ✅ USE SHARED UTILITY (1 line)
import { isSameDay } from '@/utils/dateUtils';

const selectedItems = items.filter(item =>
  isSameDay(item.createdAt, selectedDate)
);
```

**Expected Impact:** -8 to -15 lines per occurrence

---

### Step 7: Clean Up Unused Imports

**Why:** Cleaner code, better tree-shaking, smaller bundle

**How:**
```bash
# Build will show warnings
npm run build

# Or use ESLint
npx eslint src/goals --fix
```

**Common Unused Imports After V2 Migration:**
- Old component imports (replaced by V2)
- Unused icon imports
- Framer Motion
- Unused type imports
- Duplicate utility imports

---

### Step 8: Clean Up Module Exports

**Why:** Clear API, prevents importing deleted components

**File:** `src/goals/index.ts` or `src/goals/components/v2/index.ts`

**Before:**
```typescript
// ❌ Exports deleted/unused components
export { OldComponent } from './components/OldComponent';
export { LegacyHeader } from './components/LegacyHeader';
export { UnusedView } from './components/UnusedView';
// ... 15+ mixed exports
```

**After:**
```typescript
// ✅ Only export active components, grouped logically

// V2 Components (primary)
export { GoalsHeaderV2 } from './GoalsHeaderV2';
export { GoalCardV2 } from './GoalCardV2';
export { GoalFormModalV2 } from './GoalFormModalV2';
export { DreamCardV2 } from './DreamCardV2';
export { DreamFormModalV2 } from './DreamFormModalV2';

// Legacy (actively used only)
export { DetailView } from '../DetailView'; // Still routed in App.tsx

// Hooks
export { useGoalsQuery } from '../../hooks';
```

---

### Step 9: Verification & Testing

**Build Check:**
```bash
# Ensure no TypeScript errors
npx tsc --noEmit

# Ensure build succeeds
npm run build

# Check for warnings
npm run build 2>&1 | grep -i "warning"
```

**Manual Testing:**
- [ ] Feature loads without errors
- [ ] All modals open/close correctly
- [ ] CRUD operations work
- [ ] Filters work
- [ ] Search works (if applicable)
- [ ] Responsive design intact
- [ ] Error boundary catches errors (test by throwing error)

**Performance Check:**
```bash
# Check bundle size before/after
npm run build -- --stats
```

---

### Code Quality Checklist

After completing all steps, verify:

- [ ] ✅ Error boundary added to main page component
- [ ] ✅ Dead code identified and deleted (0 unused files remain)
- [ ] ✅ Duplicate date formatting replaced with `getRelativeTime()`
- [ ] ✅ Duplicate date comparison replaced with `isSameDay()`
- [ ] ✅ Framer Motion replaced with CSS (if applicable)
- [ ] ✅ Theme colors used consistently (no hardcoded hex colors)
- [ ] ✅ Unused imports removed
- [ ] ✅ Module exports cleaned up (only active components exported)
- [ ] ✅ Build succeeds with no errors or warnings
- [ ] ✅ Manual testing completed successfully
- [ ] ✅ Module marked as 100% CLAUDE.md compliant

---

### Expected Overall Impact

**Metrics:**
- Lines removed: -200 to -1,000 (varies by module complexity)
- Files deleted: 3-10 legacy components
- Bundle size: -20-40KB (if Framer Motion removed)
- Error boundaries: +1 (critical for stability)
- Code grade: C/D range → A (95/100)

**Benefits:**
- ✅ Crash isolation (errors don't take down entire app)
- ✅ Smaller bundle (faster load times)
- ✅ Less maintenance (no duplicate code)
- ✅ Consistent theming (dark mode ready)
- ✅ Better performance (CSS vs JS animations)
- ✅ Cleaner codebase (easier to understand)

---

## Commit Message Template

```bash
feat: Complete Goals tab UI/UX enhancement with Together patterns

Updated Goals feature to match goals-design-spec.html and apply all 25 UI/UX
enhancement patterns from CLAUDE.md. Major improvements include:

UI Components:
- Created GoalsHeaderV2: Simple header matching Together tab (emoji + title)
- Created StatsCardsV2: Three-column stats with icons
- Created FilterBarV2: Pill-style filters (status + ownership)
- Created GoalCardV2: Enhanced cards with progress bars and priority badges
- Created DreamCardV2: Enhanced cards with cost/timeframe display

Modals (Together Pattern):
- Created GoalFormModalV2: Full Together pattern with auto-save, ESC key, backdrop
- Created DreamFormModalV2: Same pattern for dreams
- Added mobile drag handles, fixed headers/footers, scrollable content
- Auto-save to localStorage for drafts
- Delete buttons in edit mode
- Tracking mode selection for shared goals

Page Layout:
- Applied centered layout (900px max-width)
- Removed duplicate "Life Goals" header from Layout.tsx
- Added proper padding and spacing

Features:
- Dual tab navigation (Goals/Dreams) with SegmentedControlV2
- Pill-style filter buttons (status + ownership in merged mode)
- Progress bars with terracotta gradient
- Priority and status badges with color coding
- Owner badges in merged mode
- Success toasts for all operations

Technical:
- Used useModalState hook for modal management
- All V2 components in src/goals/components/v2/
- Maintained existing functionality (milestones, check-ins, templates)
- Responsive mobile/desktop behavior

Fixes:
- No duplicate headers
- Modals update correctly when clicking different items
- Auto-save doesn't conflict with edit mode
- All filters work correctly

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Success Criteria

✅ Goals page matches `goals-design-spec.html` exactly
✅ All 25 UI/UX patterns from CLAUDE.md applied
✅ Modal structure matches Together tab (both goal and dream modals)
✅ Auto-save functionality works for both modals
✅ Centered page layout (900px max-width)
✅ Simple header matching Together tab
✅ Pill-style filter buttons
✅ Enhanced stats cards
✅ Progress bars with terracotta gradient
✅ Priority and status badges color-coded
✅ Dual tab navigation (Goals/Dreams)
✅ Responsive on mobile and desktop
✅ All existing features work (milestones, check-ins, templates, merged mode)
✅ Accessible (keyboard, screen readers)
✅ Smooth animations and transitions
✅ No console errors or warnings

---

## Estimated Complexity

**Complexity:** High (dual tabs, multiple modals, progress tracking, badges)
**Risk Level:** Medium (complex feature with many components, but clear specification)
**Estimated Components:** 8 new V2 components + 2 file updates

---

## Next Steps After Goals

After completing Goals, the remaining tabs in priority order:

1. **Tasks** - Similar to Goals (milestones, progress, priorities)
2. **Shopping** - Lists with items, pantry tracking
3. **Meals** - Meal planning, recipes, ingredients
4. **Travel** - Trip planning with itineraries
5. **Finance** - Complex with accounts, transactions, budgets
6. **Nutrition** - Food logging, macros tracking
7. **Self Care** - Activities and routines
8. **Projects** - Project management with tasks
9. **Focus** - Focus sessions and tracking
10. **Calendar** - Calendar view with events
11. **Dashboard** - Overview of all features
12. **Assistant** - AI assistant interface

Each will have a detailed plan created before implementation.
