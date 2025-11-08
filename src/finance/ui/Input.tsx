import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };

export const Input = React.forwardRef<HTMLInputElement, Props>(({ className = '', label, ...rest }, ref) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-slate-600">{label}</label>}
      <input
        ref={ref}
        className={`h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 ${className}`}
        {...rest}
      />
    </div>
  );
});

Input.displayName = 'FinanceUIInput';

export default Input;

