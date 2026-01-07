/**
 * ButtonGroupV2 Component
 * Group of related buttons with consistent styling
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface ButtonGroupItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

export interface ButtonGroupV2Props {
  items: ButtonGroupItem[];
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const variantStyles = {
  primary: {
    button: 'bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white',
    disabled: 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  },
  secondary: {
    button: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
    disabled: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
  },
  outline: {
    button: 'bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white',
    disabled: 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500',
  },
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const ButtonGroupV2: React.FC<ButtonGroupV2Props> = ({
  items,
  variant = 'secondary',
  size = 'md',
  orientation = 'horizontal',
  className = '',
}) => {
  const styles = variantStyles[variant];
  const sizeClass = sizeStyles[size];

  return (
    <div
      className={`
        inline-flex
        ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}
        rounded-lg overflow-hidden
        border border-gray-200 dark:border-gray-700
        ${className}
      `}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const isDisabled = item.disabled || false;

        return (
          <motion.button
            key={item.id}
            onClick={item.onClick}
            disabled={isDisabled}
            whileHover={{ scale: isDisabled ? 1 : 1.02 }}
            whileTap={{ scale: isDisabled ? 1 : 0.98 }}
            className={`
              ${sizeClass}
              ${isDisabled ? styles.disabled : styles.button}
              ${index > 0 && orientation === 'horizontal' ? 'border-l border-gray-300 dark:border-gray-600' : ''}
              ${index > 0 && orientation === 'vertical' ? 'border-t border-gray-300 dark:border-gray-600' : ''}
              font-medium
              transition-all duration-200
              ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              flex items-center justify-center gap-2
            `}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{item.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default ButtonGroupV2;

