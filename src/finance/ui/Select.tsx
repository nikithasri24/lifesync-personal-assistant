import React from 'react';

type Option = { label: string; value: string };

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options?: Option[];
};

export const Select = React.forwardRef<HTMLSelectElement, Props>(
  ({ label, options, className = '', children, ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm text-slate-600">{label}</label>}
        <select
          ref={ref}
          className={`h-9 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 ${className}`}
          {...rest}
        >
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          {children}
        </select>
      </div>
    );
  }
);

Select.displayName = 'FinanceUISelect';

export default Select;

