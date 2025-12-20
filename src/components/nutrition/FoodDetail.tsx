/**
 * Food Detail Component
 * Shows nutrition details for a selected food and allows logging with quantity
 */

import React, { useState } from 'react';
import { X, Minus, Plus, Flame, Check, Loader2 } from 'lucide-react';
import type { NutritionInfo } from '@/services/nutrition/OpenFoodFactsService';
import type { MealType } from '@/api/nutritionAPI';

interface FoodDetailProps {
  product: NutritionInfo;
  mealType: MealType;
  onLog: (product: NutritionInfo, quantity: number, servingType: 'grams' | 'serving') => Promise<void>;
  onBack: () => void;
}

const MEAL_TYPES: { type: MealType; label: string; icon: string }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { type: 'lunch', label: 'Lunch', icon: '🌞' },
  { type: 'dinner', label: 'Dinner', icon: '🌙' },
  { type: 'snack', label: 'Snack', icon: '🍎' },
];

export function FoodDetail({ product, mealType: initialMealType, onLog, onBack }: FoodDetailProps): React.ReactElement {
  const [quantity, setQuantity] = useState(100);
  const [servingType, setServingType] = useState<'grams' | 'serving'>('grams');
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMealType);
  const [isLogging, setIsLogging] = useState(false);

  const multiplier = servingType === 'grams' ? quantity / 100 : quantity;
  const calories = Math.round(product.caloriesPer100g * (servingType === 'grams' ? multiplier : 1) * quantity / (servingType === 'grams' ? quantity : 1));
  const protein = Math.round(product.proteinPer100g * multiplier);
  const carbs = Math.round(product.carbsPer100g * multiplier);
  const fat = Math.round(product.fatPer100g * multiplier);

  const handleLog = async () => {
    setIsLogging(true);
    try {
      await onLog(product, quantity, servingType);
    } finally {
      setIsLogging(false);
    }
  };

  const adjustQuantity = (delta: number) => {
    const newQty = servingType === 'grams' ? Math.max(10, quantity + delta) : Math.max(0.5, quantity + delta);
    setQuantity(newQty);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <button onClick={onBack} className="text-indigo-600 font-medium text-sm">← Back</button>
        <button onClick={onBack} className="p-1 hover:bg-gray-200 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Product info */}
        <div className="flex gap-4">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="w-20 h-20 object-cover rounded-lg" />
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">🍽️</div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{product.name}</h3>
            {product.brand && <p className="text-sm text-gray-500">{product.brand}</p>}
            {product.servingSize && <p className="text-xs text-gray-400 mt-1">Serving: {product.servingSize}</p>}
          </div>
        </div>

        {/* Quantity selector */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setServingType('grams')}
              className={`flex-1 py-2 rounded-lg font-medium text-sm ${servingType === 'grams' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Grams
            </button>
            <button
              onClick={() => { setServingType('serving'); setQuantity(1); }}
              className={`flex-1 py-2 rounded-lg font-medium text-sm ${servingType === 'serving' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Servings
            </button>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button onClick={() => adjustQuantity(servingType === 'grams' ? -10 : -0.5)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
              <Minus className="w-5 h-5" />
            </button>
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-900">{servingType === 'serving' ? quantity.toFixed(1) : quantity}</span>
              <span className="text-gray-500 ml-1">{servingType === 'grams' ? 'g' : 'serving(s)'}</span>
            </div>
            <button onClick={() => adjustQuantity(servingType === 'grams' ? 10 : 0.5)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nutrition breakdown */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-orange-600">{calories}</p>
            <p className="text-xs text-gray-500">cal</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-lg font-bold text-red-600">{protein}g</p>
            <p className="text-xs text-gray-500">protein</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-lg font-bold text-blue-600">{carbs}g</p>
            <p className="text-xs text-gray-500">carbs</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-lg font-bold text-yellow-600">{fat}g</p>
            <p className="text-xs text-gray-500">fat</p>
          </div>
        </div>

        {/* Meal type selector */}
        <div className="flex gap-2">
          {MEAL_TYPES.map(m => (
            <button
              key={m.type}
              onClick={() => setSelectedMeal(m.type)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${selectedMeal === m.type ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {m.icon}
            </button>
          ))}
        </div>

        {/* Log button */}
        <button
          onClick={handleLog}
          disabled={isLogging}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLogging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Log {calories} Calories
        </button>
      </div>
    </div>
  );
}

