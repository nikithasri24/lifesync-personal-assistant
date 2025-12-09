import React, { useState } from 'react';
import { Check, X, Trash2, ExternalLink, Calendar, Tag } from 'lucide-react';
import type { ListItem } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface ListItemRowProps {
  item: ListItem;
  onToggleComplete: () => void;
  onDelete: () => void;
  onUpdate: (updates: { title?: string; notes?: string; tags?: string[]; dueDate?: Date | null; url?: string }) => void;
}

const ListItemRow: React.FC<ListItemRowProps> = ({ item, onToggleComplete, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editNotes, setEditNotes] = useState(item.notes || '');
  const [editUrl, setEditUrl] = useState(item.url || '');

  const handleSave = () => {
    onUpdate({
      title: editTitle,
      notes: editNotes || undefined,
      url: editUrl || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(item.title);
    setEditNotes(item.notes || '');
    setEditUrl(item.url || '');
    setIsEditing(false);
  };

  const isOverdue = item.dueDate && !item.completed && new Date(item.dueDate) < new Date();

  if (isEditing) {
    return (
      <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3">
        <div className="space-y-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-sm"
            placeholder="Item title"
          />
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-sm"
            placeholder="Notes (optional)"
            rows={2}
          />
          <input
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-sm"
            placeholder="URL (optional)"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-500"
            >
              <Check className="h-3 w-3" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 rounded border border-slate-300 dark:border-slate-600 px-3 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg border p-3 transition ${
        item.completed
          ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggleComplete}
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition ${
          item.completed
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400'
        }`}
      >
        {item.completed && <Check className="h-3 w-3" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                item.completed
                  ? 'text-slate-500 dark:text-slate-400 line-through'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {item.title}
            </p>
            {item.notes && (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{item.notes}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Edit"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <Tag className="h-3 w-3" />
              <span>#{item.tags.join(' #')}</span>
            </div>
          )}
          {item.dueDate && (
            <div
              className={`flex items-center gap-1 ${
                isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span>
                {isOverdue ? 'Overdue' : 'Due'} {formatDistanceToNow(new Date(item.dueDate), { addSuffix: true })}
              </span>
            </div>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Link</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListItemRow;
