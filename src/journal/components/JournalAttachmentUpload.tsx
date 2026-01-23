import React, { useRef, useState } from 'react';
import { Paperclip, Link as LinkIcon, Upload } from 'lucide-react';
import type { Attachment } from '../../types';

interface JournalAttachmentUploadProps {
  onAttachmentAdd: (attachment: Attachment) => void;
}

/**
 * Component for uploading attachments or adding links
 * Note: File upload is UI-only for now - actual upload to Supabase Storage
 * would require additional backend integration
 */
export function JournalAttachmentUpload({
  onAttachmentAdd,
}: JournalAttachmentUploadProps): React.ReactElement {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Create a temporary URL for preview (in production, upload to Supabase Storage)
      const url = URL.createObjectURL(file);
      const isImage = file.type.startsWith('image/');

      const attachment: Attachment = {
        id: crypto.randomUUID(),
        name: file.name,
        type: isImage ? 'image' : 'file',
        url,
        size: file.size,
      };

      onAttachmentAdd(attachment);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;

    const attachment: Attachment = {
      id: crypto.randomUUID(),
      name: linkName.trim() || linkUrl,
      type: 'link',
      url: linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`,
    };

    onAttachmentAdd(attachment);
    setLinkUrl('');
    setLinkName('');
    setShowLinkInput(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddLink();
    }
  };

  return (
    <div className="space-y-2" data-testid="journal-attachment-upload">
      <div className="flex items-center gap-2">
        {/* File Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-300 transition"
          data-testid="journal-attachment-upload-file"
        >
          <Upload className="h-4 w-4" />
          Upload File
        </button>

        {/* Link Button */}
        <button
          type="button"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
            showLinkInput
              ? 'bg-slate-200 dark:bg-slate-300 text-slate-800'
              : 'bg-slate-100 dark:bg-slate-200 text-slate-800 dark:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-300'
          }`}
          data-testid="journal-attachment-upload-link-toggle"
        >
          <LinkIcon className="h-4 w-4" />
          Add Link
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.md"
        />
      </div>

      {/* Link Input Form */}
      {showLinkInput && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-600 dark:text-white mb-1">
              URL
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm focus:border-slate-400 focus:outline-none dark:text-white"
              data-testid="journal-attachment-link-url"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-slate-600 dark:text-white mb-1">
              Name (optional)
            </label>
            <input
              type="text"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Link name"
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm focus:border-slate-400 focus:outline-none dark:text-white"
              data-testid="journal-attachment-link-name"
            />
          </div>
          <button
            type="button"
            onClick={handleAddLink}
            disabled={!linkUrl.trim()}
            className="rounded-md bg-slate-700 dark:bg-slate-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            data-testid="journal-attachment-link-add"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

export default JournalAttachmentUpload;

