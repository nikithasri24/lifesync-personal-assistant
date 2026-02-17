/**
 * NoteFormModalV2 Component
 * Create/Edit modal for notes following Together tab modal patterns
 * Includes auto-save, ESC key support, and backdrop click handling
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { NoteType } from '@/types';
import { logger } from '@/services/logger';

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

const STORAGE_KEY = 'notes_create_draft';

export const NoteFormModalV2: React.FC<NoteFormModalV2Props> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  isEditing = false,
  isPending = false,
}) => {
  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      logger.error('Notes', error as Error, { context: 'Failed to load draft' });
    }
    return null;
  };

  const savedDraft = !initialData ? loadDraft() : null;

  const [noteType, setNoteType] = useState<NoteType>(initialData?.noteType || savedDraft?.noteType || 'note');
  const [title, setTitle] = useState(initialData?.title || savedDraft?.title || '');
  const [content, setContent] = useState(initialData?.content || savedDraft?.content || '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || savedDraft?.tags || '');

  // Update form when initialData changes (editing different note)
  useEffect(() => {
    if (initialData) {
      setNoteType(initialData.noteType || 'note');
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setTags(initialData.tags?.join(', ') || '');
    } else if (!isEditing) {
      // Reset to draft or defaults when creating new note
      const draft = loadDraft();
      setNoteType(draft?.noteType || 'note');
      setTitle(draft?.title || '');
      setContent(draft?.content || '');
      setTags(draft?.tags || '');
    }
  }, [initialData, isEditing]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!isEditing && (title || content || tags)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        title,
        content,
        tags,
        noteType,
      }));
    }
  }, [title, content, tags, noteType, isEditing]);

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
    if (noteType === 'note' && !content.trim()) return;

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
      noteType,
    });

    // Clear draft on successful submit
    localStorage.removeItem(STORAGE_KEY);

    // Reset form
    setTitle('');
    setContent('');
    setTags('');
    setNoteType('note');
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
            {isEditing ? 'Edit Note' : 'Create Note'}
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
            {/* Note Type Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Note Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNoteType('note')}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    noteType === 'note'
                      ? 'bg-terracotta-100 text-terracotta-600 border-2 border-terracotta-400'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                  }`}
                  style={{
                    background: noteType === 'note'
                      ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                      : '#F3F4F6',
                    borderColor: noteType === 'note' ? '#C18B5E' : 'transparent',
                    color: noteType === 'note' ? '#C18B5E' : '#374151',
                  }}
                >
                  📝 Text Note
                </button>
                <button
                  type="button"
                  onClick={() => setNoteType('list')}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    noteType === 'list'
                      ? 'bg-terracotta-100 text-terracotta-600 border-2 border-terracotta-400'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                  }`}
                  style={{
                    background: noteType === 'list'
                      ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                      : '#F3F4F6',
                    borderColor: noteType === 'list' ? '#C18B5E' : 'transparent',
                    color: noteType === 'list' ? '#C18B5E' : '#374151',
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
            {noteType === 'note' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
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
            {noteType === 'list' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Checklist Items
                </label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
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
                value={tags}
                onChange={(e) => setTags(e.target.value)}
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
          </div>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
            {/* Delete button (only when editing) */}
            {isEditing && onDelete && (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
                      onDelete();
                    }
                  }}
                  className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl font-semibold text-red-600 transition-colors flex items-center justify-center gap-2"
                  aria-label="Delete note"
                >
                  <span>🗑️</span>
                  Delete Note
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
                disabled={isPending || !title.trim() || (noteType === 'note' && !content.trim())}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                }}
              >
                {isPending ? 'Saving...' : (isEditing ? 'Update Note' : 'Create Note')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteFormModalV2;
