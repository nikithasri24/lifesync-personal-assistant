/**
 * ButtonV2 Component
 * Premium button with multiple variants and animations
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-secondary-500)]
    text-white
    shadow-md shadow-primary-500/20
    hover:shadow-lg hover:shadow-primary-500/25
    active:scale-95
  `,
  secondary: `
    bg-white dark:bg-gray-800
    text-[var(--color-primary-500)]
    border-2 border-[var(--color-primary-400)]/40
    hover:bg-[var(--color-primary-50)] dark:hover:bg-gray-700
    hover:border-[var(--color-primary-500)]/60
    active:scale-95
  `,
  ghost: `
    bg-transparent
    text-[var(--text-secondary)]
    hover:bg-[var(--color-gray-100)]/50 dark:hover:bg-gray-800/50
    active:scale-95
  `,
  danger: `
    bg-gradient-to-r from-rose-400 to-rose-500
    text-white
    shadow-md shadow-rose-500/20
    hover:shadow-lg hover:shadow-rose-500/25
    active:scale-95
  `,
  success: `
    bg-gradient-to-r from-teal-400 to-emerald-500
    text-white
    shadow-md shadow-emerald-500/20
    hover:shadow-lg hover:shadow-emerald-500/25
    active:scale-95
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-base rounded-xl',
  lg: 'px-6 py-3.5 text-lg rounded-2xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-semibold
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-4 focus:ring-primary-500/20
  `;

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${widthStyles}
        ${className}
        hover:-translate-y-0.5 active:scale-95
      `.trim().replace(/\s+/g, ' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
};

export default Button;

