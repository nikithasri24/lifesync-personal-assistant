/**
 * PaycheckBreakdown
 * Shows gross pay → deductions → net pay for a given month.
 * Displayed on the Finance Dashboard when paystub data is available.
 */

import React from 'react';
import type { Paystub } from '../data';
import { formatCurrency } from '../utils/currency';

interface Props {
  paystub: Paystub;
}

const TYPE_COLORS: Record<string, string> = {
  pretax:  '#8b5cf6',  // purple
  tax:     '#ef4444',  // red
  posttax: '#f59e0b',  // amber
};

const TYPE_LABELS: Record<string, string> = {
  pretax:  'Pre-tax',
  tax:     'Tax',
  posttax: 'Post-tax',
};

export const PaycheckBreakdown: React.FC<Props> = ({ paystub }) => {
  const totalDeductions = paystub.deductions.reduce((s, d) => s + d.amount, 0);
  const takeHomeRate = paystub.grossPay > 0 ? (paystub.netPay / paystub.grossPay) * 100 : 0;

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Nikki's Paycheck Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {Math.round(takeHomeRate)}% take-home of gross
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Gross</div>
            <div className="text-base font-bold text-slate-900">{formatCurrency(paystub.grossPay)}</div>
          </div>
        </div>
      </div>

      {/* Overall bar */}
      <div className="px-5 pt-3 pb-2">
        <div className="w-full h-3 rounded-full overflow-hidden flex">
          {paystub.deductions.map((d, i) => (
            <div
              key={i}
              style={{
                width: `${(d.amount / paystub.grossPay) * 100}%`,
                backgroundColor: TYPE_COLORS[d.type] ?? '#94a3b8',
                opacity: 0.85,
              }}
            />
          ))}
          {/* Net pay portion */}
          <div
            style={{
              flex: 1,
              background: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-slate-400">
          <span>Deductions {formatCurrency(totalDeductions)}</span>
          <span className="font-medium" style={{ color: '#C18B5E' }}>Net {formatCurrency(paystub.netPay)}</span>
        </div>
      </div>

      {/* Deduction rows */}
      <div className="px-5 pb-4 space-y-1.5 mt-1">
        {paystub.deductions.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: TYPE_COLORS[d.type] ?? '#94a3b8' }}
              />
              <span className="text-slate-700">{d.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded text-slate-500"
                style={{ backgroundColor: '#f3f4f6' }}>
                {TYPE_LABELS[d.type]}
              </span>
            </div>
            <span className="font-medium text-slate-700">−{formatCurrency(d.amount)}</span>
          </div>
        ))}

        {/* Net pay row */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #D4A574, #C18B5E)' }} />
            <span className="font-semibold text-slate-900">Net Pay (take-home)</span>
          </div>
          <span className="font-bold" style={{ color: '#C18B5E' }}>{formatCurrency(paystub.netPay)}</span>
        </div>
      </div>
    </div>
  );
};
