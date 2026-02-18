/**
 * Nutrition Tracker Component
 * Main component for food logging with photo upload, search, barcode, and manual entry
 */

import React, { useState } from 'react';
import { logger } from '@/services/logger';
import { format } from 'date-fns';
import { Camera, Search, Plus, ChevronLeft, ChevronRight, ScanBarcode } from 'lucide-react';
import { FoodPhotoUpload } from './FoodPhotoUpload';
import { FoodLogItem } from './FoodLogItem';
import { BarcodeScanner } from './BarcodeScanner';
import { FoodSearch } from './FoodSearch';
import { FoodDetail } from './FoodDetail';
import { CalorieSummaryV2, MacroProgressV2, MealSectionV2, FoodLogModalV2 } from '@/nutrition/components/v2';
import { useDailyLogQuery, useLogFoodMutation, useDeleteLogEntryMutation, useNutritionGoalQuery } from '@/hooks/useNutritionQuery';
import { foodPhotoService, type FoodAnalysisResult } from '@/services/nutrition/api/FoodPhotoService';
import type { NutritionInfo } from '@/services/nutrition/OpenFoodFactsService';
import type { MealType } from '@/api/nutritionAPI';
import ErrorState from '@/components/ErrorState';
import { parseServingGrams } from './servingUtils';
import { useThemeColors } from '@/hooks/useThemeColors';

type ActivePanel = 'none' | 'photo' | 'search' | 'barcode' | 'detail';

const MEAL_TYPES: { type: MealType; label: string; icon: string }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { type: 'lunch', label: 'Lunch', icon: '🌞' },
  { type: 'dinner', label: 'Dinner', icon: '🌙' },
  { type: 'snack', label: 'Snack', icon: '🍎' },
];

export function NutritionTracker(): React.ReactElement {
  const colors = useThemeColors();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<NutritionInfo | null>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const {
    data: dailyLog = [],
    isLoading,
    error: dailyLogError,
    refetch: refetchDailyLog,
  } = useDailyLogQuery(dateStr);
  const {
    data: goal,
    error: goalError,
    refetch: refetchGoal,
  } = useNutritionGoalQuery();
  const logFoodMutation = useLogFoodMutation();
  const deleteLogMutation = useDeleteLogEntryMutation();

  // Calculate totals
  const totals = dailyLog.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein_g,
      carbs: acc.carbs + entry.carbs_g,
      fat: acc.fat + entry.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Group by meal type
  const mealGroups = MEAL_TYPES.map(m => ({
    ...m,
    entries: dailyLog.filter(e => e.meal_type === m.type),
  }));

  const handlePhotoAnalysis = async (result: FoodAnalysisResult, imageDataUrl: string) => {
    try {
      // Get user ID for upload
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload photo
      const blob = foodPhotoService.dataUrlToBlob(imageDataUrl);
      const imageUrl = await foodPhotoService.uploadPhoto(blob, user.id);

      // Log each detected food item (or combine as one entry)
      await logFoodMutation.mutateAsync({
        custom_food_name: result.description || result.items.map(i => i.name).join(', '),
        quantity: 1,
        meal_type: selectedMealType,
        logged_date: dateStr,
        calories: result.totalCalories,
        protein_g: result.totalProtein,
        carbs_g: result.totalCarbs,
        fat_g: result.totalFat,
        image_url: imageUrl,
        ai_analyzed: true,
        ai_confidence: result.confidence,
      });

      setActivePanel('none');
    } catch (err) {
      logger.error('Nutrition', 'Failed to log photo meal:', err);
    }
  };

  const handleProductSelect = (product: NutritionInfo) => {
    setSelectedProduct(product);
    setActivePanel('detail');
  };

  const handleLogProduct = async (
    product: NutritionInfo,
    quantity: number,
    servingType: 'grams' | 'serving',
    mealType: MealType
  ) => {
    const servingGrams = servingType === 'serving' ? parseServingGrams(product.servingSize) : null;
    const multiplier = servingType === 'grams'
      ? quantity / 100
      : ((servingGrams ?? 100) / 100) * quantity;
    await logFoodMutation.mutateAsync({
      custom_food_name: product.brand ? `${product.name} (${product.brand})` : product.name,
      quantity: servingType === 'grams' ? quantity : quantity,
      meal_type: mealType,
      logged_date: dateStr,
      calories: Math.round(product.caloriesPer100g * multiplier),
      protein_g: Math.round(product.proteinPer100g * multiplier),
      carbs_g: Math.round(product.carbsPer100g * multiplier),
      fat_g: Math.round(product.fatPer100g * multiplier),
      image_url: product.imageUrl,
    });
    setSelectedProduct(null);
    setActivePanel('none');
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6">
      {/* Date navigation */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-lg transition-colors duration-200"
          style={{ backgroundColor: colors.bg.secondary }}
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" style={{ color: colors.text.primary }} />
        </button>
        <span className="font-medium min-w-[120px] text-center" style={{ color: colors.text.primary }}>
          {format(selectedDate, 'MMM d, yyyy')}
        </span>
        <button
          onClick={() => changeDate(1)}
          className="p-2 rounded-lg transition-colors duration-200"
          style={{ backgroundColor: colors.bg.secondary }}
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" style={{ color: colors.text.primary }} />
        </button>
      </div>

      {dailyLogError || goalError ? (
        <ErrorState
          error={dailyLogError ?? goalError}
          onRetry={() => {
            void refetchDailyLog();
            void refetchGoal();
          }}
        />
      ) : (
        <>
      {/* Progress overview */}
      {goal && (
        <>
          <CalorieSummaryV2 consumed={totals.calories} goal={goal.calories_target} />
          <MacroProgressV2
            macros={{
              protein: { current: totals.protein, goal: goal.protein_target_g },
              carbs: { current: totals.carbs, goal: goal.carbs_target_g },
              fat: { current: totals.fat, goal: goal.fat_target_g },
            }}
          />
        </>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setActivePanel('photo')}
          className="flex flex-col items-center justify-center gap-1 py-3 text-white rounded-xl font-medium transition-all duration-200 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
          }}
        >
          <Camera className="w-5 h-5" />
          <span className="text-xs">Snap</span>
        </button>
        <button
          onClick={() => setActivePanel('search')}
          className="flex flex-col items-center justify-center gap-1 py-3 text-white rounded-xl font-medium transition-all duration-200 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
          }}
        >
          <Search className="w-5 h-5" />
          <span className="text-xs">Search</span>
        </button>
        <button
          onClick={() => setActivePanel('barcode')}
          className="flex flex-col items-center justify-center gap-1 py-3 text-white rounded-xl font-medium transition-all duration-200 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
          }}
        >
          <ScanBarcode className="w-5 h-5" />
          <span className="text-xs">Barcode</span>
        </button>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95"
          style={{
            border: `2px solid ${colors.border.light}`,
            color: colors.text.primary,
          }}
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs">Quick</span>
        </button>
      </div>

      {/* Food detail panel */}
      {activePanel === 'detail' && selectedProduct && (
        <FoodDetail
          product={selectedProduct}
          mealType={selectedMealType}
          onLog={handleLogProduct}
          onBack={() => { setSelectedProduct(null); setActivePanel('search'); }}
        />
      )}

      {/* Barcode scanner */}
      {activePanel === 'barcode' && (
        <BarcodeScanner
          onProductFound={handleProductSelect}
          onCancel={() => setActivePanel('none')}
        />
      )}

      {/* Food search */}
      {activePanel === 'search' && (
        <FoodSearch
          onSelectFood={handleProductSelect}
          onClose={() => setActivePanel('none')}
        />
      )}

      {/* Photo upload modal */}
      {activePanel === 'photo' && (
        <div className="mb-4">
          {/* Meal type selector for photo */}
          <div className="flex gap-2 mb-3">
            {MEAL_TYPES.map(m => (
              <button
                key={m.type}
                onClick={() => setSelectedMealType(m.type)}
                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95"
                style={{
                  background: selectedMealType === m.type
                    ? `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`
                    : colors.bg.secondary,
                  color: selectedMealType === m.type ? 'white' : colors.text.primary,
                }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
          <FoodPhotoUpload onAnalysisComplete={handlePhotoAnalysis} onCancel={() => setActivePanel('none')} />
        </div>
      )}

      {/* Food Log Modal */}
      <FoodLogModalV2
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        selectedMealType={selectedMealType}
        onSubmit={async (data) => {
          await logFoodMutation.mutateAsync({
            custom_food_name: data.foodName,
            quantity: 1,
            meal_type: data.mealType,
            logged_date: dateStr,
            calories: data.calories,
            protein_g: data.protein,
            carbs_g: data.carbs,
            fat_g: data.fat,
          });
        }}
      />

      {/* Meal logs by type */}
      {isLoading ? (
        <div className="text-center py-8" style={{ color: colors.text.tertiary }}>
          Loading...
        </div>
      ) : (
        <div className="space-y-4">
          {mealGroups.map(group => (
            <MealSectionV2
              key={group.type}
              mealType={group.type}
              mealLabel={group.label}
              mealIcon={group.icon}
              totalCalories={group.entries.reduce((sum, e) => sum + e.calories, 0)}
              foodEntries={group.entries.map(entry => ({
                id: entry.id,
                name: entry.custom_food_name || 'Unknown food',
                servingInfo: `${entry.quantity || 1} serving`,
                calories: entry.calories,
                photoUrl: entry.image_url,
              }))}
              onAddFood={() => {
                setSelectedMealType(group.type);
                setShowQuickAdd(true);
              }}
              onFoodClick={(id) => {
                // Handle food item click - could open edit modal
                console.log('Food clicked:', id);
              }}
            />
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
