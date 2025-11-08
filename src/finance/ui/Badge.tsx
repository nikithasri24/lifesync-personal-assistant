import React from 'react';

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'success' | 'warning' | 'destructive';
};

export const Badge: React.FC<Props> = ({ className = '', variant = 'default', ...rest }) => {
  const colors = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    destructive: 'bg-rose-100 text-rose-800',
  } as const;
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${colors[variant]} ${className}`} {...rest} />;
};

export default Badge;

