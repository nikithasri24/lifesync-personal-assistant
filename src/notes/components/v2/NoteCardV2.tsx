/**
 * NoteCardV2 Component
 * Card component for both grid and list views
 * Supports text notes and checklists with terracotta theme
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { NoteType } from '@/types';
import { getRelativeTime } from '@/utils/dateUtils';

export interface NoteCardV2Props {
  id: string;
  title: string;
  content: string;
  noteType: NoteType;
  tags?: string[];
  owner?: {
    isOwner: boolean;
    displayName: string;
  };
  createdAt?: string;
  listItems?: Array<{ text: string; completed: boolean }>;
  onClick: () => void;
  viewMode?: 'grid' | 'list';
  showOwnerBadge?: boolean;
}

export const NoteCardV2: React.FC<NoteCardV2Props> = ({
  title,
  content,
  noteType,
  tags = [],
  owner,
  createdAt,
  listItems = [],
  onClick,
  viewMode = 'grid',
  showOwnerBadge = false,
}) => {
  const colors = useThemeColors();

  // Border color based on note type
  const borderColor = noteType === 'note' ? '#D4A574' : '#C18B5E';

  // Parse list items if it's a checklist
  const checklistItems = noteType === 'list' && listItems.length > 0 ? listItems : [];

  return (
    <div
      onClick={onClick}
      className={`
        relative
        cursor-pointer
        transition-transform
        hover:scale-[1.01]
        active:scale-[0.98]
        ${viewMode === 'grid' ? 'min-h-[120px]' : ''}
      `}
      style={{
        backgroundColor: 'white',
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
        transitionDuration: '150ms',
      }}
    >
      {/* Owner badge (top-right, only in merged mode) */}
      {showOwnerBadge && owner && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 8px',
            background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#C18B5E',
          }}
        >
          {owner.displayName}
        </div>
      )}

      {/* Title */}
      <h3
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: colors.text.primary,
          marginBottom: '8px',
          lineHeight: 1.3,
          paddingRight: showOwnerBadge ? '60px' : '0',
        }}
      >
        {title}
      </h3>

      {/* Content preview (text notes) */}
      {noteType === 'note' && content && (
        <p
          style={{
            fontSize: '13px',
            color: colors.text.secondary,
            lineHeight: 1.4,
            marginBottom: '12px',
            display: '-webkit-box',
            WebkitLineClamp: viewMode === 'grid' ? 3 : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {content}
        </p>
      )}

      {/* Checklist items (list notes) */}
      {noteType === 'list' && checklistItems.length > 0 && (
        <div style={{ marginTop: '12px', marginBottom: '12px' }}>
          {checklistItems.slice(0, viewMode === 'grid' ? 3 : 4).map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                borderBottom: index < checklistItems.length - 1 ? `1px solid ${colors.bg.secondary}` : 'none',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #C18B5E',
                  borderRadius: '6px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: item.completed ? 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' : 'transparent',
                  color: 'white',
                  fontSize: '12px',
                }}
              >
                {item.completed && '✓'}
              </div>
              <span
                style={{
                  flex: 1,
                  fontSize: '13px',
                  color: item.completed ? colors.text.tertiary : colors.text.primary,
                  textDecoration: item.completed ? 'line-through' : 'none',
                }}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer: Tags and meta */}
      <div>
        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {tags.map((tag, index) => (
              <div
                key={index}
                style={{
                  padding: '4px 8px',
                  background: colors.bg.tertiary,
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.text.secondary,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        )}

        {/* Created date (only in list view) */}
        {createdAt && viewMode === 'list' && (
          <div style={{ fontSize: '11px', color: colors.text.tertiary, marginTop: '8px' }}>
            {getRelativeTime(createdAt)}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteCardV2;
