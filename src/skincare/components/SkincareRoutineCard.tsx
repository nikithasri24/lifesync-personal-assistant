/**
 * SkincareRoutineCard - Display AM/PM skincare routine with products
 */

import React from 'react';
import { Sun, Moon, Edit, Trash2, Check } from 'lucide-react';
import type { SkincareRoutine, SkincareProduct } from '../types';

type SkincareRoutineCardProps = {
  routine: SkincareRoutine;
  products: SkincareProduct[];
  allProducts: SkincareProduct[];
  completed: boolean;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const SkincareRoutineCard: React.FC<SkincareRoutineCardProps> = ({
  routine,
  products,
  allProducts: _allProducts,
  completed,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const isAM = routine.routineType === 'AM';
  const icon = isAM ? Sun : Moon;
  const IconComponent = icon;

  return (
    <div className={`rounded-2xl shadow-sm ring-1 border p-5 ${
      isAM
        ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-200 dark:border-amber-800'
        : 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-indigo-200 dark:border-indigo-800'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconComponent className={`h-6 w-6 ${isAM ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{routine.name}</h3>
          {!routine.isActive && (
            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
              Inactive
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleComplete}
            className={`p-2 rounded-lg transition-all ${
              completed
                ? isAM
                  ? 'bg-amber-600 text-white'
                  : 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
            title={completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <Check className="h-5 w-5" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
            title="Edit routine"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border border-gray-300 dark:border-gray-600"
            title="Delete routine"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-2">
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No products in this routine</p>
            <button
              onClick={onEdit}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Add products →
            </button>
          </div>
        ) : (
          products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                isAM ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {product.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {product.brand && `${product.brand} • `}
                  {product.category}
                </p>
              </div>
              {product.rating && (
                <div className="flex-shrink-0 flex items-center gap-1">
                  <span className="text-yellow-500 text-sm">★</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{product.rating}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Notes */}
      {routine.notes && (
        <div className="mt-4 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-700 dark:text-gray-300">{routine.notes}</p>
        </div>
      )}
    </div>
  );
};

export default SkincareRoutineCard;
