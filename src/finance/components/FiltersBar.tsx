import React from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import useFinanceFilters from '../store/useFinanceFilters';

export const FiltersBar: React.FC<{ onApply?: () => void; onReset?: () => void }> = ({ onApply, onReset }) => {
  const {
    text,
    setText,
    fromISO,
    toISO,
    setFromISO,
    setToISO,
    type,
    setType,
  } = useFinanceFilters();

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-48">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search" label="Search" />
      </div>
      <div>
        <Input type="date" value={fromISO ?? ''} onChange={(e) => setFromISO(e.target.value || undefined)} label="From" />
      </div>
      <div>
        <Input type="date" value={toISO ?? ''} onChange={(e) => setToISO(e.target.value || undefined)} label="To" />
      </div>
      <div>
        <Select
          value={type ?? ''}
          onChange={(e) => setType((e.target.value || undefined) as any)}
          label="Type"
        >
          <option value="">All</option>
          <option value="debit">Debit</option>
          <option value="credit">Credit</option>
        </Select>
      </div>
      <div className="ml-auto flex gap-2">
        <Button variant="outline" onClick={onReset}>Reset</Button>
        <Button onClick={onApply}>Apply</Button>
      </div>
    </div>
  );
};

export default FiltersBar;

