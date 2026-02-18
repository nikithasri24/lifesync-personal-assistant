/**
 * WeeklyRoutineTable - Simple weekly skincare routine table
 * Shows Mon-Sun with AM and PM columns, text-based routines
 */

import React, { useState, useMemo } from 'react';
import { Edit2, Check, X, Sun, Moon } from 'lucide-react';
import { useWeeklyRoutines, useUpsertWeeklyRoutine } from '../../hooks/useSkincareQuery';
import type { SkincareWeeklyRoutine } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';

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

  const colors = useThemeColors();

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 px-2 py-1 text-sm rounded focus:outline-none focus:ring-2"
          style={{
            borderWidth: '1px',
            borderColor: colors.accent.end,
            backgroundColor: colors.bg.white,
            color: colors.text.primary,
          }}
          placeholder={timeSlot === 'am' ? 'e.g., Cleanser + Vitamin C + SPF' : 'e.g., Oil Cleanser → Retinol → Moisturizer'}
          autoFocus
          disabled={isSaving}
        />
        <button
          onClick={onSave}
          disabled={isSaving}
          className="p-1 rounded transition-colors"
          style={{
            color: '#059669',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
          }}
          title="Save"
          aria-label="Save"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="p-1 rounded transition-colors"
          style={{
            color: colors.text.tertiary,
            backgroundColor: colors.bg.secondary,
          }}
          title="Cancel"
          aria-label="Cancel"
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
        <span className="text-sm" style={{ color: colors.text.primary }}>
          {value}
        </span>
      ) : (
        <span className="text-sm italic" style={{ color: colors.text.tertiary }}>
          Click to add routine
        </span>
      )}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute right-0 top-0 p-1 transition-colors"
          style={{ color: colors.text.tertiary }}
          title="Edit"
          aria-label="Edit routine"
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
  const colors = useThemeColors();
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
      <div
        className={`rounded-2xl p-8 ${className}`}
        style={{ backgroundColor: colors.bg.white }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 rounded w-1/3" style={{ backgroundColor: colors.bg.secondary }}></div>
          <div className="h-64 rounded" style={{ backgroundColor: colors.bg.secondary }}></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-sm ${className}`}
      style={{
        backgroundColor: colors.bg.white,
        borderWidth: '1px',
        borderColor: colors.border.light,
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{
          background: `linear-gradient(135deg, ${colors.accent.start}10 0%, ${colors.accent.end}10 100%)`,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
          Weekly Skincare Routine
        </h2>
        <p className="text-sm mt-1" style={{ color: colors.text.tertiary }}>
          Click any cell to edit your routine
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr style={{ backgroundColor: colors.bg.secondary }}>
              <th
                className="px-3 py-3 text-left text-sm font-semibold w-16"
                style={{ color: colors.text.secondary }}
              >
                Day
              </th>
              <th
                className="px-3 py-3 text-left text-sm font-semibold"
                style={{ color: colors.text.secondary }}
              >
                <div className="flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#F59E0B' }} />
                  <span className="whitespace-nowrap">Morning</span>
                </div>
              </th>
              <th
                className="px-3 py-3 text-left text-sm font-semibold"
                style={{ color: colors.text.secondary }}
              >
                <div className="flex items-center gap-1.5">
                  <Moon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: colors.accent.end }} />
                  <span className="whitespace-nowrap">Night</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody style={{ borderTop: `1px solid ${colors.border.light}` }}>
            {DAYS.map(({ value: dayValue, label, full }) => {
              const routine = routinesByDay.get(dayValue);
              const isToday = today === dayValue;

              return (
                <tr
                  key={dayValue}
                  style={{
                    backgroundColor: isToday
                      ? `${colors.accent.start}15`
                      : colors.bg.white,
                    borderBottom: `1px solid ${colors.border.light}`,
                  }}
                >
                  {/* Day label */}
                  <td className="px-3 py-3">
                    <div
                      className="font-semibold text-sm whitespace-nowrap"
                      style={{ color: isToday ? colors.accent.end : colors.text.primary }}
                    >
                      {label}
                      {isToday && (
                        <div className="text-xs mt-0.5" style={{ color: colors.accent.end }}>
                          Today
                        </div>
                      )}
                    </div>
                  </td>

                  {/* AM Cell */}
                  <td className="px-3 py-3">
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
                  <td className="px-3 py-3">
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
