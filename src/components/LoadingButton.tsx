/**
 * LoadingButton Component
 * A button with built-in loading state and double-click prevention
 */

import React, { type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
};

const sizeStyles = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-6 py-3',
};

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  className = '',
  onClick,
  ...props
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isProcessing || isLoading || disabled) {
      e.preventDefault();
      return;
    }

    setIsProcessing(true);
    try {
      await onClick?.(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = disabled || isLoading || isProcessing;
  const showLoading = isLoading || isProcessing;

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${showLoading ? 'cursor-wait' : ''}
        ${className}
      `}
    >
      {showLoading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      {showLoading && loadingText ? loadingText : children}
    </button>
  );
};

export default LoadingButton;
