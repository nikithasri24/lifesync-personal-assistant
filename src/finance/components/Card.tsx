import React from 'react';

type Props = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<Props> = ({ title, description, actions, children, className = '' }) => {
  return (
    <div className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 ring-primary/20 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-primary/10 px-4 py-3">
          <div>
            {title && <div className="text-sm font-semibold text-primary">{title}</div>}
            {description && <div className="mt-0.5 text-xs text-primary/60">{description}</div>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

export default Card;

