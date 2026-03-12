/**
 * QuickLogModal
 * Fast "what did you have?" modal for logging a meal from the fridge pool.
 * Pre-selects the dish and meal type when opened from FridgePoolV2.
 */

import React, { useState, useEffect } from 'react';
import { X, Utensils } from 'lucide-react';
import { format } from 'date-fns';
import type { BatchCookSession, BatchCookDish, MealType } from '../../types';

interface QuickLogModalProps {
  isOpen: boolean;
  session: BatchCookSession | null;
  preSelectedDish?: BatchCookDish;
  preSelectedMealType?: string;
  onClose: () => void;
  onSubmit: (params: {
    batchDishId?: string;
    customName?: string;
    mealType: MealType;
    servingsConsumed: number;
    notes: string;
  }) => Promise<void>;
  isPending?: boolean;
}

const MEAL_TYPES: { id: MealType; label: string; emoji: string }[] = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { id: 'lunch', label: 'Lunch', emoji: '🥗' },
  { id: 'dinner', label: 'Dinner', emoji: '🍽️' },
  { id: 'snack', label: 'Snack', emoji: '🍎' },
];

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  session,
  preSelectedDish,
  preSelectedMealType,
  onClose,
  onSubmit,
  isPending = false,
}) => {
  const [selectedDishId, setSelectedDishId] = useState('');
  const [customName, setCustomName] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [servings, setServings] = useState(1);
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<'pool' | 'custom'>('pool');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedDishId(preSelectedDish?.id ?? '');
      setMealType((preSelectedMealType as MealType) ?? 'lunch');
      setServings(1);
      setNotes('');
      setCustomName('');
      setMode(preSelectedDish ? 'pool' : 'pool');
      setError('');
    }
  }, [isOpen, preSelectedDish, preSelectedMealType]);

  useEffect(() => {
    const handle = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeDishes = session?.dishes.filter(d => d.servingsRemaining > 0) ?? [];
  const selectedDish = activeDishes.find(d => d.id === selectedDishId);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    if (mode === 'pool' && !selectedDishId) { setError('Please select a dish'); return; }
    if (mode === 'custom' && !customName.trim()) { setError('Please enter what you had'); return; }

    await onSubmit({
      batchDishId: mode === 'pool' ? selectedDishId : undefined,
      customName: mode === 'custom' ? customName.trim() : undefined,
      mealType,
      servingsConsumed: servings,
      notes: notes.trim(),
    });
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh', maxWidth: '500px' }}
      >
        {/* Drag handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Utensils className="w-5 h-5" style={{ color: '#C18B5E' }} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">What did you have?</h2>
              <p className="text-xs text-gray-400">{format(new Date(), 'EEEE, MMM d')}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto p-6 space-y-5" style={{ maxHeight: 'calc(85vh - 160px)' }}>

            {/* Meal type */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-600">Meal</label>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPES.map(mt => (
                  <button
                    key={mt.id}
                    type="button"
                    onClick={() => setMealType(mt.id)}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all font-semibold text-xs"
                    style={{
                      borderColor: mealType === mt.id ? '#C18B5E' : '#E5E7EB',
                      backgroundColor: mealType === mt.id ? 'rgba(212,165,116,0.1)' : 'transparent',
                      color: mealType === mt.id ? '#C18B5E' : '#6B7280',
                    }}
                  >
                    <span className="text-xl">{mt.emoji}</span>
                    {mt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode toggle: from pool or custom */}
            {activeDishes.length > 0 && (
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                <button
                  type="button"
                  onClick={() => setMode('pool')}
                  className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: mode === 'pool' ? 'rgba(212,165,116,0.15)' : 'transparent',
                    color: mode === 'pool' ? '#C18B5E' : '#6B7280',
                  }}
                >
                  🥘 From Fridge Pool
                </button>
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className="flex-1 py-2.5 text-sm font-semibold transition-colors border-l border-gray-200"
                  style={{
                    backgroundColor: mode === 'custom' ? 'rgba(212,165,116,0.15)' : 'transparent',
                    color: mode === 'custom' ? '#C18B5E' : '#6B7280',
                  }}
                >
                  ✏️ Something Else
                </button>
              </div>
            )}

            {/* Pool dish picker */}
            {mode === 'pool' && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-600">
                  What's in the fridge?
                </label>
                {activeDishes.length === 0 ? (
                  <p className="text-sm text-gray-400">No dishes left in the fridge pool.</p>
                ) : (
                  <div className="space-y-2">
                    {activeDishes.map(dish => {
                      const name = dish.recipeName ?? dish.customName ?? 'Unnamed';
                      const isSelected = selectedDishId === dish.id;
                      return (
                        <button
                          key={dish.id}
                          type="button"
                          onClick={() => setSelectedDishId(dish.id)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left"
                          style={{
                            borderColor: isSelected ? '#C18B5E' : '#E5E7EB',
                            backgroundColor: isSelected ? 'rgba(212,165,116,0.08)' : 'transparent',
                          }}
                        >
                          <span className="font-semibold text-sm text-gray-800">{name}</span>
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: dish.servingsRemaining <= 1 ? '#FEE2E2' : 'rgba(212,165,116,0.15)',
                              color: dish.servingsRemaining <= 1 ? '#DC2626' : '#C18B5E',
                            }}
                          >
                            {dish.servingsRemaining} left
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Custom entry */}
            {mode === 'custom' && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-600">What did you eat?</label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  placeholder="e.g., Salad from the cafeteria"
                  autoFocus
                />
              </div>
            )}

            {/* Servings */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-600">Servings</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setServings(s => Math.max(1, s - 1))}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 hover:border-terracotta-300 transition-colors"
                >−</button>
                <span className="text-2xl font-bold w-8 text-center" style={{ color: '#C18B5E' }}>{servings}</span>
                <button
                  type="button"
                  onClick={() => setServings(s => Math.min(selectedDish?.servingsRemaining ?? 10, s + 1))}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 hover:border-terracotta-300 transition-colors"
                >+</button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-600">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="Add it to rice, extra spicy, etc."
              />
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
            >
              {isPending ? 'Logging...' : 'Log Meal ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickLogModal;
