import React from 'react';
import { File, Image, Link as LinkIcon, X, ExternalLink } from 'lucide-react';
import type { Attachment } from '../../types';

interface JournalAttachmentListProps {
  attachments: Attachment[];
  onRemove?: (id: string) => void;
  readonly?: boolean;
}

/**
 * Display a list of attachments with optional remove functionality
 */
export function JournalAttachmentList({
  attachments,
  onRemove,
  readonly = false,
}: JournalAttachmentListProps): React.ReactElement | null {
  if (attachments.length === 0) {
    return null;
  }

  const getIcon = (type: Attachment['type']) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'link':
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2" data-testid="journal-attachment-list">
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Attachments ({attachments.length})
      </h4>
      <ul className="space-y-1">
        {attachments.map((attachment) => (
          <li
            key={attachment.id}
            className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2"
            data-testid={`journal-attachment-${attachment.id}`}
          >
            <span className="text-slate-500 dark:text-slate-400">
              {getIcon(attachment.type)}
            </span>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm text-slate-700 dark:text-slate-300 hover:text-[#C18B5E] dark:hover:text-[#E5B88A] truncate flex items-center gap-1"
            >
              {attachment.name}
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
            {attachment.size && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {formatSize(attachment.size)}
              </span>
            )}
            {!readonly && onRemove && (
              <button
                type="button"
                onClick={() => onRemove(attachment.id)}
                className="p-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition"
                aria-label={`Remove ${attachment.name}`}
                data-testid={`journal-attachment-remove-${attachment.id}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default JournalAttachmentList;

