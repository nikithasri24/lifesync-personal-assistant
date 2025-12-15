import React, { type ReactNode } from 'react';

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type Props<T extends { id: string }> = {
  columns: Column<T>[];
  rows: T[];
  getKey?: (row: T) => string;
};

export function DataTable<T extends { id: string }>({ columns, rows, getKey }: Props<T>): React.ReactElement {
  return (
    <div className="overflow-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className={`px-3 py-2 font-medium ${c.className ?? ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={getKey ? getKey(r) : r.id} className="border-t">
              {columns.map((c) => (
                <td key={String(c.key)} className={`px-3 py-2 ${c.className ?? ''}`}>
                  {c.render ? c.render(r) : ((r as Record<string, unknown>)[String(c.key)] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;

