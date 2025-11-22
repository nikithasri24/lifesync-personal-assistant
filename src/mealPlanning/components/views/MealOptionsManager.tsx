import React, { useState } from 'react';
import { useAppStore } from '../../../stores/useAppStore';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export function MealOptionsManager(): React.JSX.Element {
  const { mealOptions, addMealOption, removeMealOption } = useAppStore();
  const [inputs, setInputs] = useState({ breakfast: '', lunch: '', dinner: '', snack: '' });

  const sections: Array<{ key: MealType; label: string; color: string }> = [
    { key: 'breakfast', label: 'Breakfast', color: 'text-amber-600' },
    { key: 'lunch', label: 'Lunch', color: 'text-emerald-600' },
    { key: 'dinner', label: 'Dinner', color: 'text-indigo-600' },
    { key: 'snack', label: 'Snacks', color: 'text-pink-600' },
  ];

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {sections.map(({ key, label, color }) => (
        <div key={key} className="rounded-md border border-slate-200 p-3">
          <h3 className={`text-sm font-semibold ${color}`}>{label}</h3>
          <div className="mt-2 flex gap-2">
            <input
              value={inputs[key]}
              onChange={(e) => setInputs((s) => ({ ...s, [key]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const v = inputs[key].trim();
                  if (v) {
                    addMealOption(key, v);
                    setInputs((s) => ({ ...s, [key]: '' }));
                  }
                }
              }}
              placeholder={`Add ${label.toLowerCase()} option…`}
              className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => {
                const v = inputs[key].trim();
                if (v) {
                  addMealOption(key, v);
                  setInputs((s) => ({ ...s, [key]: '' }));
                }
              }}
              className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Add
            </button>
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {(mealOptions[key] || []).map((name) => (
              <li
                key={name}
                className="group inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/meal-option', name);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                title="Drag into the weekly planner to add"
              >
                <span>{name}</span>
                <button
                  type="button"
                  onClick={() => removeMealOption(key, name)}
                  className="text-slate-400 hover:text-rose-600"
                  title="Remove"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
