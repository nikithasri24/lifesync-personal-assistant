/**
 * NoteCardV2 Component
 * Note card with title, date, and tags
 */

import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import type { Note } from '../../../types';

export interface NoteCardV2Props {
  note: Note;
  onClick?: () => void;
  index?: number;
}

export const NoteCardV2: React.FC<NoteCardV2Props> = ({
  note,
  onClick,
  index = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`
        group p-4
        bg-white dark:bg-gray-800
        rounded-xl
        border border-gray-200 dark:border-gray-700
        shadow-sm hover:shadow-md
        transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Title */}
      <h4 className="
        text-sm font-medium 
        text-gray-900 dark:text-white
        mb-2
        group-hover:text-[var(--color-primary-600)] dark:group-hover:text-[var(--color-primary-400)]
        transition-colors duration-200
        line-clamp-2
      ">
        {note.title}
      </h4>

      {/* Date */}
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
        {format(new Date(note.updatedAt), 'MMM dd, yyyy')}
      </p>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {note.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="
                px-3 py-1 rounded-full
                text-xs font-medium
                bg-[var(--color-accent-500)]/10 dark:bg-[var(--color-accent-500)]/20
                text-[var(--color-accent-700)] dark:text-[var(--color-accent-300)]
                border border-[var(--color-accent-200)] dark:border-[var(--color-accent-800)]
              "
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="
              px-3 py-1 rounded-full
              text-xs font-medium
              bg-gray-100 dark:bg-gray-700
              text-gray-600 dark:text-gray-400
            ">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default NoteCardV2;

