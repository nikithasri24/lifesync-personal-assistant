/**
 * RoutineCompletionModal - Modal for logging routine completion
 * Allows marking individual products as used/skipped
 * Includes skin condition tracking and notes
 */

import React, { useState } from 'react';
import { X, Check, Sun, Moon } from 'lucide-react';
import { useLogCompletion, useSkincareLogs } from '../../hooks/useSkincareQuery';
import type { SkincareProduct, SkincareRoutine } from '../types';
import { logger } from '../../services/logger';

interface RoutineCompletionModalProps {
  routine: SkincareRoutine;
  date: string;
  timeSlot: 'AM' | 'PM';
  products: SkincareProduct[];
  onClose: () => void;
}

const RoutineCompletionModal: React.FC<RoutineCompletionModalProps> = ({
  routine,
  date,
  timeSlot,
  products,
  onClose,
}) => {
  // Get existing log for this date/time
  const { data: logs = [] } = useSkincareLogs();
  const existingLog = logs.find((log) => log.date === date && log.routineType === timeSlot);

  // Mutation
  const logCompletionMutation = useLogCompletion();

  // State
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(existingLog?.productsUsed || routine.productIds)
  );
  const [skinCondition, setSkinCondition] = useState(existingLog?.skinCondition || '');
  const [skinNotes, setSkinNotes] = useState(existingLog?.skinNotes || '');

  // Toggle product selection
  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Save completion
  const handleSave = async () => {
    const productsUsed = Array.from(selectedProducts);
    const skippedProducts = routine.productIds.filter((id) => !selectedProducts.has(id));

    try {
      await logCompletionMutation.mutateAsync({
        date,
        routineId: routine.id,
        routineType: timeSlot,
        productsUsed,
        skippedProducts,
        skinCondition: skinCondition || undefined,
        skinNotes: skinNotes || undefined,
      });

      onClose();
    } catch (error) {
      logger.error('Failed to save routine completion', error instanceof Error ? error : new Error(String(error)));
      // Error handling is done by the mutation hook
    }
  };

  const isAlreadyCompleted = existingLog?.completed ?? false;
  const isSaving = logCompletionMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {timeSlot === 'AM' ? (
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Sun className="h-5 w-5 text-amber-600" />
                </div>
              ) : (
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Moon className="h-5 w-5 text-indigo-600" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{routine.name}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Products Checklist */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Products</h4>
            <div className="space-y-2">
              {products.map((product) => {
                const isSelected = selectedProducts.has(product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:bg-gray-50"
                    style={{
                      borderColor: isSelected ? 'rgb(34, 197, 94)' : 'rgb(229, 231, 235)',
                      backgroundColor: isSelected ? 'rgb(240, 253, 244)' : 'white',
                    }}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-green-500 border-green-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      {product.brand && (
                        <p className="text-xs text-gray-500">{product.brand}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skin Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How does your skin feel?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {['terrible', 'bad', 'okay', 'good', 'great'].map((condition) => (
                <button
                  key={condition}
                  onClick={() => setSkinCondition(condition)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all capitalize ${
                    skinCondition === condition
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={skinNotes}
              onChange={(e) => setSkinNotes(e.target.value)}
              placeholder="Any reactions, observations, or notes about your skin..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || selectedProducts.size === 0}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isSaving || selectedProducts.size === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : timeSlot === 'AM'
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isSaving
                ? 'Saving...'
                : isAlreadyCompleted
                ? 'Update Completion'
                : 'Mark Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutineCompletionModal;
