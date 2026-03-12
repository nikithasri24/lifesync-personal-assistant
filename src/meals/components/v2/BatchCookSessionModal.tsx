/**
 * BatchCookSessionModal
 * Form to create a new batch cook session ("Sunday Prep").
 * Lets you name the session, set the cook date, and list all the dishes
 * you made along with how many servings of each.
 */

import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, ChefHat } from 'lucide-react';
import { format } from 'date-fns';
import type { BatchCookSessionInput } from '../../types';
import type { Recipe } from '@/hooks/useMealPlanningQuery';

interface DishRow {
  recipeId: string;
  customName: string;
  servingsCooked: number;
  notes: string;
}

interface BatchCookSessionModalProps {
  isOpen: boolean;
  recipes: Recipe[];
  onClose: () => void;
  onSubmit: (input: BatchCookSessionInput) => Promise<void>;
  isPending?: boolean;
}

const EMPTY_DISH: DishRow = { recipeId: '', customName: '', servingsCooked: 4, notes: '' };

export const BatchCookSessionModal: React.FC<BatchCookSessionModalProps> = ({
  isOpen,
  recipes,
  onClose,
  onSubmit,
  isPending = false,
}) => {
  const [name, setName] = useState('');
  const [cookDate, setCookDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [dishes, setDishes] = useState<DishRow[]>([{ ...EMPTY_DISH }]);
  const [error, setError] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setName('');
      setCookDate(format(new Date(), 'yyyy-MM-dd'));
      setNotes('');
      setDishes([{ ...EMPTY_DISH }]);
      setError('');
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handle = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const addDish = (): void => setDishes(prev => [...prev, { ...EMPTY_DISH }]);
  const removeDish = (i: number): void => setDishes(prev => prev.filter((_, idx) => idx !== i));
  const updateDish = (i: number, field: keyof DishRow, value: string | number): void => {
    setDishes(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));
  };

  const handleRecipeChange = (i: number, recipeId: string): void => {
    const recipe = recipes.find(r => r.id === recipeId);
    setDishes(prev => prev.map((d, idx) =>
      idx === i
        ? { ...d, recipeId, customName: '', servingsCooked: recipe?.servings ?? 4 }
        : d
    ));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Session name is required'); return; }
    const validDishes = dishes.filter(d => d.recipeId || d.customName.trim());
    if (validDishes.length === 0) { setError('Add at least one dish'); return; }

    await onSubmit({
      name: name.trim(),
      cookDate,
      notes: notes.trim() || undefined,
      dishes: validDishes.map(d => ({
        recipeId: d.recipeId || undefined,
        customName: !d.recipeId ? d.customName.trim() : undefined,
        servingsCooked: d.servingsCooked,
        notes: d.notes.trim() || undefined,
      })),
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
        style={{ maxHeight: '90vh', maxWidth: '620px' }}
      >
        {/* Drag handle (mobile) */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <ChefHat className="w-6 h-6 text-terracotta-500" style={{ color: '#C18B5E' }} />
            <h2 className="text-2xl font-bold text-gray-900">New Batch Cook Session</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto p-6 space-y-5" style={{ maxHeight: 'calc(90vh - 160px)' }}>

            {/* Session name */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-600">Session Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="e.g., Sunday Indian Prep"
                autoFocus
              />
            </div>

            {/* Cook date */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-600">Cook Date</label>
              <input
                type="date"
                value={cookDate}
                onChange={e => setCookDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>

            {/* Dishes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-600">
                  Dishes Cooked ({dishes.length})
                </label>
                <button
                  type="button"
                  onClick={addDish}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                  style={{ background: 'rgba(212,165,116,0.15)', color: '#C18B5E', border: '1.5px solid #C18B5E' }}
                >
                  <Plus className="w-3 h-3" />
                  Add Dish
                </button>
              </div>

              <div className="space-y-3">
                {dishes.map((dish, i) => {
                  const isLinkedRecipe = !!dish.recipeId;
                  return (
                    <div key={i} className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3">
                      {/* Recipe picker */}
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-gray-500">
                          Recipe {dishes.length > 1 ? i + 1 : ''}
                        </label>
                        <select
                          value={dish.recipeId}
                          onChange={e => handleRecipeChange(i, e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-terracotta-300 outline-none transition-all bg-white"
                        >
                          <option value="">— Custom / no recipe —</option>
                          {recipes.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Custom name if no recipe selected */}
                      {!isLinkedRecipe && (
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-gray-500">Dish Name *</label>
                          <input
                            type="text"
                            value={dish.customName}
                            onChange={e => updateDish(i, 'customName', e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-terracotta-300 outline-none transition-all"
                            placeholder="e.g., Rajma Masala"
                          />
                        </div>
                      )}

                      {/* Servings cooked */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1 text-gray-500">Servings Cooked</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={dish.servingsCooked}
                            onChange={e => updateDish(i, 'servingsCooked', parseInt(e.target.value) || 4)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-terracotta-300 outline-none transition-all"
                          />
                        </div>
                        {dishes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDish(i)}
                            className="mt-5 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Remove dish"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Session notes */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-600">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Any notes about this prep session..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}
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
              {isPending ? 'Saving...' : 'Start Session 🍳'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchCookSessionModal;
