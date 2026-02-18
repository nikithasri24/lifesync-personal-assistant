/**
 * RecipeCardV2 Component
 * Enhanced recipe card with image, difficulty, time, nutrition
 */

import React from 'react';
import { Clock, Users, Heart } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface Recipe {
  id: string;
  name: string;
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  isFavorite?: boolean;
  nutritionInfo?: {
    calories?: number;
  };
}

interface RecipeCardV2Props {
  recipe: Recipe;
  onClick: () => void;
  onFavoriteToggle?: () => void;
}

export const RecipeCardV2: React.FC<RecipeCardV2Props> = ({
  recipe,
  onClick,
  onFavoriteToggle,
}) => {
  const colors = useThemeColors();

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  const difficultyColors = {
    easy: '#10B981',
    medium: '#F59E0B',
    hard: '#EF4444',
  };

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98]"
      style={{
        backgroundColor: 'white',
        borderLeft: `4px solid ${difficultyColors[recipe.difficulty || 'easy']}`,
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      {/* Favorite Button */}
      {onFavoriteToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className="w-5 h-5"
            style={{ color: recipe.isFavorite ? '#EF4444' : '#9CA3AF' }}
            fill={recipe.isFavorite ? '#EF4444' : 'none'}
          />
        </button>
      )}

      {/* Recipe Image */}
      {recipe.imageUrl && (
        <div className="mb-3 rounded-lg overflow-hidden" style={{ height: '120px' }}>
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Recipe Name */}
      <h3
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: colors.text.primary,
          marginBottom: '8px',
          lineHeight: 1.3,
          paddingRight: recipe.isFavorite ? '30px' : '0',
        }}
      >
        {recipe.name}
      </h3>

      {/* Cuisine & Difficulty */}
      <div className="flex gap-2 mb-3">
        {recipe.cuisine && (
          <div
            style={{
              padding: '4px 8px',
              background: colors.bg.tertiary,
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 600,
              color: colors.text.secondary,
              textTransform: 'capitalize',
            }}
          >
            {recipe.cuisine}
          </div>
        )}
        {recipe.difficulty && (
          <div
            style={{
              padding: '4px 8px',
              backgroundColor: `${difficultyColors[recipe.difficulty]}20`,
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 600,
              color: difficultyColors[recipe.difficulty],
              textTransform: 'capitalize',
            }}
          >
            {recipe.difficulty}
          </div>
        )}
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-4">
        {totalTime > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" style={{ color: colors.text.tertiary }} />
            <span className="text-xs" style={{ color: colors.text.secondary }}>
              {totalTime} min
            </span>
          </div>
        )}
        {recipe.servings && (
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" style={{ color: colors.text.tertiary }} />
            <span className="text-xs" style={{ color: colors.text.secondary }}>
              {recipe.servings} servings
            </span>
          </div>
        )}
        {recipe.nutritionInfo?.calories && (
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: colors.text.secondary }}>
              {recipe.nutritionInfo.calories} cal
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeCardV2;
