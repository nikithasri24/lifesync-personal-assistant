/**
 * CheckboxV2 Component
 * 32px circular checkbox with terracotta gradient fill
 * iOS-inspired design with smooth animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { gradients } from '../../styles/colors';

export interface CheckboxV2Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

const sizeStyles = {
  sm: {
    container: 'w-6 h-6',
    icon: 'w-3.5 h-3.5',
    text: 'text-sm',
  },
  md: {
    container: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-base',
  },
  lg: {
    container: 'w-10 h-10',
    icon: 'w-5 h-5',
    text: 'text-lg',
  },
};

export const CheckboxV2: React.FC<CheckboxV2Props> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = '',
  id,
}) => {
  const colors = useThemeColors();
  const checkboxId = id || `checkbox-${Math.random().toString(36).substring(7)}`;
  const styles = sizeStyles[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-labelledby={label ? `${checkboxId}-label` : undefined}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          ${styles.container}
          rounded-full
          flex items-center justify-center
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        `}
        style={{
          background: checked ? gradients.primary : colors.bg.white,
          border: checked ? 'none' : `2px solid ${colors.border.medium}`,
        }}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Check className={`${styles.icon} text-white stroke-[3]`} />
          </motion.div>
        )}
      </button>

      {label && (
        <label
          id={`${checkboxId}-label`}
          onClick={() => !disabled && onChange(!checked)}
          className={`
            ${styles.text}
            font-medium
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          style={{ color: colors.text.primary }}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default CheckboxV2;
