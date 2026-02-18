# TaskFormModalV2 Migration - Before & After

## Summary

Migrated TaskFormModalV2 from 512 lines to 385 lines using FormModalV2.

**Result:** 25% code reduction + 186 lines of boilerplate eliminated

---

## 📊 Comparison

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| **Lines of Code** | 512 | 385 | 25% reduction |
| **Auto-save Logic** | 17 lines | 0 (built-in) | 100% |
| **ESC Key Handler** | 13 lines | 0 (built-in) | 100% |
| **Backdrop Handler** | 6 lines | 0 (built-in) | 100% |
| **Modal Structure** | 35 lines | 0 (built-in) | 100% |
| **Form State Management** | 13 lines (11 useState) | 0 (built-in) | 100% |
| **Manual Draft Loading** | 10 lines | 0 (built-in) | 100% |
| **Manual Form Reset** | 36 lines | 0 (built-in) | 100% |
| **Footer Structure** | 41 lines | 0 (built-in) | 100% |
| **Total Boilerplate** | 186 lines | 0 | 100% |

---

## 📝 Code Comparison

### BEFORE (512 lines)

```typescript
/**
 * TaskFormModalV2 Component
 * Comprehensive task editing modal following Together pattern with auto-save
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, Folder, Repeat, Link2, Star } from 'lucide-react';
import type { TaskData, ProjectData } from '@/services/types';
import { useThemeColors } from '@/hooks/useThemeColors';
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
  const colors = useThemeColors();

  // Load draft from localStorage (10 lines)
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      logger.error('Tasks', error as Error, { context: 'Failed to load draft' });
    }
    return null;
  };

  const savedDraft = !initialData && !isEditing ? loadDraft() : null;

  // Form state - 11 useState declarations (13 lines)
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

  // Update form when initialData changes (15 lines)
  useEffect(() => {
    if (initialData && isEditing) {
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
    }
  }, [initialData, isEditing]);

  // Auto-save to localStorage (17 lines)
  useEffect(() => {
    if (!isEditing && (title || description)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        title,
        description,
        priority,
        status,
        category,
        project_id: projectId,
        due_date: dueDate,
        estimated_time: estimatedTime,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        starred,
        recurrence_pattern: recurrencePattern,
      }));
    }
  }, [title, description, priority, status, category, projectId, dueDate, estimatedTime, tags, starred, recurrencePattern, isEditing]);

  // ESC key support (13 lines)
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

  // Backdrop click handler (6 lines)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Form submission with manual reset (36 lines)
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

    // Clear draft after successful submit
    localStorage.removeItem(STORAGE_KEY);

    // Reset form if creating new task
    if (!isEditing) {
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
    }
  };

  if (!isOpen) return null;

  // ... priority, status, category, recurrence options (same in both versions)

  return (
    // 35 lines of modal structure
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto p-6 space-y-5 flex-1" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {/* All form fields - 220 lines */}
          </div>

          {/* Fixed Footer - 41 lines */}
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
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
                style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
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

---

### AFTER (385 lines)

```typescript
/**
 * TaskFormModalV2 Component
 * Comprehensive task editing modal - MIGRATED to use FormModalV2
 *
 * MIGRATION COMPLETE:
 * - Reduced from 512 lines to 385 lines (25% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Auto-save handled by FormModalV2/useDraftStorage
 * - ESC key, backdrop click built-in
 */

import React from 'react';
import { Calendar, Flag, Folder, Repeat, Link2, Star } from 'lucide-react';
import type { TaskData, ProjectData } from '@/services/types';
import { FormModalV2 } from '@/components/v2';

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

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskData['priority'];
  status: TaskData['status'];
  category: TaskData['category'];
  project_id: string | null;
  due_date: string;
  estimated_time: string;
  tags: string; // comma-separated
  starred: boolean;
  recurrence_pattern: TaskData['recurrence_pattern'];
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
  // Convert initialData to form format
  const initialFormData: TaskFormData | undefined = initialData ? {
    title: initialData.title || '',
    description: initialData.description || '',
    priority: initialData.priority || 'medium',
    status: initialData.status || 'todo',
    category: initialData.category || 'personal',
    project_id: initialData.project_id || null,
    due_date: initialData.due_date || '',
    estimated_time: initialData.estimated_time?.toString() || '',
    tags: (initialData.tags || []).join(', '),
    starred: initialData.starred || false,
    recurrence_pattern: initialData.recurrence_pattern || 'none',
  } : undefined;

  // Default form data for new tasks
  const defaultFormData: TaskFormData = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    category: 'personal',
    project_id: null,
    due_date: '',
    estimated_time: '',
    tags: '',
    starred: false,
    recurrence_pattern: 'none',
  };

  // ... priority, status, category, recurrence options (same as before)

  return (
    <FormModalV2<TaskFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create Task'}
      defaultData={defaultFormData}
      initialData={initialFormData}
      draftKey="tasks_edit_draft"
      isPending={isPending}
      submitText={isEditing ? 'Update Task' : 'Create Task'}
      isEditing={isEditing}
      showDelete={isEditing && !!onDelete}
      onDelete={onDelete}
      onSubmit={async (formData) => {
        // Transform form data to TaskData format
        const taskData: Partial<TaskData> = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          priority: formData.priority,
          status: formData.status,
          category: formData.category,
          project_id: formData.project_id,
          due_date: formData.due_date || null,
          estimated_time: formData.estimated_time ? parseInt(formData.estimated_time, 10) : null,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          starred: formData.starred,
          recurrence_pattern: formData.recurrence_pattern,
        };

        await onSubmit(taskData);
        onClose();
      }}
      validate={(formData) => {
        if (!formData.title.trim()) return 'Task title is required';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* All form fields - 220 lines (same as before) */}
          {/* Title, Description, Priority, Status, Category, Project, Due Date, etc. */}
        </>
      )}
    </FormModalV2>
  );
};
```

**Benefits:**
- ✅ 25% code reduction (512 → 385 lines)
- ✅ 186 lines of boilerplate eliminated (100% removal)
- ✅ All modal behavior built-in (ESC, backdrop, structure)
- ✅ Auto-save with debouncing
- ✅ Form state management simplified (11 useState → single formState object)
- ✅ Validation support
- ✅ Delete button handled by FormModalV2

---

## ✅ What Gets Eliminated

**Boilerplate Removed (186 lines total):**
- ✅ Manual draft loading logic (10 lines)
- ✅ 11 useState declarations for form fields (13 lines)
- ✅ Manual useEffect for initialData sync (15 lines)
- ✅ Manual auto-save logic with localStorage (17 lines)
- ✅ ESC key handler (13 lines)
- ✅ Backdrop click handler (6 lines)
- ✅ Manual form submission and reset (36 lines)
- ✅ Modal structure JSX (backdrop, container, drag handle, header) (35 lines)
- ✅ Footer structure with buttons (41 lines)

**What Remains (385 lines):**
- ✅ Form field definitions (title, description, priority, etc.) - necessary UI
- ✅ Options arrays (priorityOptions, statusOptions, etc.) - necessary data
- ✅ Data transformation logic (form format ↔ TaskData format) - business logic

**New Features Gained:**
- ✅ Automatic draft management with debouncing (300ms)
- ✅ Built-in validation support
- ✅ Consistent modal behavior across all modals
- ✅ Delete button integrated with confirmation
- ✅ Better TypeScript type safety with generics

---

## 🎯 Key Improvements

### 1. Form State Management

**Before:** 11 separate useState declarations
```typescript
const [title, setTitle] = useState('');
const [description, setDescription] = useState('');
const [priority, setPriority] = useState('medium');
const [status, setStatus] = useState('todo');
// ... 7 more useState declarations
```

**After:** Single formState object managed by FormModalV2
```typescript
{(formState, setFormState) => (
  <input
    value={formState.title}
    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
  />
)}
```

### 2. Auto-save

**Before:** Manual localStorage with 17 lines of code
```typescript
useEffect(() => {
  if (!isEditing && (title || description)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      title, description, priority, status, category,
      project_id: projectId, due_date: dueDate,
      estimated_time: estimatedTime, tags: ..., starred,
      recurrence_pattern: recurrencePattern,
    }));
  }
}, [title, description, priority, status, category, projectId, dueDate, estimatedTime, tags, starred, recurrencePattern, isEditing]);
```

**After:** Built-in with debouncing
```typescript
// Handled automatically by FormModalV2/useDraftStorage
draftKey="tasks_edit_draft"
```

### 3. Data Transformation

**Before:** Inline in handleSubmit (mixed with submission logic)
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!title.trim()) return;

  onSubmit({
    title: title.trim(),
    description: description.trim() || undefined,
    // ... transformation logic mixed with submission
  });

  localStorage.removeItem(STORAGE_KEY);
  // ... manual reset logic
};
```

**After:** Clean separation in onSubmit callback
```typescript
onSubmit={async (formData) => {
  const taskData: Partial<TaskData> = {
    title: formData.title.trim(),
    description: formData.description.trim() || undefined,
    // ... clean transformation logic
  };

  await onSubmit(taskData);
  onClose(); // Automatic draft clearing handled by FormModalV2
}}
```

---

## 📋 Testing Checklist

- [ ] Modal opens correctly (create mode)
- [ ] Modal opens correctly (edit mode with initialData)
- [ ] All form fields render and update
- [ ] Auto-save works (check localStorage with key `tasks_edit_draft`)
- [ ] ESC key closes modal
- [ ] Backdrop click closes modal
- [ ] Submit button disabled when title empty
- [ ] Submit creates/updates task
- [ ] Draft clears after submit
- [ ] Delete button shows only in edit mode
- [ ] Delete button calls onDelete callback
- [ ] Loading state shows "Saving..."
- [ ] Mobile: bottom sheet works
- [ ] Desktop: centered modal works
- [ ] All 11 form fields work:
  - [ ] Title (text input)
  - [ ] Description (textarea)
  - [ ] Priority (button grid)
  - [ ] Status (button grid)
  - [ ] Category (button grid)
  - [ ] Project (select dropdown)
  - [ ] Due Date (date input)
  - [ ] Estimated Time (number input)
  - [ ] Recurrence (button row)
  - [ ] Tags (text input)
  - [ ] Starred (checkbox)

---

## 🚀 Impact Summary

### Before Migration
- **512 lines** of code
- **186 lines** of boilerplate
- **11 useState** declarations
- **3 useEffect** hooks for boilerplate
- Manual draft management
- Manual ESC/backdrop handling
- Manual form reset

### After Migration
- **385 lines** of code (25% reduction)
- **0 lines** of boilerplate (100% elimination)
- **0 useState** declarations (managed by FormModalV2)
- **0 useEffect** hooks (all built-in)
- Automatic draft management with debouncing
- Built-in ESC/backdrop handling
- Automatic form reset

### Code Quality Improvements
- ✅ Single responsibility - component only defines form structure
- ✅ Better type safety with TypeScript generics
- ✅ Consistent behavior with other modals
- ✅ Less code to maintain and test
- ✅ Easier to add new fields (just add to TaskFormData interface and form)

---

## 📚 Related Files

- **Base Component:** `/src/components/v2/FormModalV2.tsx`
- **Draft Storage Hook:** `/src/hooks/useDraftStorage.ts`
- **Migration Guide:** `/PHASE1_CONSOLIDATION.md`
- **Example Usage:** `/src/components/v2/FormModalV2.example.tsx`
