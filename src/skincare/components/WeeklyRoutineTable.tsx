/**
 * WeeklyRoutineTable - Simple weekly skincare routine table
 * Shows Mon-Sun with AM and PM columns, text-based routines
 */

import React, { useState, useMemo } from 'react';
import { Edit2, Check, X, Sun, Moon } from 'lucide-react';
import { useWeeklyRoutines, useUpsertWeeklyRoutine } from '../../hooks/useSkincareQuery';
import type { SkincareWeeklyRoutine } from '../types';

interface WeeklyRoutineTableProps {
  className?: string;
}

// =====================================================
// ROUTINE CELL COMPONENT
// =====================================================

interface RoutineCellProps {
  value?: string;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isSaving: boolean;
  timeSlot: 'am' | 'pm';
}

function RoutineCell({
  value,
  isEditing,
  editValue,
  onEditValueChange,
  onEdit,
  onSave,
  onCancel,
  onKeyDown,
  isSaving,
  timeSlot,
}: RoutineCellProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 px-2 py-1 text-sm border border-purple-400 dark:border-purple-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder={timeSlot === 'am' ? 'e.g., Cleanser + Vitamin C + SPF' : 'e.g., Oil Cleanser → Retinol → Moisturizer'}
          autoFocus
          disabled={isSaving}
        />
        <button
          onClick={onSave}
          disabled={isSaving}
          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
          title="Save"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="group relative min-h-[32px] cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onEdit}
    >
      {value ? (
        <span className="text-sm text-gray-900 dark:text-gray-100">{value}</span>
      ) : (
        <span className="text-sm text-gray-400 dark:text-gray-500 italic">Click to add routine</span>
      )}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute right-0 top-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Edit"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

const DAYS = [
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' },
  { value: 0, label: 'Sun', full: 'Sunday' },
];

const WeeklyRoutineTable: React.FC<WeeklyRoutineTableProps> = ({ className = '' }) => {
  const { data: weeklyRoutines = [], isLoading } = useWeeklyRoutines();
  const upsertMutation = useUpsertWeeklyRoutine();

  // Editing state
  const [editingCell, setEditingCell] = useState<{ day: number; field: 'am' | 'pm' } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Map routines by day for quick lookup
  const routinesByDay = useMemo(() => {
    const map = new Map<number, SkincareWeeklyRoutine>();
    weeklyRoutines.forEach((r) => map.set(r.dayOfWeek, r));
    return map;
  }, [weeklyRoutines]);

  // Get today's day of week
  const today = new Date().getDay();

  const handleEdit = (day: number, field: 'am' | 'pm') => {
    const routine = routinesByDay.get(day);
    const currentValue = field === 'am' ? routine?.amRoutine || '' : routine?.pmRoutine || '';
    setEditValue(currentValue);
    setEditingCell({ day, field });
  };

  const handleSave = async () => {
    if (!editingCell) return;

    const { day, field } = editingCell;
    const existing = routinesByDay.get(day);

    await upsertMutation.mutateAsync({
      dayOfWeek: day,
      amRoutine: field === 'am' ? editValue : existing?.amRoutine,
      pmRoutine: field === 'pm' ? editValue : existing?.pmRoutine,
      notes: existing?.notes,
    });

    setEditingCell(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-8 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Weekly Skincare Routine</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Click any cell to edit your routine</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">Day</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" />
                  Morning (AM)
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-500" />
                  Night (PM)
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {DAYS.map(({ value: dayValue, label, full }) => {
              const routine = routinesByDay.get(dayValue);
              const isToday = today === dayValue;

              return (
                <tr
                  key={dayValue}
                  className={isToday ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-white dark:bg-gray-800'}
                >
                  {/* Day label */}
                  <td className="px-4 py-3">
                    <div className={`font-medium ${isToday ? 'text-purple-700 dark:text-purple-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {label}
                      {isToday && <span className="ml-2 text-xs text-purple-500">(Today)</span>}
                    </div>
                  </td>

                  {/* AM Cell */}
                  <td className="px-4 py-3">
                    <RoutineCell
                      value={routine?.amRoutine}
                      isEditing={editingCell?.day === dayValue && editingCell?.field === 'am'}
                      editValue={editValue}
                      onEditValueChange={setEditValue}
                      onEdit={() => handleEdit(dayValue, 'am')}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      onKeyDown={handleKeyDown}
                      isSaving={upsertMutation.isPending}
                      timeSlot="am"
                    />
                  </td>

                  {/* PM Cell */}
                  <td className="px-4 py-3">
                    <RoutineCell
                      value={routine?.pmRoutine}
                      isEditing={editingCell?.day === dayValue && editingCell?.field === 'pm'}
                      editValue={editValue}
                      onEditValueChange={setEditValue}
                      onEdit={() => handleEdit(dayValue, 'pm')}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      onKeyDown={handleKeyDown}
                      isSaving={upsertMutation.isPending}
                      timeSlot="pm"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyRoutineTable;
