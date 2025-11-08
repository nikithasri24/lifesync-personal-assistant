import React from 'react';

type Props = {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<Props> = ({ title, actions, children, className = '' }) => {
  return (
    <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          {title && <div className="text-sm font-semibold text-slate-700">{title}</div>}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

export default Card;

