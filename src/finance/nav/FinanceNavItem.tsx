import React from 'react';

export const FinanceNavItem: React.FC = () => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const active = pathname.startsWith('/finance');
  return (
    <a
      href="/finance"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md ${
        active ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v4H3z"></path>
        <path d="M8 7v14"></path>
        <path d="M16 7v14"></path>
        <path d="M3 11h18"></path>
      </svg>
      <span>Finance</span>
    </a>
  );
};

export default FinanceNavItem;
