import React from 'react';

type Props = { value: number; className?: string };

export const Progress: React.FC<Props> = ({ value, className = '' }) => {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 w-full rounded-full bg-slate-200 ${className}`}>
      <div className="h-2 rounded-full bg-slate-900" style={{ width: `${v}%` }} />
    </div>
  );
};

export default Progress;

