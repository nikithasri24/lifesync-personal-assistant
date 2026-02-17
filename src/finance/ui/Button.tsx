import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ className = '', variant = 'default', size = 'md', ...rest }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-9 px-4 text-sm',
      lg: 'h-10 px-6',
    } as const;
    const variants = {
      default: 'text-white focus:ring-[#E5B88A]',
      outline: 'border border-[#D4C5B0] hover:bg-[#F5F0EA]',
      ghost: 'hover:bg-[#F5F0EA]',
    } as const;

    // Terracotta gradient for default variant
    const defaultGradient = 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)';
    const style = variant === 'default' ? { background: defaultGradient, ...rest.style } : rest.style;

    return (
      <button
        ref={ref}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        {...rest}
        style={style}
      />
    );
  }
);

Button.displayName = 'FinanceUIButton';

export default Button;

