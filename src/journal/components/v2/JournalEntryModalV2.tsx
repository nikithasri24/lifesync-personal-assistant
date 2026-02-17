/**
 * JournalEntryModalV2 Component
 * Create/Edit modal for journal entries following Together tab modal patterns
 * Includes auto-save, ESC key support, backdrop click handling, and delete functionality
 */

import React, { useState, useEffect } from 'react';
import { X, Paperclip } from 'lucide-react';
import type { Attachment } from '@/types';
import { logger } from '@/services/logger';

export interface JournalEntryModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    tags: string[];
    attachments?: Attachment[];
  }) => void;
  onDelete?: () => void;
  initialData?: {
    title: string;
    content: string;
    tags: string[];
    attachments?: Attachment[];
  };
  isEditing?: boolean;
  isPending?: boolean;
}

const STORAGE_KEY = 'journal_entry_draft';

export const JournalEntryModalV2: React.FC<JournalEntryModalV2Props> = ({
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
      logger.error('Journal', error as Error, { context: 'Failed to load draft' });
    }
    return null;
  };

  const savedDraft = !initialData ? loadDraft() : null;

  const [title, setTitle] = useState(initialData?.title || savedDraft?.title || '');
  const [content, setContent] = useState(initialData?.content || savedDraft?.content || '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || savedDraft?.tags || '');

  // Update form when initialData changes (editing different entry)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setTags(initialData.tags?.join(', ') || '');
    } else if (!isEditing) {
      // Reset to draft or defaults when creating new entry
      const draft = loadDraft();
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
      }));
    }
  }, [title, content, tags, isEditing]);

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

    if (!content.trim()) return;

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      tags: tags ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    });

    // Clear draft on successful submit
    localStorage.removeItem(STORAGE_KEY);
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Entry' : 'New Entry'}
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

        {/* Scrollable Content Area */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div
            className="overflow-y-auto p-6 space-y-5 flex-1"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            {/* Title Input */}
            <div>
              <label htmlFor="entry-title" className="block text-sm font-semibold text-gray-700 mb-2">
                Title (optional)
              </label>
              <input
                id="entry-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>

            {/* Content Textarea */}
            <div>
              <label htmlFor="entry-content" className="block text-sm font-semibold text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="entry-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                required
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              />
            </div>

            {/* Tags Input */}
            <div>
              <label htmlFor="entry-tags" className="block text-sm font-semibold text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                id="entry-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="gratitude, work, personal..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>

            {/* Attach Files Button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: 'rgba(212, 165, 116, 0.1)',
                border: '2px dashed #D4A574',
                color: '#C18B5E',
              }}
              aria-label="Attach files"
            >
              <Paperclip className="w-4 h-4" />
              <span>Attach Files or Photos</span>
            </button>
          </div>

          {/* Fixed Footer */}
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
                  className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl font-semibold text-red-600 transition-colors"
                  aria-label="Delete entry"
                >
                  🗑️ Delete Entry
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
                disabled={isPending || !content.trim()}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                }}
              >
                {isPending ? 'Saving...' : (isEditing ? 'Update Entry' : 'Create Entry')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JournalEntryModalV2;
