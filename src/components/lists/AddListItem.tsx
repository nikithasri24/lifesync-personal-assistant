import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddListItemProps {
  onAdd: (title: string, notes?: string, url?: string) => void;
  disabled?: boolean;
}

const AddListItem: React.FC<AddListItemProps> = ({ onAdd, disabled = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd(title.trim(), notes.trim() || undefined, url.trim() || undefined);
    setTitle('');
    setNotes('');
    setUrl('');
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setTitle('');
    setNotes('');
    setUrl('');
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        disabled={disabled}
        className="flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-3 text-sm text-slate-600 dark:text-slate-400 hover:border-[#D4A574] dark:hover:border-[#C18B5E] hover:text-[#C18B5E] dark:hover:text-[#E5B88A] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" />
        Add item
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3">
      <div className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-[#C18B5E] focus:outline-none dark:text-slate-100"
          placeholder="Item title (e.g., 'Inception', 'Tokyo', 'The Great Gatsby')"
          autoFocus
          disabled={disabled}
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-[#C18B5E] focus:outline-none dark:text-slate-100"
          placeholder="Notes (optional - e.g., 'Recommended by John', 'Great reviews')"
          rows={2}
          disabled={disabled}
        />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-[#C18B5E] focus:outline-none dark:text-slate-100"
          placeholder="URL (optional - e.g., IMDb, Amazon, Google Maps link)"
          disabled={disabled}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={disabled || !title.trim()}
            className="flex items-center gap-1 rounded-full bg-[#C18B5E] px-4 py-2 text-sm font-medium text-white hover:bg-[#B5795A] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Add item
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={disabled}
            className="flex items-center gap-1 rounded-full border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddListItem;
