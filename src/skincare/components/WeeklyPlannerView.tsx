/**
 * WeeklyPlannerView - Journal-style weekly skincare planner
 * Editable template with inline editing
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Droplet, Sun, Moon, Plus, X } from 'lucide-react';
import {
  useSkincareProducts,
  useSkincareRoutines,
  useCreateRoutine,
  useUpdateRoutine,
} from '../../hooks/useSkincareQuery';
import type { SkincareRoutine, SkincareProduct, SkincareRoutineInput } from '../types';
import RoutineEditorModal from './RoutineEditorModal';

interface WeeklyPlannerViewProps {
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

const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({ className = '' }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [skinType, setSkinType] = useState('dry skin');
  const [concerns, setConcerns] = useState('Dryness, Dullness, Hyperpigmentation, Acne Marks, Texture');
  const [editingHeader, setEditingHeader] = useState(false);
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

  // Render products list as vertical list
  const renderProductsList = (products: SkincareProduct[]) => {
    if (products.length === 0) {
      return (
        <p className="text-sm text-gray-500 italic">Rest day - no products scheduled</p>
      );
    }

    return (
      <ol className="space-y-2">
        {products.map((product, idx) => (
          <li key={product.id} className="flex items-start gap-2 text-sm">
            <span className="text-gray-400 font-medium min-w-[20px]">{idx + 1}.</span>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">{product.name}</p>
              {product.brand && (
                <p className="text-xs text-gray-500">{product.brand}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    );
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

  return (
    <div className={`bg-gray-50 rounded-2xl p-8 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        {/* Title */}
        <div className="flex items-center gap-3">
          <h2 className="text-5xl font-serif italic text-gray-900">Weekly Planner</h2>
          <Droplet className="h-10 w-10 text-emerald-600" />
        </div>

        {/* Skin Type & Concerns */}
        {editingHeader ? (
          <div className="max-w-md space-y-2">
            <input
              type="text"
              value={skinType}
              onChange={(e) => setSkinType(e.target.value)}
              placeholder="Skin type"
              className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
            <textarea
              value={concerns}
              onChange={(e) => setConcerns(e.target.value)}
              placeholder="Concerns"
              rows={2}
              className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
            />
            <button
              onClick={() => setEditingHeader(false)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="max-w-md relative group text-right">
            <p className="text-lg font-semibold text-gray-900 mb-2">
              skin type: {skinType.toLowerCase()}
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              Concerns: {concerns}
            </p>
            <button
              onClick={() => setEditingHeader(true)}
              className="absolute -right-8 top-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setWeekOffset((prev) => prev - 1)}
          className="p-3 rounded-xl bg-white hover:bg-gray-100 transition-colors border border-gray-300 shadow-sm"
        >
          <ChevronLeft className="h-5 w-5 text-gray-900" />
        </button>
        <div className="text-center">
          <p className="text-base text-gray-900 font-medium">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 font-medium"
            >
              Back to this week
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset((prev) => prev + 1)}
          className="p-3 rounded-xl bg-white hover:bg-gray-100 transition-colors border border-gray-300 shadow-sm"
        >
          <ChevronRight className="h-5 w-5 text-gray-900" />
        </button>
      </div>

      {/* Day Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DAYS_OF_WEEK.map((day, index) => {
          const dayOfWeek = day.value;
          const dateStr = weekDates[index].toISOString().split('T')[0];
          const isToday = dateStr === new Date().toISOString().split('T')[0];

          const amRoutines = getRoutinesForDayAndTime(dayOfWeek, 'AM');
          const pmRoutines = getRoutinesForDayAndTime(dayOfWeek, 'PM');

          const amProducts = amRoutines.flatMap(getRoutineProducts);
          const pmProducts = pmRoutines.flatMap(getRoutineProducts);

          return (
            <div
              key={day.value}
              className={`bg-white border-2 rounded-2xl p-6 relative shadow-md ${
                isToday
                  ? 'border-emerald-500 ring-2 ring-emerald-200'
                  : 'border-gray-200'
              }`}
            >
              {/* Day Label */}
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{day.label}</h3>
                {isToday && (
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                    Today
                  </span>
                )}
              </div>

              {/* Morning Routine */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-amber-500" />
                    <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      MORNING
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {amRoutines.length > 0 && (
                      <button
                        onClick={() => handleEditRoutine(amRoutines[0])}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        title="Edit morning routine"
                      >
                        <Edit2 className="h-4 w-4 text-gray-700" />
                      </button>
                    )}
                    <button
                      onClick={() => handleCreateRoutine(dayOfWeek, 'AM')}
                      className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 transition-colors"
                      title={amRoutines.length > 0 ? "Add another morning routine" : "Add morning routine"}
                    >
                      <Plus className="h-4 w-4 text-emerald-700" />
                    </button>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  {renderProductsList(amProducts)}
                </div>
              </div>

              {/* Night Routine */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-indigo-500" />
                    <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      NIGHT:
                    </p>
                  </div>
                  {pmRoutines.length > 0 ? (
                    <button
                      onClick={() => handleEditRoutine(pmRoutines[0])}
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                      title="Edit night routine"
                    >
                      <Edit2 className="h-4 w-4 text-gray-700" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCreateRoutine(dayOfWeek, 'PM')}
                      className="p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 transition-colors"
                      title="Add night routine"
                    >
                      <Plus className="h-4 w-4 text-indigo-700" />
                    </button>
                  )}
                </div>
                <div className="text-base text-gray-900 leading-relaxed">
                  {renderProductsList(pmProducts)}
                </div>
              </div>

              {/* Decorative corner accent */}
              {index % 2 === 0 && (
                <div className="absolute bottom-3 right-3 opacity-5">
                  <Droplet className="h-8 w-8 text-emerald-600" />
                </div>
              )}
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
            // Handle delete if needed
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

export default WeeklyPlannerView;
