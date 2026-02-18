/**
 * NoteFormModalV2 Component - MIGRATED to use FormModalV2
 * Create/Edit modal for notes
 *
 * MIGRATION COMPLETE:
 * - Reduced from 350 lines to ~215 lines (39% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Conditional content based on noteType
 */

import React from 'react';
import type { NoteType } from '@/types';
import { FormModalV2 } from '@/components/v2';

export interface NoteFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    tags: string[];
    noteType: NoteType;
  }) => void;
  onDelete?: () => void;
  initialData?: {
    title: string;
    content: string;
    tags: string[];
    noteType: NoteType;
  };
  isEditing?: boolean;
  isPending?: boolean;
}

interface NoteFormData {
  noteType: NoteType;
  title: string;
  content: string;
  tags: string;
}

export const NoteFormModalV2: React.FC<NoteFormModalV2Props> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  isEditing = false,
  isPending = false,
}) => {
  const defaultFormData: NoteFormData = {
    noteType: 'note',
    title: '',
    content: '',
    tags: '',
  };

  return (
    <FormModalV2<NoteFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Note' : 'Create Note'}
      defaultData={defaultFormData}
      initialData={initialData ? {
        noteType: initialData.noteType || 'note',
        title: initialData.title || '',
        content: initialData.content || '',
        tags: initialData.tags?.join(', ') || '',
      } : undefined}
      draftKey={isEditing ? undefined : 'notes_create_draft'}
      isPending={isPending}
      submitText={isEditing ? 'Update Note' : 'Create Note'}
      isEditing={isEditing}
      showDelete={isEditing && !!onDelete}
      onDelete={onDelete ? async () => { onDelete(); } : undefined}
      onSubmit={async (formData) => {
        onSubmit({
          title: formData.title.trim(),
          content: formData.content.trim(),
          tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
          noteType: formData.noteType,
        });
      }}
      validate={(formData) => {
        if (!formData.title.trim()) return 'Title is required';
        if (formData.noteType === 'note' && !formData.content.trim()) {
          return 'Content is required for text notes';
        }
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Note Type Toggle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Note Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormState({ ...formState, noteType: 'note' })}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: formState.noteType === 'note'
                    ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                    : '#F3F4F6',
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: formState.noteType === 'note' ? '#C18B5E' : 'transparent',
                  color: formState.noteType === 'note' ? '#C18B5E' : '#374151',
                }}
              >
                📝 Text Note
              </button>
              <button
                type="button"
                onClick={() => setFormState({ ...formState, noteType: 'list' })}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: formState.noteType === 'list'
                    ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                    : '#F3F4F6',
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: formState.noteType === 'list' ? '#C18B5E' : 'transparent',
                  color: formState.noteType === 'list' ? '#C18B5E' : '#374151',
                }}
              >
                ☑️ Checklist
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              placeholder="Note title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              style={{
                borderColor: '#D1D5DB',
              }}
              required
              autoFocus
            />
          </div>

          {/* Content Textarea (only for text notes) */}
          {formState.noteType === 'note' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Content
              </label>
              <textarea
                rows={8}
                value={formState.content}
                onChange={(e) => setFormState({ ...formState, content: e.target.value })}
                placeholder="Start writing..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                style={{
                  borderColor: '#D1D5DB',
                }}
                required
              />
            </div>
          )}

          {/* Content Textarea (for checklists) */}
          {formState.noteType === 'list' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Checklist Items
              </label>
              <textarea
                rows={6}
                value={formState.content}
                onChange={(e) => setFormState({ ...formState, content: e.target.value })}
                placeholder="Add checklist items..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                style={{
                  borderColor: '#D1D5DB',
                }}
              />
            </div>
          )}

          {/* Tags Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags (optional)
            </label>
            <input
              type="text"
              value={formState.tags}
              onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
              placeholder="work, ideas, personal"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              style={{
                borderColor: '#D1D5DB',
              }}
            />
            <p className="text-xs mt-1 text-gray-500">
              Separate tags with commas
            </p>
          </div>
        </>
      )}
    </FormModalV2>
  );
};

export default NoteFormModalV2;
