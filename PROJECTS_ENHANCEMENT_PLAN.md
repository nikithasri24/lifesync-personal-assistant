# Projects Feature Enhancement Plan

## Overview

The Projects feature needs to be updated to match the design specifications in `projects-design-spec.html` and apply all 25 UI/UX enhancement patterns from CLAUDE.md (established by the Together tab reference implementation).

**Current State:**
- Main page exists at `src/pages/ProjectTracking.tsx`
- Components exist in `src/projects/components/`
- API layer complete with merged mode support in `src/api/projectsAPI.ts`
- Uses Zustand for state management (needs migration to React Query)
- Has terracotta theme but needs refinement
- Missing: Together modal pattern, auto-save, proper centered layout (currently max-w-7xl instead of 900px)

**Goal:**
- Match `projects-design-spec.html` styling exactly
- Apply all Together tab UI patterns
- Migrate from Zustand to React Query
- Ensure responsive mobile/desktop behavior
- Integrate existing FeatureErrorBoundary (already present)

**Why This Matters:**
- Projects is a complex feature with milestones and task linking
- Establishes pattern for features with multiple sub-resources
- Demonstrates proper state management migration
- Shows how to handle expandable card content

---

## Critical Files to Modify

### Primary Files (Must Update)
1. `src/pages/ProjectTracking.tsx` - Main page component (rename to Projects.tsx)
2. `src/projects/components/layout/ProjectsHeader.tsx` - Page header with stats
3. `src/projects/components/layout/ProjectsFiltersBar.tsx` - Search and filters
4. `src/projects/components/layout/ProjectCard.tsx` - Project cards
5. `src/projects/components/layout/EmptyProjectsState.tsx` - Empty state
6. `src/pages/components/ProjectModals.tsx` - Create/Edit modal (needs rewrite)
7. `src/pages/hooks/useProjectTracking.tsx` - Hook (replace with React Query)

### Files to Create
1. `src/projects/hooks/useProjectsQuery.ts` - React Query hooks
2. `src/projects/components/v2/ProjectFormModalV2.tsx` - New modal following Together pattern
3. `src/projects/components/v2/ProjectCardV2.tsx` - Refined card component
4. `src/projects/components/v2/ProjectsHeaderV2.tsx` - Refined header
5. `src/projects/components/v2/MilestoneFormModalV2.tsx` - Milestone creation modal

### Reference Files (Do NOT Modify)
- `src/pages/Together.tsx` - Reference implementation
- `src/together/components/modals/*.tsx` - Modal examples
- `projects-design-spec.html` - Design specification
- `CLAUDE.md` - UI/UX standards

---

## Database Schema Reference

Projects uses 3 tables (already exist):

```sql
-- Main projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '📋',
  color VARCHAR(20) DEFAULT '#D4A574',
  status VARCHAR(20) DEFAULT 'planning', -- planning, active, on-hold, completed, archived
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  start_date DATE,
  target_date DATE,
  completed_date DATE,
  tags TEXT[] DEFAULT '{}',
  progress INTEGER DEFAULT 0,
  team_members TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project milestones (sub-goals)
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_date DATE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link tasks to projects
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, task_id)
);
```

**RLS Policies:** Already configured for merged mode support

---

## Implementation Plan

### Phase 1: Create React Query Hooks

**File:** `src/projects/hooks/useProjectsQuery.ts`

**Objective:** Replace Zustand with React Query for server state management

**Changes:**
1. Create comprehensive query hooks:
   ```typescript
   // Query hooks
   export function useProjects(filters?: ProjectFilters) {
     return useQuery({
       queryKey: queryKeys.projects.list(filters),
       queryFn: () => getProjects(filters),
       staleTime: 1000 * 60 * 5, // 5 minutes
     });
   }

   export function useProject(id: string) {
     return useQuery({
       queryKey: queryKeys.projects.detail(id),
       queryFn: () => getProject(id),
       enabled: !!id,
     });
   }

   // Mutation hooks
   export function useCreateProject() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: createProject,
       onSuccess: () => {
         queryClient.invalidateQueries(queryKeys.projects.all);
       },
     });
   }

   export function useUpdateProject() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
         updateProject(id, updates),
       onSuccess: (_, variables) => {
         queryClient.invalidateQueries(queryKeys.projects.detail(variables.id));
         queryClient.invalidateQueries(queryKeys.projects.all);
       },
     });
   }

   export function useDeleteProject() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: deleteProject,
       onSuccess: () => {
         queryClient.invalidateQueries(queryKeys.projects.all);
       },
     });
   }

   // Milestone hooks
   export function useProjectMilestones(projectId: string) {
     return useQuery({
       queryKey: queryKeys.projects.milestones(projectId),
       queryFn: () => getProjectMilestones(projectId),
       enabled: !!projectId,
     });
   }

   export function useCreateMilestone() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: createMilestone,
       onSuccess: (_, variables) => {
         queryClient.invalidateQueries(queryKeys.projects.milestones(variables.project_id));
         queryClient.invalidateQueries(queryKeys.projects.detail(variables.project_id));
       },
     });
   }

   // Task linking hooks
   export function useProjectTasks(projectId: string) {
     return useQuery({
       queryKey: queryKeys.projects.tasks(projectId),
       queryFn: () => getProjectTasks(projectId),
       enabled: !!projectId,
     });
   }

   export function useLinkTaskToProject() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) =>
         linkTaskToProject(projectId, taskId),
       onSuccess: (_, variables) => {
         queryClient.invalidateQueries(queryKeys.projects.tasks(variables.projectId));
         queryClient.invalidateQueries(queryKeys.projects.detail(variables.projectId));
       },
     });
   }

   // Merged connection hook
   export function useProjectsMergedConnection() {
     return useQuery({
       queryKey: queryKeys.projects.mergedConnection,
       queryFn: getProjectsMergedConnection,
       staleTime: 1000 * 60 * 10, // 10 minutes
     });
   }
   ```

2. Define query keys:
   ```typescript
   export const queryKeys = {
     projects: {
       all: ['projects'] as const,
       lists: () => [...queryKeys.projects.all, 'list'] as const,
       list: (filters?: ProjectFilters) => [...queryKeys.projects.lists(), filters] as const,
       details: () => [...queryKeys.projects.all, 'detail'] as const,
       detail: (id: string) => [...queryKeys.projects.details(), id] as const,
       milestones: (projectId: string) => [...queryKeys.projects.all, 'milestones', projectId] as const,
       tasks: (projectId: string) => [...queryKeys.projects.all, 'tasks', projectId] as const,
       mergedConnection: ['projects', 'mergedConnection'] as const,
     },
   };
   ```

**Expected Outcome:**
- Modern React Query hooks ready to use
- Proper cache invalidation on mutations
- Optimistic updates for better UX
- TypeScript type safety throughout

---

### Phase 2: Update Main Page - Centered Layout

**File:** Rename `src/pages/ProjectTracking.tsx` to `src/pages/Projects.tsx`

**Changes:**
1. Update container to match Together pattern:
   ```typescript
   <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
     <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
       {/* All content */}
     </div>
   </div>
   ```

2. Replace Zustand hook with React Query:
   ```typescript
   const { data: projects = [], isLoading } = useProjects(filters);
   const { data: mergedConnection } = useProjectsMergedConnection();
   const createProject = useCreateProject();
   const updateProject = useUpdateProject();
   const deleteProject = useDeleteProject();
   ```

3. Use `useModalState` for modal management:
   ```typescript
   const modals = useModalState({
     createProject: false,
     editingProjectId: null as string | null,
     deleteConfirmId: null as string | null,
     expandedProjectId: null as string | null,
   });
   ```

4. Update App.tsx route:
   ```typescript
   <Route path="/projects" element={<RouteErrorBoundary feature="Projects"><Projects /></RouteErrorBoundary>} />
   ```

**Expected Outcome:**
- Content centered on desktop (max 900px)
- Full width on mobile (minus padding)
- React Query state management
- Clean modal state with useModalState

---

### Phase 3: Update ProjectsHeaderV2 Component

**File:** Create `src/projects/components/v2/ProjectsHeaderV2.tsx`

**Changes:**
1. Match design spec header styling:
   ```typescript
   <div
     className="rounded-2xl mb-4"
     style={{
       background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
       padding: '20px',
       color: 'white',
     }}
   >
     <h1 className="text-3xl font-bold flex items-center gap-3 mb-4">
       <span className="text-4xl">📋</span>
       Projects
     </h1>

     {/* Stats Grid */}
     <div className="grid grid-cols-3 gap-3 mt-4">
       <div
         className="rounded-xl p-3 text-center"
         style={{
           background: 'rgba(255, 255, 255, 0.2)',
           backdropFilter: 'blur(10px)',
         }}
       >
         <div className="text-2xl font-bold mb-1">{stats.totalProjects}</div>
         <div className="text-xs opacity-90">Total</div>
       </div>
       <div
         className="rounded-xl p-3 text-center"
         style={{
           background: 'rgba(255, 255, 255, 0.2)',
           backdropFilter: 'blur(10px)',
         }}
       >
         <div className="text-2xl font-bold mb-1">{stats.activeProjects}</div>
         <div className="text-xs opacity-90">Active</div>
       </div>
       <div
         className="rounded-xl p-3 text-center"
         style={{
           background: 'rgba(255, 255, 255, 0.2)',
           backdropFilter: 'blur(10px)',
         }}
       >
         <div className="text-2xl font-bold mb-1">{stats.totalTasks}</div>
         <div className="text-xs opacity-90">Tasks</div>
       </div>
     </div>
   </div>
   ```

**Expected Outcome:**
- Terracotta gradient header with rounded corners
- Stats cards with glassmorphism effect
- Emoji + title
- Matches design spec exactly

---

### Phase 4: Update ProjectsFiltersBar Component

**File:** Update `src/projects/components/layout/ProjectsFiltersBar.tsx`

**Changes:**
1. Match design spec filters styling:
   ```typescript
   <div className="bg-white rounded-2xl p-4 mb-4 space-y-3 shadow-sm">
     {/* Search Box */}
     <div className="relative">
       <Search
         className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
         size={18}
       />
       <input
         type="text"
         value={searchQuery}
         onChange={(e) => onSearchChange(e.target.value)}
         placeholder="Search projects..."
         className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
       />
     </div>

     {/* Filters Row */}
     <div className="flex items-center gap-2">
       {/* Status Filter Pills */}
       <div className="flex-1 flex gap-1 p-1 bg-gray-100 rounded-lg">
         <button
           onClick={() => onStatusFilterChange('all')}
           className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
             statusFilter === 'all'
               ? 'bg-white text-terracotta-600 shadow-sm'
               : 'text-gray-600'
           }`}
         >
           All
         </button>
         <button
           onClick={() => onStatusFilterChange('active')}
           className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
             statusFilter === 'active'
               ? 'bg-white text-terracotta-600 shadow-sm'
               : 'text-gray-600'
           }`}
         >
           Active
         </button>
         <button
           onClick={() => onStatusFilterChange('completed')}
           className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
             statusFilter === 'completed'
               ? 'bg-white text-terracotta-600 shadow-sm'
               : 'text-gray-600'
           }`}
         >
           Done
         </button>
       </div>

       {/* View Toggle */}
       <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
         <button
           onClick={() => onViewModeChange('grid')}
           className={`p-2 rounded-md transition-all ${
             viewMode === 'grid'
               ? 'bg-white text-terracotta-600 shadow-sm'
               : 'text-gray-600'
           }`}
           aria-label="Grid view"
         >
           <LayoutGrid size={18} />
         </button>
         <button
           onClick={() => onViewModeChange('list')}
           className={`p-2 rounded-md transition-all ${
             viewMode === 'list'
               ? 'bg-white text-terracotta-600 shadow-sm'
               : 'text-gray-600'
           }`}
           aria-label="List view"
         >
           <List size={18} />
         </button>
       </div>
     </div>

     {/* Owner Filter (Merged Mode Only) */}
     {showOwnerFilter && (
       <div className="flex gap-2">
         <button
           onClick={() => onOwnerFilterChange('all')}
           className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
             ownerFilter === 'all'
               ? 'bg-terracotta-100 text-terracotta-600 border-2 border-terracotta-400'
               : 'bg-gray-100 text-gray-700 border-2 border-transparent'
           }`}
         >
           All Projects
         </button>
         <button
           onClick={() => onOwnerFilterChange('mine')}
           className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
             ownerFilter === 'mine'
               ? 'bg-terracotta-100 text-terracotta-600 border-2 border-terracotta-400'
               : 'bg-gray-100 text-gray-700 border-2 border-transparent'
           }`}
         >
           My Projects
         </button>
         <button
           onClick={() => onOwnerFilterChange('partner')}
           className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
             ownerFilter === 'partner'
               ? 'bg-terracotta-100 text-terracotta-600 border-2 border-terracotta-400'
               : 'bg-gray-100 text-gray-700 border-2 border-transparent'
           }`}
         >
           {partnerName}'s Projects
         </button>
       </div>
     )}
   </div>
   ```

**Expected Outcome:**
- Search box with icon
- Status filter pills with proper styling
- View toggle (grid/list) with icons
- Owner filter pills (merged mode only)
- Matches design spec exactly

---

### Phase 5: Update ProjectCardV2 Component

**File:** Create `src/projects/components/v2/ProjectCardV2.tsx`

**Changes:**
1. Match card styling from design spec:
   ```typescript
   <div
     className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow"
     style={{
       borderColor: colors.border.light,
     }}
   >
     {/* Project Header */}
     <div className="flex items-start gap-3 mb-3">
       <div className="text-3xl">{project.icon || '📋'}</div>
       <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 flex-wrap mb-1">
           <h3 className="text-base font-semibold" style={{ color: colors.text.primary }}>
             {project.name}
           </h3>
           {/* Status Badge */}
           <span
             className="px-2 py-0.5 rounded-xl text-xs font-semibold uppercase"
             style={{
               backgroundColor: getStatusColor(project.status).bg,
               color: getStatusColor(project.status).text,
             }}
           >
             {getStatusLabel(project.status)}
           </span>
           {/* Owner Badge (Merged Mode) */}
           {showOwnerBadge && (
             <OwnerBadge
               userId={project.user_id}
               currentUserId={currentUserId}
               partnerName={partnerName}
             />
           )}
           {/* Priority Badge */}
           {project.priority && project.priority !== 'medium' && (
             <span
               className="px-2 py-0.5 rounded-xl text-xs font-semibold uppercase"
               style={{
                 backgroundColor: getPriorityColor(project.priority).bg,
                 color: getPriorityColor(project.priority).text,
               }}
             >
               {project.priority}
             </span>
           )}
         </div>
         {project.description && (
           <p className="text-sm line-clamp-2" style={{ color: colors.text.secondary }}>
             {project.description}
           </p>
         )}
       </div>
     </div>

     {/* Progress Section */}
     <div
       className="space-y-3 pt-3"
       style={{ borderTop: `1px solid ${colors.border.light}` }}
     >
       <div className="flex items-center justify-between text-sm">
         <span style={{ color: colors.text.secondary }}>Progress</span>
         <span className="font-semibold" style={{ color: colors.text.primary }}>
           {metrics.completedTasks} / {metrics.totalTasks} tasks
         </span>
       </div>

       {/* Progress Bar */}
       <div
         className="h-1.5 rounded-full overflow-hidden"
         style={{ backgroundColor: colors.bg.secondary }}
       >
         <div
           className="h-full rounded-full transition-all duration-500"
           style={{
             width: `${metrics.progress}%`,
             background: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
           }}
         />
       </div>

       {/* Tasks Toggle */}
       {metrics.totalTasks > 0 && (
         <button
           onClick={onToggleExpand}
           className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors"
           style={{
             backgroundColor: colors.bg.secondary,
             color: colors.text.primary,
             border: `1px solid ${colors.border.light}`,
           }}
           aria-label={isExpanded ? 'Hide tasks' : 'Show tasks'}
         >
           <span>View Tasks ({metrics.totalTasks})</span>
           {isExpanded ? (
             <ChevronUp size={16} />
           ) : (
             <ChevronDown size={16} />
           )}
         </button>
       )}

       {/* Expanded Tasks List */}
       {isExpanded && metrics.tasks.length > 0 && (
         <div
           className="space-y-2 p-3 rounded-lg"
           style={{
             backgroundColor: colors.bg.secondary,
             border: `1px solid ${colors.border.light}`,
           }}
         >
           {metrics.tasks.map((task) => (
             <div key={task.id} className="flex items-start gap-2 text-sm">
               <div
                 className="w-4 h-4 flex-shrink-0 mt-0.5 rounded border-2 flex items-center justify-center"
                 style={{
                   borderColor: task.status === 'done' ? '#10B981' : colors.border.medium,
                   backgroundColor: task.status === 'done' ? '#10B981' : 'transparent',
                 }}
               >
                 {task.status === 'done' && (
                   <Check size={12} className="text-white" />
                 )}
               </div>
               <span
                 className={task.status === 'done' ? 'line-through' : ''}
                 style={{
                   color: task.status === 'done' ? colors.text.tertiary : colors.text.primary,
                 }}
               >
                 {task.title}
               </span>
             </div>
           ))}
         </div>
       )}
     </div>
   </div>
   ```

2. Helper functions for badges:
   ```typescript
   const getStatusColor = (status: Project['status']) => {
     switch (status) {
       case 'active':
         return { bg: '#D1FAE5', text: '#059669' };
       case 'completed':
         return { bg: '#DBEAFE', text: '#1D4ED8' };
       case 'on-hold':
         return { bg: '#FEF3C7', text: '#D97706' };
       case 'planning':
         return { bg: '#E0E7FF', text: '#6366F1' };
       case 'archived':
         return { bg: '#F3F4F6', text: '#6B7280' };
       default:
         return { bg: '#F3F4F6', text: '#6B7280' };
     }
   };

   const getStatusLabel = (status: Project['status']) => {
     return status === 'on-hold' ? 'On Hold' : status === 'completed' ? 'Done' : status.charAt(0).toUpperCase() + status.slice(1);
   };

   const getPriorityColor = (priority: Project['priority']) => {
     switch (priority) {
       case 'urgent':
         return { bg: '#FEE2E2', text: '#DC2626' };
       case 'high':
         return { bg: '#FEF3C7', text: '#D97706' };
       case 'medium':
         return { bg: '#DBEAFE', text: '#1D4ED8' };
       case 'low':
         return { bg: '#F3F4F6', text: '#6B7280' };
       default:
         return { bg: '#F3F4F6', text: '#6B7280' };
     }
   };
   ```

**Expected Outcome:**
- Cards match design spec pixel-perfectly
- Status, owner, and priority badges with correct colors
- Progress bar with terracotta gradient
- Expandable tasks list
- Smooth animations and transitions

---

### Phase 6: Create ProjectFormModalV2 Component

**File:** Create `src/projects/components/v2/ProjectFormModalV2.tsx`

**Objective:** Complete modal rewrite to match Together pattern

**Changes:**

1. **Modal Container** - Match Together pattern:
   ```typescript
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

2. **Modal Content**:
   ```typescript
   <div
     className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
     style={{ maxHeight: '90vh', maxWidth: '600px' }}
     onClick={(e) => e.stopPropagation()}
   >
   ```

3. **Drag Handle** (mobile only):
   ```typescript
   <div className="lg:hidden pt-2 flex-shrink-0">
     <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
   </div>
   ```

4. **Fixed Header**:
   ```typescript
   <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
     <h2 className="text-2xl font-bold text-gray-900">
       {isEditing ? 'Edit Project' : 'Create Project'}
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
   ```

5. **Scrollable Form Content**:
   ```typescript
   <div
     className="overflow-y-auto p-6 space-y-5 flex-1"
     style={{ maxHeight: 'calc(90vh - 140px)' }}
   >
     {/* Project Name */}
     <div>
       <label className="block text-sm font-semibold text-gray-700 mb-2">
         Project Name *
       </label>
       <input
         type="text"
         value={formData.name}
         onChange={(e) => setFormData({ ...formData, name: e.target.value })}
         placeholder="Enter project name"
         className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
         required
       />
     </div>

     {/* Description */}
     <div>
       <label className="block text-sm font-semibold text-gray-700 mb-2">
         Description
       </label>
       <textarea
         rows={3}
         value={formData.description}
         onChange={(e) => setFormData({ ...formData, description: e.target.value })}
         placeholder="Describe your project..."
         className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
       />
     </div>

     {/* Icon Picker */}
     <div>
       <label className="block text-sm font-semibold text-gray-700 mb-2">
         Icon
       </label>
       <div className="grid grid-cols-6 gap-2">
         {ICON_OPTIONS.map((icon) => (
           <button
             key={icon}
             type="button"
             onClick={() => setFormData({ ...formData, icon })}
             className={`w-11 h-11 flex items-center justify-center rounded-lg text-xl border-2 transition-all ${
               formData.icon === icon
                 ? 'border-terracotta-400 bg-terracotta-50'
                 : 'border-gray-200 bg-white hover:border-gray-300'
             }`}
           >
             {icon}
           </button>
         ))}
       </div>
     </div>

     {/* Color Theme Picker */}
     <div>
       <label className="block text-sm font-semibold text-gray-700 mb-2">
         Color Theme
       </label>
       <div className="grid grid-cols-6 gap-2">
         {COLOR_OPTIONS.map((color) => (
           <button
             key={color}
             type="button"
             onClick={() => setFormData({ ...formData, color })}
             className={`w-11 h-11 rounded-lg border-3 transition-all ${
               formData.color === color ? 'border-gray-900' : 'border-transparent'
             }`}
             style={{ backgroundColor: color }}
             aria-label={`Select ${color} color`}
           />
         ))}
       </div>
     </div>

     {/* Status */}
     <div>
       <label className="block text-sm font-semibold text-gray-700 mb-2">
         Status
       </label>
       <select
         value={formData.status}
         onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
         className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
       >
         <option value="planning">Planning</option>
         <option value="active">Active</option>
         <option value="on-hold">On Hold</option>
         <option value="completed">Completed</option>
         <option value="archived">Archived</option>
       </select>
     </div>

     {/* Priority */}
     <div>
       <label className="block text-sm font-semibold text-gray-700 mb-2">
         Priority
       </label>
       <select
         value={formData.priority}
         onChange={(e) => setFormData({ ...formData, priority: e.target.value as Project['priority'] })}
         className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
       >
         <option value="low">Low</option>
         <option value="medium">Medium</option>
         <option value="high">High</option>
         <option value="urgent">Urgent</option>
       </select>
     </div>

     {/* Timeline */}
     <div>
       <label className="block text-sm font-semibold text-gray-700 mb-2">
         Timeline
       </label>
       <div className="grid grid-cols-2 gap-3">
         <div>
           <label className="block text-xs font-medium text-gray-500 mb-1">
             Start Date
           </label>
           <input
             type="date"
             value={formData.start_date || ''}
             onChange={(e) => setFormData({ ...formData, start_date: e.target.value || null })}
             className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
           />
         </div>
         <div>
           <label className="block text-xs font-medium text-gray-500 mb-1">
             Target Date
           </label>
           <input
             type="date"
             value={formData.target_date || ''}
             onChange={(e) => setFormData({ ...formData, target_date: e.target.value || null })}
             className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
           />
         </div>
       </div>
     </div>

     {/* Tags Input */}
     <div>
       <label className="block text-sm font-semibold text-gray-700 mb-2">
         Tags
       </label>
       <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-xl min-h-[44px]">
         {formData.tags.map((tag, index) => (
           <span
             key={index}
             className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium"
           >
             {tag}
             <button
               type="button"
               onClick={() => {
                 const newTags = formData.tags.filter((_, i) => i !== index);
                 setFormData({ ...formData, tags: newTags });
               }}
               className="hover:text-indigo-900"
               aria-label={`Remove ${tag} tag`}
             >
               ×
             </button>
           </span>
         ))}
         <input
           type="text"
           value={tagInput}
           onChange={(e) => setTagInput(e.target.value)}
           onKeyDown={(e) => {
             if (e.key === 'Enter' || e.key === ',') {
               e.preventDefault();
               if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                 setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
                 setTagInput('');
               }
             }
           }}
           placeholder="Add tag..."
           className="flex-1 min-w-[80px] outline-none text-sm"
         />
       </div>
       <p className="text-xs text-gray-500 mt-1">
         Press Enter or comma to add tags
       </p>
     </div>
   </div>
   ```

6. **Fixed Footer**:
   ```typescript
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
       onClick={handleSubmit}
       disabled={isPending || !formData.name.trim()}
       className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
       style={{
         background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
       }}
     >
       {isPending ? 'Saving...' : (isEditing ? 'Update Project' : 'Create Project')}
     </button>
   </div>
   ```

7. **Auto-save Functionality**:
   ```typescript
   const STORAGE_KEY = 'projects_modal_draft';

   const loadDraft = () => {
     try {
       const saved = localStorage.getItem(STORAGE_KEY);
       if (saved) return JSON.parse(saved);
     } catch (error) {
       logger.error('Projects', error as Error, { context: 'Failed to load draft' });
     }
     return null;
   };

   const savedDraft = !initialData ? loadDraft() : null;

   const [formData, setFormData] = useState<ProjectFormData>(
     initialData || savedDraft || DEFAULT_FORM_DATA
   );

   useEffect(() => {
     if (!initialData && formData.name) {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
     }
   }, [formData, initialData]);

   const handleSubmit = async () => {
     // ... validation and submit logic
     localStorage.removeItem(STORAGE_KEY);
     onClose();
   };
   ```

8. **ESC key and backdrop support**:
   ```typescript
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

   const handleBackdropClick = (e: React.MouseEvent) => {
     if (e.target === e.currentTarget) {
       onClose();
     }
   };
   ```

9. **Constants**:
   ```typescript
   const ICON_OPTIONS = ['🏡', '💼', '✈️', '📚', '🎓', '💪', '🎯', '🎨', '📱', '🌱', '🎵', '🍳'];

   const COLOR_OPTIONS = [
     '#D4A574', // Terracotta (default)
     '#3B82F6', // Blue
     '#10B981', // Green
     '#F59E0B', // Amber
     '#EF4444', // Red
     '#8B5CF6', // Purple
     '#EC4899', // Pink
     '#14B8A6', // Teal
     '#F97316', // Orange
     '#6366F1', // Indigo
     '#84CC16', // Lime
     '#64748B', // Slate
   ];

   const DEFAULT_FORM_DATA: ProjectFormData = {
     name: '',
     description: '',
     icon: '📋',
     color: '#D4A574',
     status: 'planning',
     priority: 'medium',
     start_date: null,
     target_date: null,
     tags: [],
   };
   ```

**Expected Outcome:**
- Modal matches Together pattern exactly
- Auto-saves drafts to localStorage
- Icon picker (12 options)
- Color theme picker (12 colors)
- Timeline date inputs
- Tags input with chips
- ESC key and backdrop click support
- All inputs styled correctly
- Loading states for buttons

---

### Phase 7: Update Empty State Component

**File:** Update `src/projects/components/layout/EmptyProjectsState.tsx`

**Changes:**
1. Match design spec empty state:
   ```typescript
   <div className="text-center py-20 px-10">
     <div className="text-6xl mb-4 opacity-50">📋</div>
     <h3 className="text-lg font-bold mb-2" style={{ color: colors.text.primary }}>
       {searchQuery || statusFilter !== 'all' ? 'No Projects Found' : 'No Projects Yet'}
     </h3>
     <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
       {searchQuery || statusFilter !== 'all'
         ? 'Try adjusting your search or filters'
         : 'Create your first project to organize and track your tasks'}
     </p>
     {(!searchQuery && statusFilter === 'all') && (
       <button
         onClick={onCreateClick}
         className="px-6 py-3 rounded-xl font-semibold text-white"
         style={{
           background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
         }}
       >
         + Create Project
       </button>
     )}
   </div>
   ```

**Expected Outcome:**
- Empty state matches design spec
- Different messages for no data vs. no results
- CTA button for creating first project

---

### Phase 8: Update FAB (Floating Action Button)

**File:** Update in `src/pages/Projects.tsx`

**Changes:**
1. Use FABV2 component (already in use):
   ```typescript
   <FABV2
     icon={Plus}
     onClick={() => modals.open('createProject')}
     label="New Project"
     position="bottom-right"
     size="md"
   />
   ```

**Expected Outcome:**
- FAB positioned correctly (bottom-right)
- Terracotta gradient background
- Accessible with aria-label

---

### Phase 9: Create MilestoneFormModalV2 Component (Optional Enhancement)

**File:** Create `src/projects/components/v2/MilestoneFormModalV2.tsx`

**Objective:** Allow users to create/edit milestones for projects

**Changes:**
1. Follow same modal pattern as ProjectFormModalV2
2. Fields:
   - Milestone title (required)
   - Description (optional)
   - Target date (optional)
   - Completed checkbox

3. Validation:
   ```typescript
   const handleSubmit = async () => {
     if (!formData.title.trim()) {
       showToast('Please enter a milestone title', 'error');
       return;
     }

     try {
       if (isEditing) {
         await updateMilestone.mutateAsync({
           id: initialData!.id,
           updates: formData,
         });
         showToast('Milestone updated! ✏️', 'success');
       } else {
         await createMilestone.mutateAsync({
           project_id: projectId,
           ...formData,
         });
         showToast('Milestone created! 🎯', 'success');
       }
       onClose();
     } catch (error) {
       logger.error('Projects', error as Error, { context: 'Failed to save milestone' });
       showToast('Failed to save milestone', 'error');
     }
   };
   ```

**Expected Outcome:**
- Users can manage project milestones
- Follows Together modal pattern
- Auto-save support
- Toast notifications

---

### Phase 10: Filtering and Search Logic

**File:** Update in `src/pages/Projects.tsx`

**Changes:**
1. Implement client-side filtering:
   ```typescript
   const [searchQuery, setSearchQuery] = useState('');
   const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
   const [ownerFilter, setOwnerFilter] = useState<'all' | 'mine' | 'partner'>('all');

   const filteredProjects = useMemo(() => {
     let filtered = projects || [];

     // Search filter
     if (searchQuery.trim()) {
       const query = searchQuery.toLowerCase();
       filtered = filtered.filter(
         (p) =>
           p.name.toLowerCase().includes(query) ||
           p.description?.toLowerCase().includes(query) ||
           p.tags?.some((tag) => tag.toLowerCase().includes(query))
       );
     }

     // Status filter
     if (statusFilter !== 'all') {
       filtered = filtered.filter((p) => p.status === statusFilter);
     }

     // Owner filter (merged mode only)
     if (mergedConnection && ownerFilter !== 'all') {
       if (ownerFilter === 'mine') {
         filtered = filtered.filter((p) => p.user_id === currentUserId);
       } else if (ownerFilter === 'partner') {
         filtered = filtered.filter((p) => p.user_id === mergedConnection.partnerId);
       }
     }

     return filtered;
   }, [projects, searchQuery, statusFilter, ownerFilter, mergedConnection, currentUserId]);
   ```

2. Calculate stats:
   ```typescript
   const stats = useMemo(() => {
     const allProjects = projects || [];
     return {
       totalProjects: allProjects.length,
       activeProjects: allProjects.filter((p) => p.status === 'active').length,
       completedProjects: allProjects.filter((p) => p.status === 'completed').length,
       totalTasks: allProjects.reduce((sum, p) => sum + (p.total_tasks || 0), 0),
     };
   }, [projects]);
   ```

**Expected Outcome:**
- Real-time search filtering
- Status filtering
- Owner filtering (merged mode)
- Accurate stats calculation

---

### Phase 11: Calculate Project Metrics (Task Progress)

**File:** Update in `src/pages/Projects.tsx`

**Changes:**
1. Fetch linked tasks for each project:
   ```typescript
   const { data: allTasks = [] } = useTasks(); // Fetch all user's tasks

   const projectMetrics = useMemo(() => {
     return filteredProjects.map((project) => {
       // Filter tasks that are linked to this project
       const projectTasks = allTasks.filter((task) =>
         task.project_id === project.id || task.project_ids?.includes(project.id)
       );

       const completedTasks = projectTasks.filter((t) => t.status === 'done').length;
       const totalTasks = projectTasks.length;
       const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

       return {
         projectId: project.id,
         tasks: projectTasks,
         totalTasks,
         completedTasks,
         progress,
       };
     });
   }, [filteredProjects, allTasks]);
   ```

**Expected Outcome:**
- Real-time task progress for each project
- Progress bars update automatically
- Expandable task lists show correct tasks

---

### Phase 12: Code Quality Improvements & Cleanup

**Objective:** Apply standardized code quality improvements from MODULE_QUALITY_IMPROVEMENTS_CHECKLIST.md

**Changes:**

#### 12.1: Add Error Boundary
- ✅ Already exists in App.tsx:
  ```typescript
  <Route path="/projects" element={<RouteErrorBoundary feature="Projects"><Projects /></RouteErrorBoundary>} />
  ```
- ✅ No action needed - error boundary already implemented

#### 12.2: Remove Dead Code
**Files to check:**
- `src/stores/slices/projectsSlice.ts` - DELETE (replaced by React Query)
- `src/pages/hooks/useProjectTracking.tsx` - DELETE (replaced by React Query hooks)
- `src/pages/components/ProjectModals.tsx` - DELETE (replaced by V2 modals)
- Old components in `src/projects/components/` that are not V2

**Action:**
1. After confirming V2 components work, delete old Zustand slice
2. Delete old modal components
3. Clean up any unused imports

#### 12.3: Replace Duplicate Date Formatting
**Files to update:**
- `src/projects/components/v2/ProjectCardV2.tsx`
- `src/projects/components/v2/MilestoneFormModalV2.tsx`

**Action:**
1. Import shared utilities:
   ```typescript
   import { getRelativeTime, formatDateForDisplay } from '@/utils/dateUtils';
   ```

2. Replace inline date formatting:
   ```typescript
   // ❌ BEFORE
   const formattedDate = new Date(project.target_date).toLocaleDateString();

   // ✅ AFTER
   const formattedDate = formatDateForDisplay(project.target_date);
   ```

#### 12.4: Replace Framer Motion with CSS
**Files to check:**
- `src/projects/components/**/*.tsx`

**Action:**
1. Search for Framer Motion imports:
   ```bash
   grep -r "framer-motion" src/projects/
   ```

2. Replace animations with CSS transitions:
   ```typescript
   // ❌ BEFORE (Framer Motion)
   <motion.div
     initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: 1, y: 0 }}
     exit={{ opacity: 0, y: -20 }}
   >

   // ✅ AFTER (CSS)
   <div className="animate-fadeIn">
   ```

3. Add CSS animations if needed:
   ```css
   @keyframes fadeIn {
     from { opacity: 0; transform: translateY(20px); }
     to { opacity: 1; transform: translateY(0); }
   }
   .animate-fadeIn {
     animation: fadeIn 0.3s ease-out;
   }
   ```

#### 12.5: Use Theme Colors Consistently
**Files to update:**
- All V2 components

**Action:**
1. Ensure all components use `useThemeColors()`:
   ```typescript
   import { useThemeColors } from '@/hooks/useThemeColors';

   const colors = useThemeColors();
   ```

2. Replace hardcoded colors:
   ```typescript
   // ❌ BEFORE
   style={{ color: '#1F2937', backgroundColor: '#F9FAFB' }}

   // ✅ AFTER
   style={{ color: colors.text.primary, backgroundColor: colors.bg.secondary }}
   ```

#### 12.6: Use Shared Date Utilities
**Already covered in 12.3**

#### 12.7: Clean Up Unused Imports
**Action:**
1. Run ESLint fix:
   ```bash
   npm run lint -- --fix src/projects/
   ```

2. Manually verify each file:
   - Remove unused React imports (if using React 17+)
   - Remove unused icon imports from lucide-react
   - Remove unused type imports

#### 12.8: Clean Up Module Exports
**Files to update:**
- `src/projects/components/v2/index.ts` (create if doesn't exist)
- `src/projects/hooks/index.ts` (create if doesn't exist)

**Action:**
1. Create barrel exports:
   ```typescript
   // src/projects/components/v2/index.ts
   export { ProjectFormModalV2 } from './ProjectFormModalV2';
   export { ProjectCardV2 } from './ProjectCardV2';
   export { ProjectsHeaderV2 } from './ProjectsHeaderV2';
   export { MilestoneFormModalV2 } from './MilestoneFormModalV2';

   // src/projects/hooks/index.ts
   export * from './useProjectsQuery';
   ```

2. Update imports in main page:
   ```typescript
   // ❌ BEFORE
   import { ProjectFormModalV2 } from '@/projects/components/v2/ProjectFormModalV2';
   import { ProjectCardV2 } from '@/projects/components/v2/ProjectCardV2';

   // ✅ AFTER
   import { ProjectFormModalV2, ProjectCardV2 } from '@/projects/components/v2';
   ```

#### 12.9: Verification & Testing
**Action:**
1. **Visual Comparison:**
   - Open `projects-design-spec.html` in browser
   - Open Projects page in app
   - Compare side-by-side on mobile (375px width)
   - Compare on desktop (1200px width)
   - Verify all spacing, colors, fonts match exactly

2. **Functionality Testing:**
   - Create project → saves correctly ✓
   - Edit project → updates correctly ✓
   - Delete project → removes correctly ✓
   - Create milestone → saves correctly ✓
   - Link task to project → progress updates ✓
   - Toggle grid/list view → layout changes ✓
   - Filter by status → shows correct projects ✓
   - Filter by owner (merged mode) → filters correctly ✓
   - Search projects → filters in real-time ✓
   - Auto-save → draft persists on page reload ✓
   - ESC key → closes modal ✓
   - Backdrop click → closes modal ✓
   - Expand tasks → shows linked tasks ✓

3. **Responsive Testing:**
   - Mobile (375px) → proper layout ✓
   - Tablet (768px) → 2-column grid ✓
   - Desktop (1200px+) → centered with max 900px ✓
   - Modal behavior → bottom-aligned mobile, centered desktop ✓

4. **Accessibility Testing:**
   - Tab navigation works ✓
   - Screen reader friendly ✓
   - Aria-labels present on icon buttons ✓
   - Focus visible ✓
   - Form labels associated with inputs ✓

5. **Performance Testing:**
   - Large project list (50+ projects) → renders smoothly ✓
   - Filtering/searching → instant response ✓
   - No unnecessary re-renders ✓
   - React Query caching works ✓

6. **Cross-browser Testing:**
   - Chrome ✓
   - Safari ✓
   - Firefox ✓
   - Mobile browsers ✓

**Expected Outcome:**
- All code quality standards from CLAUDE.md applied
- No dead code or unused imports
- Consistent theme colors and date formatting
- Clean, maintainable codebase

---

## Verification Steps

After implementation, verify:

1. **Visual Comparison:**
   - Projects page matches `projects-design-spec.html` exactly
   - All spacing, colors, fonts match
   - Mobile and desktop responsive

2. **Functionality Testing:**
   - All CRUD operations work (create, edit, delete)
   - Milestones can be created/edited
   - Tasks can be linked to projects
   - Progress bars update correctly
   - Filters and search work
   - Merged mode shows both users' projects

3. **State Management:**
   - React Query handles all server state
   - No Zustand dependencies remaining
   - Optimistic updates work
   - Cache invalidation correct

4. **Modal Behavior:**
   - Matches Together modal pattern
   - Auto-save works
   - ESC key closes modal
   - Backdrop click closes modal

5. **Accessibility:**
   - All icon buttons have aria-labels
   - Keyboard navigation works
   - Screen reader friendly

---

## Success Criteria

✅ Projects page matches `projects-design-spec.html` exactly
✅ All 25 UI/UX patterns from CLAUDE.md applied
✅ Migrated from Zustand to React Query
✅ Modal structure matches Together tab
✅ Auto-save functionality works
✅ Centered page layout (900px max-width)
✅ Responsive on mobile and desktop
✅ All existing features work (merged mode, milestones, task linking)
✅ Accessible (keyboard, screen readers)
✅ Smooth animations and transitions
✅ No console errors or warnings
✅ Code quality improvements applied (9 steps)

---

## Files Summary

### Files to Create (5)
- `src/projects/hooks/useProjectsQuery.ts` - React Query hooks
- `src/projects/components/v2/ProjectFormModalV2.tsx` - Create/Edit modal
- `src/projects/components/v2/ProjectCardV2.tsx` - Refined card
- `src/projects/components/v2/ProjectsHeaderV2.tsx` - Refined header
- `src/projects/components/v2/MilestoneFormModalV2.tsx` - Milestone modal

### Files to Update (7)
- Rename `src/pages/ProjectTracking.tsx` → `src/pages/Projects.tsx`
- `src/projects/components/layout/ProjectsFiltersBar.tsx`
- `src/projects/components/layout/EmptyProjectsState.tsx`
- `src/App.tsx` - Update route
- `src/projects/components/v2/index.ts` - Barrel exports (create)
- `src/projects/hooks/index.ts` - Barrel exports (create)

### Files to Delete (3)
- `src/stores/slices/projectsSlice.ts` - Replaced by React Query
- `src/pages/hooks/useProjectTracking.tsx` - Replaced by React Query
- `src/pages/components/ProjectModals.tsx` - Replaced by V2 modals

### Reference Files (3)
- 📖 `projects-design-spec.html`
- 📖 `src/pages/Together.tsx`
- 📖 `CLAUDE.md`

---

## Commit Message Template

```
feat: Complete Projects feature UI/UX enhancement and state migration

Modernize Projects feature to match design spec and CLAUDE.md standards:
- Migrate from Zustand to React Query for state management
- Apply all 25 UI/UX patterns from Together tab reference
- Centered layout (900px max-width) for consistency
- Together modal pattern with auto-save
- Icon picker (12 options) and color theme picker (12 colors)
- Enhanced progress visualization with terracotta gradient
- Milestone management with dedicated modal
- Task linking with progress tracking
- Search and filter improvements
- Code quality improvements (removed dead code, consistent theming)

Features:
- Create/edit/delete projects with comprehensive form
- Create milestones for project sub-goals
- Link tasks to projects with progress tracking
- Grid/list view toggle
- Search by name, description, or tags
- Filter by status (all, active, completed, on-hold, planning)
- Owner filter in merged mode (mine, partner, all)
- Expandable task lists in cards
- Auto-save drafts to localStorage
- Responsive mobile/desktop layout
- Terracotta theme throughout

Technical:
- React Query hooks for server state
- useModalState for modal management
- FeatureErrorBoundary for crash isolation
- Shared date utilities (getRelativeTime, formatDateForDisplay)
- useThemeColors() for consistent theming
- CSS transitions (no Framer Motion)

Files: 5 created, 7 updated, 3 deleted

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Estimated Complexity

**Medium-High** - More complex than basic features due to:
- State migration from Zustand to React Query
- Multiple sub-resources (milestones, task linking)
- Complex filtering and search logic
- Task progress calculation
- Icon and color pickers
- But well-specified with clear design mockup

**Risk Level:** Low-Medium
- Existing API layer is complete and tested
- Design spec is detailed
- Together tab provides proven patterns
- Main risk: ensuring task linking/progress calculation works correctly

---

## Implementation Notes

### Key Challenges

1. **Task Linking Logic:**
   - Projects link to tasks via `project_tasks` join table
   - Need to query both projects and tasks
   - Calculate progress based on linked task completion
   - Solution: Use React Query with proper dependencies

2. **Milestones Management:**
   - Projects can have multiple milestones
   - Milestones have order_index for sorting
   - Can be marked complete independently
   - Solution: Dedicated modal for milestone CRUD

3. **Icon and Color Pickers:**
   - 12 icon options (emoji)
   - 12 color theme options
   - Visual grid selection
   - Solution: Grid of clickable buttons with active state

4. **Progress Calculation:**
   - Count linked tasks
   - Calculate completion percentage
   - Update in real-time
   - Solution: useMemo with task dependencies

5. **State Migration:**
   - Remove all Zustand dependencies
   - Replace with React Query
   - Maintain same functionality
   - Solution: Create comprehensive hook file first

### Best Practices Applied

- **Single Responsibility:** Each component has one clear purpose
- **DRY Principle:** Shared utilities for date formatting, theme colors
- **Type Safety:** TypeScript throughout with proper types
- **Accessibility:** ARIA labels, keyboard navigation, screen reader support
- **Performance:** React Query caching, optimistic updates, useMemo for derived state
- **User Experience:** Auto-save, loading states, error handling, toast notifications
- **Code Quality:** Consistent styling, no dead code, clean imports
- **Testing:** Comprehensive verification checklist
- **Documentation:** Clear comments, JSDoc for complex functions

### Next Steps After Implementation

1. **Test with Real Data:**
   - Create multiple projects
   - Add milestones
   - Link tasks
   - Test progress tracking

2. **Monitor Performance:**
   - Check React Query cache behavior
   - Ensure no unnecessary refetches
   - Verify optimistic updates

3. **Gather Feedback:**
   - Test with users
   - Identify pain points
   - Iterate on UX

4. **Future Enhancements:**
   - Kanban board view for projects
   - Gantt chart for timeline visualization
   - Project templates
   - Collaboration features (comments, activity log)
   - File attachments
   - Project duplication

---

## Conclusion

This plan provides a comprehensive roadmap for modernizing the Projects feature to match the design specification and apply all UI/UX enhancement patterns from CLAUDE.md. The implementation prioritizes:

1. **User Experience:** Clean, intuitive interface matching design spec
2. **State Management:** Modern React Query replacing Zustand
3. **Code Quality:** Following all established patterns and best practices
4. **Accessibility:** Ensuring feature is usable by everyone
5. **Performance:** Optimized rendering and caching
6. **Maintainability:** Clean, well-organized, documented code

By following this plan step-by-step, the Projects feature will become a polished, production-ready component that serves as another excellent reference implementation for the LifeSync application.
