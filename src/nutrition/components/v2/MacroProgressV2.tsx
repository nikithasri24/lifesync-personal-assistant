/**
 * MacroProgressV2 Component
 * Progress bars for Protein/Carbs/Fat with terracotta gradients
 * Matches nutrition-design-spec.html exactly
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface MacroData {
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fat: { current: number; goal: number };
}

interface MacroProgressV2Props {
  macros: MacroData;
}

export const MacroProgressV2: React.FC<MacroProgressV2Props> = ({ macros }) => {
  const colors = useThemeColors();

  const macroList = [
    {
      name: 'Protein',
      current: macros.protein.current,
      goal: macros.protein.goal,
      gradient: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
    },
    {
      name: 'Carbs',
      current: macros.carbs.current,
      goal: macros.carbs.goal,
      gradient: 'linear-gradient(90deg, #E8C48E 0%, #D4A574 100%)',
    },
    {
      name: 'Fat',
      current: macros.fat.current,
      goal: macros.fat.goal,
      gradient: 'linear-gradient(90deg, #C18B5E 0%, #A6785A 100%)',
    },
  ];

  return (
    <div
      style={{
        background: 'white',
        margin: '0 20px 16px',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: '700', color: '#5C4A3A', marginBottom: '12px' }}>
        Macros
      </div>

      {macroList.map((macro, index) => {
        const percentage = macro.goal > 0 ? (macro.current / macro.goal) * 100 : 0;

        return (
          <div key={macro.name} style={{ marginBottom: index === macroList.length - 1 ? 0 : '12px' }}>
            {/* Label */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                color: '#6B5847',
                marginBottom: '6px',
              }}
            >
              <span>{macro.name}</span>
              <span>
                {Math.round(macro.current)}g / {Math.round(macro.goal)}g
              </span>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                height: '8px',
                background: '#E8DCC8',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: '4px',
                  background: macro.gradient,
                  width: `${Math.min(percentage, 100)}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
