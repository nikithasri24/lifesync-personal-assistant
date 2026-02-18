# Tasks Tab UI/UX Enhancement Plan

## Context

The Tasks feature (Todos.tsx) needs to be updated to match the design specifications in `tasks-design-spec.html` and apply all 25 UI/UX enhancement patterns from CLAUDE.md (established by the Together tab reference implementation).

**Current State:**
- Tasks page exists at `src/pages/Todos.tsx` with partial V2 components
- Has V2 components: TasksHeaderV2, TaskCardV2, TaskListViewV2, QuickAddModalV2, PriorityBadgeV2
- Multiple views: Today, Inbox, Upcoming, List, Kanban, Matrix
- Has: Projects, subtasks, recurring tasks, dependencies, time tracking
- Missing: Fully implemented Together modal pattern, complete V2 styling, centered layout
- Header uses gradient text (needs simplification)

**Goal:**
- Match `tasks-design-spec.html` styling exactly
- Apply all Together tab UI patterns
- Maintain existing functionality (projects, subtasks, recurrence, dependencies, etc.)
- Ensure responsive mobile/desktop behavior
- Simplify header to match Together tab
- Complete V2 implementation for all modals and components

**Why This Matters:**
- Tasks is the most complex feature (6 views, multiple sub-features)
- Has advanced features (recurrence, dependencies, time tracking)
- Demonstrates how to handle complex multi-view features
- Most frequently used feature
- Will serve as reference for other complex features

---

## Critical Files to Modify

### Primary Files (Must Update)
1. `src/pages/Todos.tsx` - Main page component (currently ~700 lines)
2. `src/todos/components/v2/TasksHeaderV2.tsx` - Simplify header (remove gradient, match Together)
3. `src/todos/components/v2/QuickAddModalV2.tsx` - Upgrade to Together pattern
4. `src/todos/components/v2/TaskCardV2.tsx` - Enhanced card styling
5. `src/todos/components/v2/TaskListViewV2.tsx` - List view component
6. `src/todos/components/Sidebar.tsx` - Sidebar navigation
7. `src/todos/components/Header.tsx` - Old header (may deprecate)

### V2 Components to Create
1. `src/todos/components/v2/TaskFormModalV2.tsx` - Full edit modal (Together pattern)
2. `src/todos/components/v2/ProjectFormModalV2.tsx` - Project modal
3. `src/todos/components/v2/SubtaskListV2.tsx` - Subtasks component
4. `src/todos/components/v2/FilterBarV2.tsx` - Pill-style filters
5. `src/todos/components/v2/ViewSelectorV2.tsx` - View tabs (Today/Inbox/Upcoming/List/Kanban/Matrix)
6. `src/todos/components/v2/ProjectBadgeV2.tsx` - Project badge
7. `src/todos/components/v2/StatusBadgeV2.tsx` - Status badge
8. `src/todos/components/v2/RecurrenceFormV2.tsx` - Recurrence settings
9. `src/todos/components/v2/DependenciesFormV2.tsx` - Dependencies selector
10. `src/todos/components/v2/index.ts` - Barrel exports

### Reference Files (Do NOT Modify)
- `src/pages/Together.tsx` - Reference implementation
- `src/pages/Notes.tsx` - Recent implementation with lessons learned
- `tasks-design-spec.html` - Design specification
- `CLAUDE.md` - UI/UX standards

---

## Phase 0: Discovery & Verification ⭐ **START HERE**

Before making any changes, verify the current state to avoid wasted effort.

### Step 1: Compare with Design Spec
```bash
# Open design spec in browser
open tasks-design-spec.html

# Run dev server and navigate to Tasks tab
npm run dev
# Navigate to: http://localhost:5173/ → Tasks tab
```

**Compare side-by-side:**
- [ ] Header design (gradient text vs simple)
- [ ] View selector (Today/Inbox/Upcoming/List/Kanban/Matrix)
- [ ] Task cards styling
- [ ] QuickAdd modal structure
- [ ] Full edit modal structure
- [ ] Project selector
- [ ] Priority/status badges
- [ ] Subtasks display
- [ ] Recurring task indicator
- [ ] Empty states
- [ ] FAB placement
- [ ] Sidebar (if present)

### Step 2: Inspect Current Database Schema
```typescript
// Tasks stored in: tasks table
// Projects: projects table
// No separate subtasks table - stored as tasks with parent_id

// Key fields to verify:
// - status (todo | done | waiting | scheduled | in_progress)
// - priority (low | medium | high | urgent | important)
// - category (work | personal | learning | creative | health | other)
// - recurrence_pattern (none | daily | weekly | monthly | yearly | custom)
// - parent_id (for subtasks)
// - project_id (belongs to project)
// - depends_on (task dependencies array)
// - starred, archived, deleted (boolean flags)
```

### Step 3: Check Current Component Structure
```bash
# List existing V2 components
ls -la src/todos/components/v2/

# Expected output:
# - TasksHeaderV2.tsx ✓ (exists, needs simplification)
# - TaskCardV2.tsx ✓ (exists, needs enhancement)
# - TaskListViewV2.tsx ✓ (exists, needs verification)
# - QuickAddModalV2.tsx ✓ (exists, needs Together pattern upgrade)
# - PriorityBadgeV2.tsx ✓ (exists, needs verification)
```

### Step 4: Review Current Hooks
```bash
# Check Tasks query hook
cat src/hooks/useTasksQuery.ts | head -50
```

**Verify hooks available:**
- [ ] `useTasks()` - Fetch all tasks
- [ ] `useProjects()` - Fetch all projects
- [ ] `useCreateTask()` - Create task
- [ ] `useUpdateTask()` - Update task
- [ ] `useDeleteTask()` - Delete task
- [ ] `useCreateProject()` - Create project
- [ ] `useUpdateProject()` - Update project
- [ ] `useDeleteProject()` - Delete project
- [ ] `useMergedTasksConnectionQuery()` - Merged mode connection

### Step 5: Identify Gaps

**From design spec comparison, identify missing/broken:**
- Header has gradient text (should be simple like Together)
- QuickAdd modal doesn't match Together pattern
- Full edit modal doesn't exist yet
- No centered layout
- Filter bar uses old pattern (not pills)
- View selector needs styling update
- [Add more as you discover them]

**Document in notes:**
```
Current Issues to Fix:
1. Header uses gradient text (should be simple like Together)
2. QuickAdd modal doesn't have Together structure (no drag handle, etc.)
3. No full edit modal (TaskFormModalV2) - need to create
4. No centered layout (900px max-width)
5. Sidebar takes up space (consider making it an overlay or removing)
6. [Add more as you discover them]
```

---

## Implementation Plan

### Phase 1: Page Layout - Centered Container

**File:** `src/pages/Todos.tsx`

**Current structure:**
```typescript
// Current (no centered container, has sidebar)
return (
  <div className="flex h-screen">
    <Sidebar />
    <div className="flex-1">
      <Header />
      {/* Content */}
    </div>
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
         <TasksHeaderV2 />
         {/* View selector, filters, content */}
       </div>
     </div>
   );
   ```

2. Remove or convert Sidebar to overlay/modal if needed
3. Update Layout.tsx to exclude duplicate header:
   ```typescript
   // src/components/Layout.tsx
   {!isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && activeView !== 'todos' && (
   {isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && activeView !== 'todos' && (
   ```

**Expected Outcome:**
- Content centered on desktop (max 900px wide)
- Full width on mobile (minus padding)
- No duplicate "Tasks" header
- No sidebar taking up horizontal space
- Matches Together/Notes/Goals layout

---

### Phase 2: Update TasksHeaderV2 Component

**File:** `src/todos/components/v2/TasksHeaderV2.tsx`

**Current:**
```tsx
// Uses gradient text with search/filter buttons
<h1 style={{
  background: gradients.text,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}}>
  {title}
</h1>
```

**Changes:**
1. Simplify to match Together tab pattern:
   ```tsx
   import React from 'react';
   import { useThemeColors } from '@/hooks/useThemeColors';

   export const TasksHeaderV2: React.FC = () => {
     const colors = useThemeColors();

     return (
       <div className="mb-6">
         <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
           <span className="text-4xl">✅</span>
           Tasks
         </h1>
         <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
           Organize and track your to-dos
         </p>
       </div>
     );
   };
   ```

2. Remove search/filter buttons from header (move to FilterBarV2)

**Why This Change:**
- Gradient text is too prominent and inconsistent with Together tab
- Simple header matches established pattern
- Cleaner, more focused design
- Actions should be in filter bar, not header

**Expected Outcome:**
- Simple header with emoji ✅
- No gradient text
- Matches Together/Notes/Goals style
- Single "Tasks" text (no duplication)

---

### Phase 3: Create ViewSelectorV2 Component

**File:** `src/todos/components/v2/ViewSelectorV2.tsx` (Create new)

**Changes:**
1. Create view selector with pill-style tabs:
   ```tsx
   import React from 'react';
   import { useThemeColors } from '@/hooks/useThemeColors';
   import { SegmentedControlV2 } from '@/components/v2/SegmentedControlV2';

   export type TaskView = 'today' | 'inbox' | 'upcoming' | 'list' | 'kanban' | 'matrix';

   interface ViewSelectorV2Props {
     activeView: TaskView;
     onChange: (view: TaskView) => void;
   }

   export const ViewSelectorV2: React.FC<ViewSelectorV2Props> = ({
     activeView,
     onChange,
   }) => {
     return (
       <div className="mb-6">
         {/* Primary Views (More Common) */}
         <div className="mb-3">
           <SegmentedControlV2
             options={[
               { value: 'today', label: '📅 Today' },
               { value: 'inbox', label: '📥 Inbox' },
               { value: 'upcoming', label: '🗓️ Upcoming' },
             ]}
             value={activeView}
             onChange={(value) => onChange(value as TaskView)}
           />
         </div>

         {/* Advanced Views (Less Common) */}
         <div className="flex gap-2 flex-wrap">
           {[
             { value: 'list' as const, label: '📋 List' },
             { value: 'kanban' as const, label: '📊 Kanban' },
             { value: 'matrix' as const, label: '🎯 Matrix' },
           ].map((view) => (
             <button
               key={view.value}
               onClick={() => onChange(view.value)}
               className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
               style={{
                 background: activeView === view.value
                   ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                   : '#F3F4F6',
                 borderWidth: '2px',
                 borderStyle: 'solid',
                 borderColor: activeView === view.value ? '#C18B5E' : 'transparent',
                 color: activeView === view.value ? '#C18B5E' : '#6B7280',
               }}
             >
               {view.label}
             </button>
           ))}
         </div>
       </div>
     );
   };
   ```

**Expected Outcome:**
- Primary views (Today/Inbox/Upcoming) use SegmentedControlV2
- Advanced views (List/Kanban/Matrix) as pill buttons below
- Active view highlighted with terracotta
- Smooth transitions

---

### Phase 4: Create FilterBarV2 Component

**File:** `src/todos/components/v2/FilterBarV2.tsx` (Create new)

**Changes:**
1. Create pill-style filter buttons:
   ```tsx
   import React from 'react';
   import { useThemeColors } from '@/hooks/useThemeColors';
   import { Search, Filter, FolderOpen } from 'lucide-react';

   export type PriorityFilter = 'all' | 'urgent' | 'important' | 'high' | 'medium' | 'low';
   export type StatusFilter = 'all' | 'todo' | 'in_progress' | 'done' | 'waiting';
   export type ProjectFilter = 'all' | string; // 'all' or project ID

   interface FilterBarV2Props {
     priorityFilter: PriorityFilter;
     onPriorityFilterChange: (filter: PriorityFilter) => void;
     statusFilter: StatusFilter;
     onStatusFilterChange: (filter: StatusFilter) => void;
     projectFilter: ProjectFilter;
     onProjectFilterChange: (filter: ProjectFilter) => void;
     projects: Array<{ id: string; name: string; color?: string }>;
     searchQuery: string;
     onSearchChange: (query: string) => void;
     showStarredOnly: boolean;
     onToggleStarred: () => void;
   }

   export const FilterBarV2: React.FC<FilterBarV2Props> = ({
     priorityFilter,
     onPriorityFilterChange,
     statusFilter,
     onStatusFilterChange,
     projectFilter,
     onProjectFilterChange,
     projects,
     searchQuery,
     onSearchChange,
     showStarredOnly,
     onToggleStarred,
   }) => {
     const colors = useThemeColors();

     const priorityOptions: { value: PriorityFilter; label: string; color: string }[] = [
       { value: 'all', label: 'All Priorities', color: '#6B7280' },
       { value: 'urgent', label: '🔥 Urgent', color: '#EF4444' },
       { value: 'important', label: '⭐ Important', color: '#F59E0B' },
       { value: 'high', label: 'High', color: '#F97316' },
       { value: 'medium', label: 'Medium', color: '#3B82F6' },
       { value: 'low', label: 'Low', color: '#6B7280' },
     ];

     const statusOptions: { value: StatusFilter; label: string }[] = [
       { value: 'all', label: 'All' },
       { value: 'todo', label: 'To Do' },
       { value: 'in_progress', label: 'In Progress' },
       { value: 'waiting', label: 'Waiting' },
       { value: 'done', label: 'Done' },
     ];

     return (
       <div className="mb-6 space-y-3">
         {/* Search Bar */}
         <div className="relative">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: colors.text.tertiary }} />
           <input
             type="text"
             value={searchQuery}
             onChange={(e) => onSearchChange(e.target.value)}
             placeholder="Search tasks..."
             className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
           />
         </div>

         {/* Quick Filters */}
         <div className="flex gap-2 flex-wrap">
           <button
             onClick={onToggleStarred}
             className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
             style={{
               background: showStarredOnly
                 ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                 : colors.bg.secondary,
               borderWidth: '2px',
               borderStyle: 'solid',
               borderColor: showStarredOnly ? '#C18B5E' : 'transparent',
               color: showStarredOnly ? '#C18B5E' : colors.text.secondary,
             }}
           >
             ⭐ Starred
           </button>
         </div>

         {/* Priority Filter Pills */}
         <div>
           <div className="text-xs font-semibold mb-2" style={{ color: colors.text.tertiary }}>
             Priority
           </div>
           <div className="flex gap-2 flex-wrap">
             {priorityOptions.map((option) => (
               <button
                 key={option.value}
                 onClick={() => onPriorityFilterChange(option.value)}
                 className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                 style={{
                   background: priorityFilter === option.value
                     ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                     : colors.bg.secondary,
                   borderWidth: '2px',
                   borderStyle: 'solid',
                   borderColor: priorityFilter === option.value ? '#C18B5E' : 'transparent',
                   color: priorityFilter === option.value ? '#C18B5E' : colors.text.secondary,
                 }}
               >
                 {option.label}
               </button>
             ))}
           </div>
         </div>

         {/* Status Filter Pills */}
         <div>
           <div className="text-xs font-semibold mb-2" style={{ color: colors.text.tertiary }}>
             Status
           </div>
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
         </div>

         {/* Project Filter Pills */}
         {projects.length > 0 && (
           <div>
             <div className="text-xs font-semibold mb-2" style={{ color: colors.text.tertiary }}>
               Project
             </div>
             <div className="flex gap-2 flex-wrap">
               <button
                 onClick={() => onProjectFilterChange('all')}
                 className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                 style={{
                   background: projectFilter === 'all'
                     ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                     : colors.bg.secondary,
                   borderWidth: '2px',
                   borderStyle: 'solid',
                   borderColor: projectFilter === 'all' ? '#C18B5E' : 'transparent',
                   color: projectFilter === 'all' ? '#C18B5E' : colors.text.secondary,
                 }}
               >
                 All Projects
               </button>
               {projects.map((project) => (
                 <button
                   key={project.id}
                   onClick={() => onProjectFilterChange(project.id)}
                   className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                   style={{
                     background: projectFilter === project.id
                       ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                       : colors.bg.secondary,
                     borderWidth: '2px',
                     borderStyle: 'solid',
                     borderColor: projectFilter === project.id ? '#C18B5E' : 'transparent',
                     color: projectFilter === project.id ? '#C18B5E' : colors.text.secondary,
                   }}
                 >
                   <span
                     className="inline-block w-2 h-2 rounded-full mr-2"
                     style={{ backgroundColor: project.color || '#6B7280' }}
                   />
                   {project.name}
                 </button>
               ))}
             </div>
           </div>
         )}
       </div>
     );
   };
   ```

**Expected Outcome:**
- Search bar at top
- Pill-style filter buttons (priority, status, project)
- Starred toggle button
- Active pills highlighted with terracotta
- Project pills show project color dot
- Smooth transitions

---

### Phase 5: Upgrade QuickAddModalV2 to Together Pattern

**File:** `src/todos/components/v2/QuickAddModalV2.tsx`

**Current:**
```tsx
// Current has basic modal structure, not Together pattern
<div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
  <div className="w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-2xl shadow-2xl">
    {/* Form */}
  </div>
</div>
```

**Changes:**
1. **Upgrade to Together pattern with all features:**
   ```tsx
   import React, { useState, useEffect, useRef } from 'react';
   import { X } from 'lucide-react';
   import { logger } from '@/services/logger';

   const STORAGE_KEY = 'tasks_quickadd_draft';

   export interface QuickAddModalV2Props {
     isOpen: boolean;
     onClose: () => void;
     onSubmit: (title: string) => void;
     isPending?: boolean;
   }

   export const QuickAddModalV2: React.FC<QuickAddModalV2Props> = ({
     isOpen,
     onClose,
     onSubmit,
     isPending = false,
   }) => {
     // Load draft
     const loadDraft = () => {
       try {
         const saved = localStorage.getItem(STORAGE_KEY);
         return saved ? saved : '';
       } catch (error) {
         logger.error('Tasks', error as Error, { context: 'Failed to load draft' });
         return '';
       }
     };

     const [title, setTitle] = useState(loadDraft());
     const inputRef = useRef<HTMLInputElement>(null);

     // Auto-save
     useEffect(() => {
       if (title) {
         localStorage.setItem(STORAGE_KEY, title);
       }
     }, [title]);

     // ESC key support
     useEffect(() => {
       const handleKeyDown = (event: KeyboardEvent) => {
         if (event.key === 'Escape') {
           onClose();
         }
       };

       if (isOpen) {
         window.addEventListener('keydown', handleKeyDown);
         setTimeout(() => inputRef.current?.focus(), 100);
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

       onSubmit(title.trim());
       localStorage.removeItem(STORAGE_KEY);
       setTitle('');
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
             <h2 className="text-2xl font-bold text-gray-900">Quick Add Task</h2>
             <button
               type="button"
               onClick={onClose}
               className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
               aria-label="Close"
             >
               <X className="w-5 h-5 text-gray-500" />
             </button>
           </div>

           {/* Form */}
           <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
             <div className="overflow-y-auto p-6 flex-1">
               <input
                 ref={inputRef}
                 type="text"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 placeholder="What needs to be done?"
                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                 autoFocus
               />
               <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                 Press Enter to add, or click "More Options" for full form
               </p>
             </div>

             {/* Fixed Footer */}
             <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
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
                 {isPending ? 'Adding...' : 'Add Task'}
               </button>
             </div>
           </form>
         </div>
       </div>
     );
   };
   ```

**Expected Outcome:**
- Modal matches Together tab pattern
- Auto-saves draft to localStorage
- ESC key and backdrop click support
- Mobile drag handle
- Fixed header/footer
- Loading states

---

### Phase 6: Create TaskFormModalV2 Component (Full Edit Modal)

**File:** `src/todos/components/v2/TaskFormModalV2.tsx` (Create new)

**This is a COMPLETE new modal for full task editing with all features.**

**Changes:**
1. **Create comprehensive edit modal:**
   ```tsx
   import React, { useState, useEffect } from 'react';
   import { X, Calendar, Flag, Folder, Repeat, Link2 } from 'lucide-react';
   import type { TaskData, ProjectData } from '@/services/types';
   import { logger } from '@/services/logger';

   const STORAGE_KEY = 'tasks_edit_draft';

   export interface TaskFormModalV2Props {
     isOpen: boolean;
     onClose: () => void;
     onSubmit: (data: Partial<TaskData>) => void;
     onDelete?: () => void;
     initialData?: Partial<TaskData>;
     projects: ProjectData[];
     isEditing?: boolean;
     isPending?: boolean;
   }

   export const TaskFormModalV2: React.FC<TaskFormModalV2Props> = ({
     isOpen,
     onClose,
     onSubmit,
     onDelete,
     initialData,
     projects,
     isEditing = false,
     isPending = false,
   }) => {
     const loadDraft = () => {
       try {
         const saved = localStorage.getItem(STORAGE_KEY);
         if (saved) return JSON.parse(saved);
       } catch (error) {
         logger.error('Tasks', error as Error, { context: 'Failed to load draft' });
       }
       return null;
     };

     const savedDraft = !initialData ? loadDraft() : null;

     const [title, setTitle] = useState(initialData?.title || savedDraft?.title || '');
     const [description, setDescription] = useState(initialData?.description || savedDraft?.description || '');
     const [priority, setPriority] = useState<TaskData['priority']>(initialData?.priority || savedDraft?.priority || 'medium');
     const [status, setStatus] = useState<TaskData['status']>(initialData?.status || savedDraft?.status || 'todo');
     const [category, setCategory] = useState<TaskData['category']>(initialData?.category || savedDraft?.category || 'personal');
     const [projectId, setProjectId] = useState<string | null>(initialData?.project_id || savedDraft?.project_id || null);
     const [dueDate, setDueDate] = useState(initialData?.due_date || savedDraft?.due_date || '');
     const [estimatedTime, setEstimatedTime] = useState(initialData?.estimated_time?.toString() || savedDraft?.estimated_time || '');
     const [tags, setTags] = useState((initialData?.tags || savedDraft?.tags || []).join(', '));
     const [starred, setStarred] = useState(initialData?.starred || savedDraft?.starred || false);
     const [recurrencePattern, setRecurrencePattern] = useState<TaskData['recurrence_pattern']>(
       initialData?.recurrence_pattern || savedDraft?.recurrence_pattern || 'none'
     );

     // Update form when initialData changes
     useEffect(() => {
       if (initialData) {
         setTitle(initialData.title || '');
         setDescription(initialData.description || '');
         setPriority(initialData.priority || 'medium');
         setStatus(initialData.status || 'todo');
         setCategory(initialData.category || 'personal');
         setProjectId(initialData.project_id || null);
         setDueDate(initialData.due_date || '');
         setEstimatedTime(initialData.estimated_time?.toString() || '');
         setTags((initialData.tags || []).join(', '));
         setStarred(initialData.starred || false);
         setRecurrencePattern(initialData.recurrence_pattern || 'none');
       } else if (!isEditing) {
         const draft = loadDraft();
         if (draft) {
           setTitle(draft.title || '');
           setDescription(draft.description || '');
           setPriority(draft.priority || 'medium');
           setStatus(draft.status || 'todo');
           setCategory(draft.category || 'personal');
           setProjectId(draft.project_id || null);
           setDueDate(draft.due_date || '');
           setEstimatedTime(draft.estimated_time || '');
           setTags((draft.tags || []).join(', '));
           setStarred(draft.starred || false);
           setRecurrencePattern(draft.recurrence_pattern || 'none');
         }
       }
     }, [initialData, isEditing]);

     // Auto-save
     useEffect(() => {
       if (!isEditing && (title || description)) {
         localStorage.setItem(STORAGE_KEY, JSON.stringify({
           title, description, priority, status, category, project_id: projectId,
           due_date: dueDate, estimated_time: estimatedTime, tags: tags.split(',').map(t => t.trim()).filter(Boolean),
           starred, recurrence_pattern: recurrencePattern,
         }));
       }
     }, [title, description, priority, status, category, projectId, dueDate, estimatedTime, tags, starred, recurrencePattern, isEditing]);

     // ESC key
     useEffect(() => {
       const handleKeyDown = (event: KeyboardEvent) => {
         if (event.key === 'Escape') onClose();
       };
       if (isOpen) {
         window.addEventListener('keydown', handleKeyDown);
         return () => window.removeEventListener('keydown', handleKeyDown);
       }
     }, [isOpen, onClose]);

     const handleBackdropClick = (e: React.MouseEvent) => {
       if (e.target === e.currentTarget) onClose();
     };

     const handleSubmit = (e: React.FormEvent) => {
       e.preventDefault();
       if (!title.trim()) return;

       onSubmit({
         title: title.trim(),
         description: description.trim() || undefined,
         priority,
         status,
         category,
         project_id: projectId,
         due_date: dueDate || null,
         estimated_time: estimatedTime ? parseInt(estimatedTime, 10) : null,
         tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
         starred,
         recurrence_pattern: recurrencePattern,
       });

       localStorage.removeItem(STORAGE_KEY);
       // Reset form
       setTitle('');
       setDescription('');
       setPriority('medium');
       setStatus('todo');
       setCategory('personal');
       setProjectId(null);
       setDueDate('');
       setEstimatedTime('');
       setTags('');
       setStarred(false);
       setRecurrencePattern('none');
     };

     if (!isOpen) return null;

     const priorityOptions = [
       { value: 'urgent', label: '🔥 Urgent', color: '#EF4444' },
       { value: 'important', label: '⭐ Important', color: '#F59E0B' },
       { value: 'high', label: 'High', color: '#F97316' },
       { value: 'medium', label: 'Medium', color: '#3B82F6' },
       { value: 'low', label: 'Low', color: '#6B7280' },
     ];

     const statusOptions = [
       { value: 'todo', label: 'To Do' },
       { value: 'in_progress', label: 'In Progress' },
       { value: 'waiting', label: 'Waiting' },
       { value: 'scheduled', label: 'Scheduled' },
       { value: 'done', label: 'Done' },
     ];

     const categoryOptions = [
       { value: 'work', label: '💼 Work' },
       { value: 'personal', label: '🏠 Personal' },
       { value: 'learning', label: '📚 Learning' },
       { value: 'creative', label: '🎨 Creative' },
       { value: 'health', label: '💪 Health' },
       { value: 'other', label: '📌 Other' },
     ];

     const recurrenceOptions = [
       { value: 'none', label: 'None' },
       { value: 'daily', label: 'Daily' },
       { value: 'weekly', label: 'Weekly' },
       { value: 'monthly', label: 'Monthly' },
       { value: 'yearly', label: 'Yearly' },
     ];

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
               {isEditing ? 'Edit Task' : 'Create Task'}
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
               {/* Title */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Task Title
                 </label>
                 <input
                   type="text"
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   placeholder="What needs to be done?"
                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                   required
                   autoFocus
                 />
               </div>

               {/* Description */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Description (optional)
                 </label>
                 <textarea
                   rows={4}
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="Add more details..."
                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                 />
               </div>

               {/* Priority */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Priority
                 </label>
                 <div className="grid grid-cols-2 gap-2">
                   {priorityOptions.map((option) => (
                     <button
                       key={option.value}
                       type="button"
                       onClick={() => setPriority(option.value as TaskData['priority'])}
                       className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                       style={{
                         background: priority === option.value
                           ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                           : '#F3F4F6',
                         borderColor: priority === option.value ? '#C18B5E' : 'transparent',
                         color: priority === option.value ? '#C18B5E' : '#374151',
                       }}
                     >
                       <Flag className="w-4 h-4 inline mr-1" style={{ color: option.color }} />
                       {option.label}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Status */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Status
                 </label>
                 <div className="grid grid-cols-2 gap-2">
                   {statusOptions.map((option) => (
                     <button
                       key={option.value}
                       type="button"
                       onClick={() => setStatus(option.value as TaskData['status'])}
                       className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                       style={{
                         background: status === option.value
                           ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                           : '#F3F4F6',
                         borderColor: status === option.value ? '#C18B5E' : 'transparent',
                         color: status === option.value ? '#C18B5E' : '#374151',
                       }}
                     >
                       {option.label}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Category */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Category
                 </label>
                 <div className="grid grid-cols-2 gap-2">
                   {categoryOptions.map((option) => (
                     <button
                       key={option.value}
                       type="button"
                       onClick={() => setCategory(option.value as TaskData['category'])}
                       className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                       style={{
                         background: category === option.value
                           ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                           : '#F3F4F6',
                         borderColor: category === option.value ? '#C18B5E' : 'transparent',
                         color: category === option.value ? '#C18B5E' : '#374151',
                       }}
                     >
                       {option.label}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Project */}
               {projects.length > 0 && (
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Project (optional)
                   </label>
                   <select
                     value={projectId || ''}
                     onChange={(e) => setProjectId(e.target.value || null)}
                     className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                   >
                     <option value="">No Project</option>
                     {projects.map((project) => (
                       <option key={project.id} value={project.id}>
                         {project.name}
                       </option>
                     ))}
                   </select>
                 </div>
               )}

               {/* Due Date */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Due Date (optional)
                 </label>
                 <input
                   type="date"
                   value={dueDate}
                   onChange={(e) => setDueDate(e.target.value)}
                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                 />
               </div>

               {/* Estimated Time */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Estimated Time (minutes, optional)
                 </label>
                 <input
                   type="number"
                   value={estimatedTime}
                   onChange={(e) => setEstimatedTime(e.target.value)}
                   placeholder="30"
                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                   min="0"
                 />
               </div>

               {/* Recurrence */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Recurrence
                 </label>
                 <div className="flex gap-2 flex-wrap">
                   {recurrenceOptions.map((option) => (
                     <button
                       key={option.value}
                       type="button"
                       onClick={() => setRecurrencePattern(option.value as TaskData['recurrence_pattern'])}
                       className="px-4 py-2 rounded-full text-sm font-semibold transition-all border-2"
                       style={{
                         background: recurrencePattern === option.value
                           ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                           : '#F3F4F6',
                         borderColor: recurrencePattern === option.value ? '#C18B5E' : 'transparent',
                         color: recurrencePattern === option.value ? '#C18B5E' : '#374151',
                       }}
                     >
                       {option.label}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Tags */}
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">
                   Tags (optional)
                 </label>
                 <input
                   type="text"
                   value={tags}
                   onChange={(e) => setTags(e.target.value)}
                   placeholder="work, urgent, client"
                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                 />
                 <p className="text-xs mt-1 text-gray-500">Separate tags with commas</p>
               </div>

               {/* Starred */}
               <div>
                 <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                   <input
                     type="checkbox"
                     checked={starred}
                     onChange={(e) => setStarred(e.target.checked)}
                     className="w-5 h-5 text-terracotta-400 rounded focus:ring-terracotta-300"
                   />
                   <span className="font-medium text-gray-900">⭐ Star this task</span>
                 </label>
               </div>
             </div>

             {/* Fixed Footer */}
             <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
               {/* Delete button */}
               {isEditing && onDelete && (
                 <div className="mb-3">
                   <button
                     type="button"
                     onClick={() => {
                       if (window.confirm('Are you sure you want to delete this task?')) {
                         onDelete();
                       }
                     }}
                     className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl font-semibold text-red-600 transition-colors flex items-center justify-center gap-2"
                     aria-label="Delete task"
                   >
                     <span>🗑️</span>
                     Delete Task
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
                   {isPending ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
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
- Complete Together pattern modal
- All task fields included
- Auto-save to localStorage
- ESC key and backdrop click support
- Priority/status/category as button grids
- Project dropdown
- Recurrence selector
- Tags input
- Starred checkbox
- Delete button in edit mode
- Loading states

---

### Phase 7: Update TaskCardV2 Component

**File:** `src/todos/components/v2/TaskCardV2.tsx`

**Verify and enhance card styling to match design spec:**
- Border-left accent based on priority
- Completion checkbox (32x32px)
- Status badge
- Due date indicator
- Project badge
- Tags display
- Subtask count
- Recurring indicator
- Owner badge (merged mode)

---

### Phase 8: Create Remaining V2 Components

**Files to create:**
- `ProjectFormModalV2.tsx` - Project create/edit modal
- `SubtaskListV2.tsx` - Subtasks display/edit
- `ProjectBadgeV2.tsx` - Project badge component
- `StatusBadgeV2.tsx` - Status badge component
- `RecurrenceFormV2.tsx` - Recurrence settings modal

---

### Phase 9: Update Main Page with V2 Components

**File:** `src/pages/Todos.tsx`

**Changes:**
1. Apply centered layout
2. Replace header with TasksHeaderV2
3. Add ViewSelectorV2
4. Add FilterBarV2
5. Use TaskFormModalV2 for full editing
6. Remove sidebar or convert to overlay
7. Use useModalState for all modal state

---

### Phase 10: Update Layout.tsx to Exclude Duplicate Header

**File:** `src/components/Layout.tsx`

```typescript
// Add 'todos' to exclusion list
{!isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && activeView !== 'todos' && (
{isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && activeView !== 'todos' && (
```

---

## Testing Checklist

### Visual Comparison
- [ ] Open `tasks-design-spec.html` in browser
- [ ] Open Tasks tab in app
- [ ] Compare side-by-side (mobile + desktop)
- [ ] All spacing, colors, fonts match

### Page Layout
- [ ] Content centered (max 900px desktop)
- [ ] No duplicate "Tasks" header
- [ ] Proper padding

### Header
- [ ] Simple header (emoji + title + subtitle)
- [ ] No gradient text
- [ ] Matches Together tab

### View Selector
- [ ] Primary views (Today/Inbox/Upcoming) work
- [ ] Advanced views (List/Kanban/Matrix) work
- [ ] Active view highlighted

### Filters
- [ ] Search works
- [ ] Priority filter works
- [ ] Status filter works
- [ ] Project filter works
- [ ] Starred toggle works
- [ ] Owner filter (merged mode)

### Task Cards
- [ ] Completion checkbox works
- [ ] Border-left based on priority
- [ ] Status badge correct color
- [ ] Due date displays
- [ ] Project badge shows
- [ ] Tags display
- [ ] Subtask count
- [ ] Recurring indicator
- [ ] Owner badge (merged mode)
- [ ] Click opens full edit modal

### QuickAdd Modal
- [ ] Together pattern structure
- [ ] Auto-save draft
- [ ] ESC key closes
- [ ] Backdrop click closes
- [ ] Creates task correctly

### Full Edit Modal
- [ ] Together pattern structure
- [ ] All fields present
- [ ] Auto-save draft
- [ ] ESC/backdrop close
- [ ] Priority buttons work
- [ ] Status buttons work
- [ ] Category buttons work
- [ ] Project dropdown works
- [ ] Recurrence selector works
- [ ] Tags input works
- [ ] Starred checkbox works
- [ ] Delete button (edit mode)
- [ ] Updates task correctly

### Functionality
- [ ] Create task works
- [ ] Update task works
- [ ] Delete task works
- [ ] Complete task works
- [ ] Recurring tasks work
- [ ] Subtasks work
- [ ] Dependencies work (if implemented)
- [ ] Projects work

### Merged Mode
- [ ] Owner filter appears
- [ ] Partner name correct
- [ ] Filter by ownership works

### Responsive
- [ ] Mobile layout correct
- [ ] Desktop layout correct
- [ ] Modals responsive

### Accessibility
- [ ] Tab navigation works
- [ ] Aria-labels present
- [ ] Focus visible

---

## Common Pitfalls (Lessons from Notes/Goals)

| Issue | Solution | Prevention |
|-------|----------|------------|
| Duplicate headers | Exclude 'todos' from Layout.tsx | Check Layout.tsx first |
| Modal not updating | useEffect for initialData | Always update form on initialData change |
| Gradient text inconsistent | Use simple header | Follow Together pattern |
| Subtasks not loading | Check parent_id field | Verify database schema |
| Recurring not working | Check recurrence_pattern field | Test all recurrence types |
| Auto-save conflicts | Only when !isEditing | Add isEditing check |

---

## Tasks-Specific Challenges

### Challenge 1: Multiple Views (6 Different Views)
**Solution:**
- ViewSelectorV2 component
- Primary views (Today/Inbox/Upcoming) use SegmentedControlV2
- Advanced views (List/Kanban/Matrix) as pill buttons
- Each view has different filtering logic

### Challenge 2: Subtasks (Nested Tasks)
**Solution:**
- Subtasks are tasks with parent_id set
- Display as nested list under parent
- Can expand/collapse
- SubtaskListV2 component

### Challenge 3: Recurring Tasks
**Solution:**
- Recurrence pattern field (none/daily/weekly/monthly/yearly)
- Show recurring indicator (🔁) on card
- RecurrenceFormV2 for advanced settings
- Future: auto-create next occurrence

### Challenge 4: Task Dependencies
**Solution:**
- depends_on field (array of task IDs)
- Show dependency indicator
- DependenciesFormV2 for managing
- Visual indicator if blocked

### Challenge 5: Projects (Tasks belong to projects)
**Solution:**
- Project dropdown in modal
- Project badge on card
- Filter by project
- ProjectFormModalV2 for project management

---

## File Modification Summary

**Files to Create:** 10
- ✏️ `src/todos/components/v2/ViewSelectorV2.tsx`
- ✏️ `src/todos/components/v2/FilterBarV2.tsx`
- ✏️ `src/todos/components/v2/TaskFormModalV2.tsx`
- ✏️ `src/todos/components/v2/ProjectFormModalV2.tsx`
- ✏️ `src/todos/components/v2/SubtaskListV2.tsx`
- ✏️ `src/todos/components/v2/ProjectBadgeV2.tsx`
- ✏️ `src/todos/components/v2/StatusBadgeV2.tsx`
- ✏️ `src/todos/components/v2/RecurrenceFormV2.tsx`
- ✏️ `src/todos/components/v2/DependenciesFormV2.tsx`
- ✏️ `src/todos/components/v2/index.ts`

**Files to Update:** 5
- ✏️ `src/pages/Todos.tsx` - Integrate V2 components
- ✏️ `src/todos/components/v2/TasksHeaderV2.tsx` - Simplify (remove gradient)
- ✏️ `src/todos/components/v2/QuickAddModalV2.tsx` - Upgrade to Together pattern
- ✏️ `src/todos/components/v2/TaskCardV2.tsx` - Enhance styling
- ✏️ `src/components/Layout.tsx` - Exclude duplicate header

**Reference Files:** 4
- 📖 `tasks-design-spec.html`
- 📖 `src/pages/Together.tsx`
- 📖 `src/pages/Notes.tsx`
- 📖 `CLAUDE.md`

---

## Phase X: Code Quality & Cleanup (Post-Implementation) ⭐ **CRITICAL**

After completing the V2 implementation, perform these code quality improvements based on lessons learned from Notes and Journal modules.

### Step 1: Add Error Boundary (CRITICAL - Do First)

**Why:** Prevents crashes in one feature from taking down entire app

**File:** `src/pages/Todos.tsx`

**Changes:**
```typescript
// BEFORE
const TodosPage: React.FC = () => {
  return <TodosContent />;
};

export default TodosPage;

// AFTER
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';

const TodosContent: React.FC = () => {
  // All existing content
};

const TodosPage: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Tasks">
      <TodosContent />
    </FeatureErrorBoundary>
  );
};

export default TodosPage;
```

**Impact:** High - App stability improved, errors isolated to feature

---

### Step 2: Investigate and Remove Dead Code

**Why:** Reduces maintenance burden, improves clarity, smaller bundle

**Investigation Commands:**
```bash
# List all component files
find src/todos -name "*.tsx" -o -name "*.ts"

# Check if component is imported anywhere
grep -r "ComponentName" src --exclude-dir=todos

# Check if routed in App.tsx
grep "todos\|tasks" src/App.tsx

# Check exports
grep -r "from.*todos" src
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
rm -rf src/todos/components/layout/OldComponent.tsx
rm -rf src/todos/components/old/

# Update index.ts to remove deleted exports
# (Manual edit to remove references to deleted components)

# Stage deletions
git add -u src/todos/
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
grep -r "toLocaleDateString\|getTime\|setHours.*0.*0.*0" src/todos/components/
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
grep -r "framer-motion" src/todos/
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
grep -r "#[0-9A-Fa-f]\{6\}" src/todos/components/
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
npx eslint src/todos --fix
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

**File:** `src/todos/index.ts` or `src/todos/components/v2/index.ts`

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
export { TasksHeaderV2 } from './TasksHeaderV2';
export { TaskCardV2 } from './TaskCardV2';
export { TaskFormModalV2 } from './TaskFormModalV2';
export { QuickAddModalV2 } from './QuickAddModalV2';
export { ViewSelectorV2 } from './ViewSelectorV2';

// Legacy (actively used only)
export { DetailView } from '../DetailView'; // Still routed in App.tsx

// Hooks
export { useTasksQuery } from '../../hooks';
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
feat: Complete Tasks tab UI/UX enhancement with Together patterns

Updated Tasks feature to match tasks-design-spec.html and apply all 25 UI/UX
enhancement patterns from CLAUDE.md. Major improvements include:

UI Components:
- Updated TasksHeaderV2: Simple header matching Together tab (removed gradient)
- Created ViewSelectorV2: Primary + advanced view selector
- Created FilterBarV2: Pill-style filters (priority, status, project, search)
- Enhanced TaskCardV2: Priority border, badges, indicators
- Created TaskFormModalV2: Full edit modal with Together pattern
- Upgraded QuickAddModalV2: Together pattern with auto-save

Modals (Together Pattern):
- TaskFormModalV2: Complete task editing with all fields
- QuickAddModalV2: Quick add with auto-save, ESC key, backdrop
- ProjectFormModalV2: Project management
- RecurrenceFormV2: Recurring task settings
- Mobile drag handles, fixed headers/footers, scrollable content

Page Layout:
- Applied centered layout (900px max-width)
- Removed duplicate "Tasks" header from Layout.tsx
- Removed/converted sidebar

Features:
- 6 views: Today, Inbox, Upcoming, List, Kanban, Matrix
- Pill-style filter buttons (priority, status, project)
- Search functionality
- Subtasks display
- Recurring task indicators
- Task dependencies (if implemented)
- Owner badges in merged mode
- Success toasts for all operations

Technical:
- All V2 components in src/todos/components/v2/
- Maintained existing functionality (projects, subtasks, recurrence, dependencies)
- Responsive mobile/desktop behavior

Fixes:
- No duplicate headers
- Simple header (no gradient text)
- Modals update correctly
- Auto-save doesn't conflict with edit mode

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Success Criteria

✅ Tasks page matches `tasks-design-spec.html` exactly
✅ All 25 UI/UX patterns from CLAUDE.md applied
✅ Modal structure matches Together tab
✅ Auto-save functionality works
✅ Centered page layout (900px max-width)
✅ Simple header matching Together tab
✅ 6 views working correctly
✅ Pill-style filters
✅ Complete task editing modal
✅ QuickAdd modal upgraded
✅ Subtasks display
✅ Recurring tasks work
✅ Projects integration
✅ Dependencies (if implemented)
✅ Responsive mobile/desktop
✅ Accessible
✅ No console errors

---

## Estimated Complexity

**Complexity:** Very High (most complex feature: 6 views, subtasks, recurrence, dependencies, projects)
**Risk Level:** High (many moving parts, complex state management)
**Estimated Components:** 10 new V2 components + 5 file updates

---

## Next Steps After Tasks

Recommended order for remaining tabs:

1. **Shopping** - Lists with items, pantry tracking
2. **Meals** - Meal planning, recipes
3. **Travel** - Trip planning
4. **Finance** - Accounts, transactions, budgets
5. **Nutrition** - Food logging
6. **Self Care** - Activities
7. **Projects** - Project management
8. **Focus** - Focus sessions
9. **Calendar** - Calendar view
10. **Dashboard** - Overview
11. **Assistant** - AI assistant

Each will have a detailed plan created before implementation.
