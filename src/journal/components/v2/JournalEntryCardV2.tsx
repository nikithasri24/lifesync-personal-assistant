/**
 * JournalEntryCardV2 Component
 * Entry display card with title, content preview, tags, and metadata
 * Supports owner badges for merged mode
 */

import React from 'react';
import { Paperclip } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { BadgeV2 } from '@/components/v2';
import { getRelativeTime } from '@/utils/dateUtils';

export interface JournalEntryCardV2Props {
  id: string;
  title?: string;
  content: string;
  tags?: string[];
  createdAt: string;
  attachmentCount?: number;
  owner?: {
    isOwner: boolean;
    displayName: string;
  };
  onClick: () => void;
  showOwnerBadge?: boolean;
}

export const JournalEntryCardV2: React.FC<JournalEntryCardV2Props> = ({
  title,
  content,
  tags = [],
  createdAt,
  attachmentCount = 0,
  owner,
  onClick,
  showOwnerBadge = false,
}) => {
  const colors = useThemeColors();

  // Strip HTML tags from content for preview
  const getTextContent = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent?.trim() || '';
  };

  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer shadow-sm mb-4 transition-transform hover:scale-[1.005] active:scale-[0.995]"
      style={{
        backgroundColor: colors.bg.card,
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
        transitionDuration: '150ms',
      }}
    >
      {/* Header: Title and Date */}
      <div className="flex items-start justify-between mb-2">
        <h3
          className="text-lg font-bold flex-1 leading-tight"
          style={{
            color: colors.text.primary,
            paddingRight: showOwnerBadge ? '60px' : '0',
          }}
        >
          {title || 'Untitled Entry'}
        </h3>
        <span
          className="text-xs whitespace-nowrap ml-3"
          style={{ color: colors.text.tertiary }}
        >
          {getRelativeTime(createdAt)}
        </span>
      </div>

      {/* Content Preview */}
      <p
        className="text-sm leading-relaxed mb-3 line-clamp-3"
        style={{ color: colors.text.secondary }}
      >
        {getTextContent(content)}
      </p>

      {/* Footer: Metadata */}
      <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: colors.border.light }}>
        {/* Attachment count */}
        {attachmentCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: colors.text.tertiary }}>
            <Paperclip className="w-3.5 h-3.5" />
            <span>{attachmentCount} {attachmentCount === 1 ? 'attachment' : 'attachments'}</span>
          </div>
        )}

        {/* Owner badge (merged mode) */}
        {showOwnerBadge && owner && (
          <div className="ml-auto">
            <BadgeV2
              text={owner.displayName}
              variant={owner.isOwner ? 'accent' : 'success'}
              size="sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalEntryCardV2;
