import React from 'react';

type Props = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<Props> = ({ title, description, actions, children, className = '' }) => {
  const primaryColor = 'var(--primary, #D4A574)';

  return (
    <div
      className={`rounded-2xl backdrop-blur-sm shadow-sm ${className}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${primaryColor} 30%, transparent)`,
        boxShadow: `0 0 0 1px color-mix(in srgb, ${primaryColor} 20%, transparent)`,
      }}
    >
      {(title || actions) && (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid color-mix(in srgb, ${primaryColor} 10%, transparent)` }}
        >
          <div>
            {title && <div className="text-sm font-semibold" style={{ color: primaryColor }}>{title}</div>}
            {description && (
              <div className="mt-0.5 text-xs" style={{ color: `color-mix(in srgb, ${primaryColor} 60%, transparent)` }}>
                {description}
              </div>
            )}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

export default Card;

