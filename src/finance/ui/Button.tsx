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
      default: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-400',
      outline: 'border border-slate-300 hover:bg-slate-50',
      ghost: 'hover:bg-slate-100',
    } as const;
    return (
      <button ref={ref} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest} />
    );
  }
);

Button.displayName = 'FinanceUIButton';

export default Button;

