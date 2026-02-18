/**
 * FormModalV2 Usage Examples
 *
 * This file shows how to migrate existing form modals to use FormModalV2
 * and demonstrates various usage patterns.
 */

import React from 'react';
import { FormModalV2 } from './FormModalV2';
import { useDraftStorage, useSimpleDraft } from '@/hooks/useDraftStorage';

// ============================================================================
// EXAMPLE 1: Simple Task Creation Modal
// ============================================================================

interface SimpleTaskData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export function SimpleTaskModal() {
  const [showModal, setShowModal] = React.useState(false);

  const handleSubmit = async (data: SimpleTaskData) => {
    // Call your mutation
    await createTask(data);
    setShowModal(false); // Close on success
  };

  return (
    <FormModalV2<SimpleTaskData>
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      title="Create Task"
      defaultData={{
        title: '',
        description: '',
        priority: 'medium',
      }}
      draftKey="simple_task_draft"
      onSubmit={handleSubmit}
      validate={(data) => {
        if (!data.title.trim()) return 'Title is required';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              placeholder="Add details..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formState.priority}
              onChange={(e) => setFormState({ ...formState, priority: e.target.value as any })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>
        </>
      )}
    </FormModalV2>
  );
}

// ============================================================================
// EXAMPLE 2: Edit Modal with Delete Button
// ============================================================================

interface HabitData {
  name: string;
  category: string;
  targetDays: number;
}

export function EditHabitModal({
  habitId,
  initialHabit,
  isOpen,
  onClose,
}: {
  habitId: string;
  initialHabit: HabitData;
  isOpen: boolean;
  onClose: () => void;
}) {
  const updateMutation = useUpdateHabit();
  const deleteMutation = useDeleteHabit();

  return (
    <FormModalV2<HabitData>
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Habit"
      defaultData={{
        name: '',
        category: 'health',
        targetDays: 7,
      }}
      initialData={initialHabit}
      isEditing={true}
      isPending={updateMutation.isPending || deleteMutation.isPending}
      showDelete={true}
      onSubmit={async (data) => {
        await updateMutation.mutateAsync({ id: habitId, updates: data });
        onClose();
      }}
      onDelete={async () => {
        await deleteMutation.mutateAsync(habitId);
        onClose();
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Form fields here */}
        </>
      )}
    </FormModalV2>
  );
}

// ============================================================================
// EXAMPLE 3: Manual Draft Management (when you need more control)
// ============================================================================

export function AdvancedFormModal() {
  const [showModal, setShowModal] = React.useState(false);

  // Manual draft management for advanced cases
  const [draft, updateDraft, clearDraft, hasDraft] = useDraftStorage(
    'advanced_form_draft',
    {
      title: '',
      items: [] as string[],
      isUrgent: false,
    },
    { disabled: false, debounceMs: 500 }
  );

  // You can now use draft.title, draft.items, etc.
  // Auto-saves with 500ms debounce
  // Call clearDraft() after submit

  return null; // Implementation here
}

// ============================================================================
// EXAMPLE 4: Quick Add Modal with Simple Draft
// ============================================================================

export function QuickAddModal() {
  const [showModal, setShowModal] = React.useState(false);
  const [text, setText, clearText, hasText] = useSimpleDraft('quick_add_draft', '');

  return (
    <FormModalV2<{ text: string }>
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      title="Quick Add"
      defaultData={{ text: '' }}
      initialData={{ text }} // Use the draft
      onSubmit={async (data) => {
        await quickAddItem(data.text);
        clearText(); // Clear the draft
        setShowModal(false);
      }}
    >
      {(formState, setFormState) => (
        <input
          type="text"
          value={formState.text}
          onChange={(e) => {
            setFormState({ text: e.target.value });
            setText(e.target.value); // Also update draft
          }}
          placeholder="Type something..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 outline-none"
        />
      )}
    </FormModalV2>
  );
}

// ============================================================================
// EXAMPLE 5: Migration from Old Pattern
// ============================================================================

/*
// BEFORE (Old Pattern - 80+ lines)
export function OldTaskFormModal({ isOpen, onClose, initialData }: Props) {
  const STORAGE_KEY = 'task_draft';

  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      logger.error('Tasks', error as Error, { context: 'Failed to load draft' });
    }
    return null;
  };

  const [title, setTitle] = useState(initialData?.title || loadDraft()?.title || '');
  const [description, setDescription] = useState(initialData?.description || loadDraft()?.description || '');
  const [priority, setPriority] = useState(initialData?.priority || loadDraft()?.priority || 'medium');

  useEffect(() => {
    if (title || description) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, description, priority }));
    }
  }, [title, description, priority]);

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
    onSubmit({ title, description, priority });
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-[60]..." onClick={handleBackdropClick}>
      // 60+ more lines of modal structure
    </div>
  );
}

// AFTER (New Pattern - 25 lines)
export function NewTaskFormModal({ isOpen, onClose, initialData, isEditing }: Props) {
  return (
    <FormModalV2<TaskData>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create Task'}
      defaultData={{ title: '', description: '', priority: 'medium' }}
      initialData={initialData}
      isEditing={isEditing}
      draftKey="task_draft"
      onSubmit={(data) => onSubmit(data)}
    >
      {(formState, setFormState) => (
        <>
          <input value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} />
          <textarea value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} />
          <select value={formState.priority} onChange={e => setFormState({...formState, priority: e.target.value})}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </>
      )}
    </FormModalV2>
  );
}
*/

// ============================================================================
// Helper Functions (would be imported from actual modules)
// ============================================================================

// Placeholder functions for examples
function createTask(data: any): Promise<void> {
  return Promise.resolve();
}

function useUpdateHabit(): any {
  return { mutateAsync: async () => {}, isPending: false };
}

function useDeleteHabit(): any {
  return { mutateAsync: async () => {}, isPending: false };
}

function quickAddItem(text: string): Promise<void> {
  return Promise.resolve();
}
