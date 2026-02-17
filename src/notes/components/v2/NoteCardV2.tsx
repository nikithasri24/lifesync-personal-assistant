/**
 * NoteCardV2 Component
 * Card component for both grid and list views
 * Supports text notes and checklists with terracotta theme
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useThemeColors } from '@/hooks/useThemeColors';
import { BadgeV2 } from '@/components/v2';
import type { NoteType } from '@/types';
import { CheckboxV2 } from '@/components/v2';

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

  // Format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const entryDate = new Date(date);
    const diffMs = now.getTime() - entryDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) return 'Just now';
      if (diffHours === 1) return '1 hour ago';
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`
        relative
        cursor-pointer
        ${viewMode === 'grid' ? 'min-h-[120px]' : ''}
      `}
      style={{
        backgroundColor: 'white',
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
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
          color: '#5C4A3A',
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
            color: '#6B5847',
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
                borderBottom: index < checklistItems.length - 1 ? '1px solid #F5F0EA' : 'none',
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
                  color: item.completed ? '#9B8B7A' : '#5C4A3A',
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
                  background: '#E8DCC8',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6B5847',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        )}

        {/* Created date (only in list view) */}
        {createdAt && viewMode === 'list' && (
          <div style={{ fontSize: '11px', color: '#9B8B7A', marginTop: '8px' }}>
            {formatRelativeTime(createdAt)}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NoteCardV2;
