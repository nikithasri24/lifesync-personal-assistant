/**
 * InputV2 Component
 * Form input with terracotta focus state and consistent styling
 */

import React, { forwardRef } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

export interface InputV2Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline';
}

export const InputV2 = forwardRef<HTMLInputElement, InputV2Props>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const colors = useThemeColors();
    const inputId = id || `input-${Math.random().toString(36).substring(7)}`;
    const hasError = Boolean(error);

    const variantStyles = {
      default: {
        backgroundColor: colors.bg.white,
        border: `1px solid ${hasError ? '#EF4444' : colors.border.light}`,
      },
      filled: {
        backgroundColor: colors.bg.secondary,
        border: `1px solid ${hasError ? '#EF4444' : 'transparent'}`,
      },
      outline: {
        backgroundColor: 'transparent',
        border: `2px solid ${hasError ? '#EF4444' : colors.border.medium}`,
      },
    };

    const styles = variantStyles[variant];

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium mb-2"
            style={{ color: colors.text.primary }}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-3 rounded-xl
              text-base font-normal
              transition-all duration-200
              focus:outline-none focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
            `}
            style={{
              ...styles,
              color: colors.text.primary,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.accent.start;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accent.start}20`;
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = hasError ? '#EF4444' : colors.border.light;
              e.currentTarget.style.boxShadow = 'none';
              props.onBlur?.(e);
            }}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm font-medium"
            style={{ color: '#EF4444' }}
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm"
            style={{ color: colors.text.tertiary }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

InputV2.displayName = 'InputV2';

export default InputV2;
