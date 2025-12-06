import React from 'react';
import { Select } from '../ui/Select';

export const MonthPicker: React.FC<{
  value: string;
  onChange: (m: string) => void;
  months: string[];
}> = ({ value, onChange, months }) => {
  return (
    <Select label="Month" value={value} onChange={(e) => onChange(e.target.value)}>
      {months.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </Select>
  );
};

export default MonthPicker;

