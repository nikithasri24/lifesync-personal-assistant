import React from 'react';

type Props = { value: number; max?: number; className?: string };

export const Progress: React.FC<Props> = ({ value, max = 100, className = '' }) => {
  const percent = max > 0 ? (value / max) * 100 : 0;
  const v = Math.max(0, Math.min(100, percent));
  return (
    <div className={`h-2 w-full rounded-full bg-slate-200 ${className}`}>
      <div className="h-2 rounded-full bg-slate-900" style={{ width: `${v}%` }} />
    </div>
  );
};

export default Progress;

