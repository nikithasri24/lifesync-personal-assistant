/**
 * WeeklyGridView - Grid-style weekly skincare planner (similar to meal planning)
 * Shows 7 days in rows with AM/PM columns
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Droplet, Sun, Moon, Plus } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import {
  useSkincareProducts,
  useSkincareRoutines,
  useCreateRoutine,
  useUpdateRoutine,
} from '../../hooks/useSkincareQuery';
import type { SkincareRoutine, SkincareProduct, SkincareRoutineInput } from '../types';
import RoutineEditorModal from './RoutineEditorModal';

interface WeeklyGridViewProps {
  className?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const TIME_SLOTS = ['AM', 'PM'] as const;

const WeeklyGridView: React.FC<WeeklyGridViewProps> = ({ className = '' }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingRoutine, setEditingRoutine] = useState<SkincareRoutine | null>(null);
  const [creatingRoutine, setCreatingRoutine] = useState<{ day: number; timeSlot: 'AM' | 'PM' } | null>(null);

  // Fetch data
  const { data: products = [] } = useSkincareProducts();
  const { data: routines = [] } = useSkincareRoutines({ isActive: true });

  // Mutations
  const createRoutineMutation = useCreateRoutine();
  const updateRoutineMutation = useUpdateRoutine();

  // Calculate week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);
    const dayOfWeek = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      return date;
    });
  }, [weekOffset]);

  // Get routines for a specific day and time
  const getRoutinesForDayAndTime = (dayOfWeek: number, timeSlot: 'AM' | 'PM') => {
    return routines.filter((routine) => {
      if (routine.routineType !== timeSlot) return false;
      if (!routine.daysOfWeek || routine.daysOfWeek.length === 0) return true;
      return routine.daysOfWeek.includes(dayOfWeek);
    });
  };

  // Get products for a routine
  const getRoutineProducts = (routine: SkincareRoutine) => {
    return routine.productIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean) as SkincareProduct[];
  };

  // Handle creating a new routine
  const handleCreateRoutine = (day: number, timeSlot: 'AM' | 'PM') => {
    setCreatingRoutine({ day, timeSlot });
  };

  // Handle editing existing routine
  const handleEditRoutine = (routine: SkincareRoutine) => {
    setEditingRoutine(routine);
  };

  // Save new routine
  const handleSaveNewRoutine = async (routineData: Partial<SkincareRoutineInput>) => {
    if (!creatingRoutine) return;

    const dayName = DAYS_OF_WEEK.find(d => d.value === creatingRoutine.day)?.label || '';

    await createRoutineMutation.mutateAsync({
      name: `${dayName} ${creatingRoutine.timeSlot} Routine`,
      routineType: creatingRoutine.timeSlot,
      isActive: true,
      productIds: routineData.productIds || [],
      daysOfWeek: [creatingRoutine.day],
      reminderEnabled: routineData.reminderEnabled || false,
      reminderTime: routineData.reminderTime,
      notes: routineData.notes,
    });

    setCreatingRoutine(null);
  };

  // Update existing routine
  const handleUpdateRoutine = async (routineData: Partial<SkincareRoutine>) => {
    if (!editingRoutine) return;

    await updateRoutineMutation.mutateAsync({
      id: editingRoutine.id,
      updates: routineData,
    });

    setEditingRoutine(null);
  };

  // Render products in a cell
  const renderProductsInCell = (products: SkincareProduct[]) => {
    if (products.length === 0) {
      return (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">No routine</p>
      );
    }

    return (
      <ol className="space-y-1.5">
        {products.map((product, idx) => (
          <li key={product.id} className="flex items-start gap-1.5 text-xs">
            <span className="text-gray-400 dark:text-gray-500 font-medium min-w-[16px] text-[10px]">{idx + 1}.</span>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-gray-100 font-medium truncate" title={product.name}>
                {product.name}
              </p>
              {product.brand && (
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate" title={product.brand}>
                  {product.brand}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    );
  };




  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      {/* Header with Week Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Droplet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Weekly Skincare Schedule</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Previous week"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>

          <div className="text-center min-w-[200px]">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d, yyyy')}
            </p>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
              >
                Back to this week
              </button>
            )}
          </div>

          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Next week"
          >
            <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        {/* Header row */}
        <div className="grid" style={{ gridTemplateColumns: '140px repeat(2, minmax(200px, 1fr))' }}>
          <div className="p-3 border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky left-0 z-20" />
          {TIME_SLOTS.map((timeSlot) => (
            <div
              key={timeSlot}
              className="p-3 border-b border-r border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 text-center flex items-center justify-center gap-2"
            >
              {timeSlot === 'AM' ? (
                <>
                  <Sun className="h-4 w-4 text-amber-500" />
                  Morning
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-500" />
                  Night
                </>
              )}
            </div>
          ))}
        </div>

        {/* Day rows */}
        {weekDates.map((date, index) => {
          const dayOfWeek = date.getDay();
          const dayInfo = DAYS_OF_WEEK.find(d => d.value === dayOfWeek);
          const isToday = isSameDay(date, new Date());

          return (
            <div key={index} className="grid" style={{ gridTemplateColumns: '140px repeat(2, minmax(200px, 1fr))' }}>
              {/* Day label */}
              <div
                className={`relative p-3 border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-medium flex flex-col justify-center sticky left-0 z-10 ${
                  isToday ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-gray-800 dark:text-gray-200'
                }`}
              >
                {isToday && (
                  <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 rounded-r-sm" />
                )}
                <div>{dayInfo?.short}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{format(date, 'MMM d')}</div>
              </div>

              {/* AM and PM cells */}
              {TIME_SLOTS.map((timeSlot) => {
                const routinesForSlot = getRoutinesForDayAndTime(dayOfWeek, timeSlot);
                const productsForSlot = routinesForSlot.flatMap(getRoutineProducts);
                const hasContent = productsForSlot.length > 0;

                return (
                  <div
                    key={`${index}-${timeSlot}`}
                    className={`group relative p-3 border-b border-r border-gray-200 dark:border-gray-700 min-h-[120px] ${
                      hasContent
                        ? timeSlot === 'AM'
                          ? 'bg-amber-50/30 dark:bg-amber-900/20'
                          : 'bg-indigo-50/30 dark:bg-indigo-900/20'
                        : 'bg-white dark:bg-gray-800'
                    } ${isToday ? 'border-l-2 border-l-emerald-300 dark:border-l-emerald-500' : ''}`}
                  >
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {routinesForSlot.length > 0 && (
                        <button
                          onClick={() => handleEditRoutine(routinesForSlot[0])}
                          className="p-1 rounded bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 shadow-sm"
                          title="Edit routine"
                        >
                          <Edit2 className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                        </button>
                      )}
                      <button
                        onClick={() => handleCreateRoutine(dayOfWeek, timeSlot)}
                        className={`p-1 rounded border shadow-sm ${
                          timeSlot === 'AM'
                            ? 'bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800/50 border-amber-200 dark:border-amber-700'
                            : 'bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 border-indigo-200 dark:border-indigo-700'
                        }`}
                        title={routinesForSlot.length > 0 ? "Add another routine" : "Add routine"}
                      >
                        <Plus className={`h-3 w-3 ${timeSlot === 'AM' ? 'text-amber-700 dark:text-amber-300' : 'text-indigo-700 dark:text-indigo-300'}`} />
                      </button>
                    </div>

                    {/* Products list */}
                    <div className="pr-16">
                      {renderProductsInCell(productsForSlot)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Edit Routine Modal */}
      {editingRoutine && (
        <RoutineEditorModal
          routine={editingRoutine}
          allProducts={products}
          onSave={handleUpdateRoutine}
          onDelete={() => {
            setEditingRoutine(null);
          }}
          onClose={() => setEditingRoutine(null)}
        />
      )}

      {/* Create Routine Modal */}
      {creatingRoutine && (
        <RoutineEditorModal
          routine={{
            id: '',
            userId: '',
            name: `${DAYS_OF_WEEK.find(d => d.value === creatingRoutine.day)?.label} ${creatingRoutine.timeSlot} Routine`,
            routineType: creatingRoutine.timeSlot,
            isActive: true,
            productIds: [],
            daysOfWeek: [creatingRoutine.day],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }}
          allProducts={products}
          onSave={handleSaveNewRoutine}
          onDelete={() => setCreatingRoutine(null)}
          onClose={() => setCreatingRoutine(null)}
        />
      )}
    </div>
  );
};

export default WeeklyGridView;
