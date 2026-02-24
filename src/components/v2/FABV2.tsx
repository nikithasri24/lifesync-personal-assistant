/**
 * FABV2 Component
 * Floating Action Button with terracotta gradient
 * iOS-inspired design with smooth animations and shadow
 *
 * Fixed: Issue #2 from QA-ISSUES-FOUND.md
 * - Removed bottom position from className (was causing viewport issues)
 * - Added dynamic bottom positioning via inline style
 * - Accounts for mobile navigation bar (5rem) + spacing (1.5rem)
 * - Includes safe area insets for devices with notches
 * - Must be rendered outside centered containers for proper viewport positioning
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { gradients, shadows } from '../../styles/colors';

export interface FABV2Props {
  icon: LucideIcon;
  onClick: () => void;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const positionStyles = {
  'bottom-right': 'fixed right-6',
  'bottom-left': 'fixed left-6',
  'bottom-center': 'fixed left-1/2 -translate-x-1/2',
};

const sizeStyles = {
  sm: {
    button: 'w-12 h-12',
    icon: 'w-5 h-5',
    text: 'text-sm',
  },
  md: {
    button: 'w-14 h-14',
    icon: 'w-6 h-6',
    text: 'text-base',
  },
  lg: {
    button: 'w-16 h-16',
    icon: 'w-7 h-7',
    text: 'text-lg',
  },
};

export const FABV2: React.FC<FABV2Props> = ({
  icon: Icon,
  onClick,
  label,
  position = 'bottom-right',
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const styles = sizeStyles[size];
  const hasLabel = Boolean(label);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`
        ${positionStyles[position]}
        ${hasLabel ? 'px-6 rounded-full' : `${styles.button} rounded-full`}
        flex items-center justify-center gap-2
        text-white font-semibold
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        z-50
        ${className}
      `}
      style={{
        background: gradients.primary,
        boxShadow: disabled ? 'none' : shadows.fab,
        // Position above mobile navigation bar (5rem = 80px nav height + 1.5rem = 24px spacing)
        // Includes safe area inset for devices with notches/home indicators
        bottom: 'calc(5rem + 1.5rem + env(safe-area-inset-bottom, 0px))',
      }}
      aria-label={label || 'Floating action button'}
    >
      <Icon className={styles.icon} />
      {label && <span className={styles.text}>{label}</span>}
    </motion.button>
  );
};

export default FABV2;
