# Nutrition Tab UI/UX Enhancement Plan

## Context

The Nutrition feature needs to be updated to match the design specifications in `nutrition-design-spec.html` and apply all 25 UI/UX enhancement patterns from CLAUDE.md (established by the Together tab reference implementation).

**Current State:**
- Nutrition page exists at `src/pages/Nutrition.tsx` with 2 tabs (Log Food, Dashboard)
- Already has FeatureErrorBoundary ✅
- Uses SegmentedControl for tab navigation ✅
- Components exist: NutritionTracker, NutritionDashboard, FoodLogItem, MacroProgressBar, BarcodeScanner, FoodPhotoUpload
- Missing: consistent modal structure, auto-save, enhanced styling, circular progress for calories

**Goal:**
- Match `nutrition-design-spec.html` styling exactly
- Apply all Together tab UI patterns
- Maintain existing functionality (food logging, photo upload, barcode scanning, AI analysis, macro tracking)
- Ensure responsive mobile/desktop behavior
- Add circular calorie progress, meal sections, enhanced dashboard

**Why This Matters:**
- Nutrition tracking requires quick, visual UI for daily use
- Photo upload and barcode scanning need streamlined UX
- Macro and calorie visualization should be clear and motivating
- Will serve as reference for health-tracking features

---

## Critical Files to Modify

### Primary Files (Must Update)
1. `src/pages/Nutrition.tsx` - Main page component
2. `src/components/nutrition/NutritionTracker.tsx` - Food logging interface
3. `src/components/nutrition/NutritionDashboard.tsx` - Stats and insights
4. `src/components/nutrition/FoodLogItem.tsx` - Food entry display
5. `src/components/nutrition/MacroProgressBar.tsx` - Macro visualization
6. `src/components/nutrition/FoodPhotoUpload.tsx` - Photo capture/upload
7. `src/components/nutrition/BarcodeScanner.tsx` - Barcode scanning
8. `src/components/nutrition/FoodSearch.tsx` - Food database search

### New Components to Create
9. `src/components/nutrition/v2/CalorieSummaryCardV2.tsx` - Circular calorie progress
10. `src/components/nutrition/v2/MealSectionV2.tsx` - Meal grouping (breakfast, lunch, dinner, snacks)
11. `src/components/nutrition/v2/FoodFormModalV2.tsx` - Add food modal (Together pattern)
12. `src/components/nutrition/v2/MacroProgressCardV2.tsx` - Enhanced macro display
13. `src/components/nutrition/v2/FoodItemV2.tsx` - Food entry cards
14. `src/components/nutrition/v2/DateNavigatorV2.tsx` - Day navigation
15. `src/components/nutrition/v2/WeeklyChartV2.tsx` - Weekly calorie chart

### Reference Files (Do NOT Modify)
- `src/pages/Together.tsx` - Reference implementation
- `src/together/components/modals/*.tsx` - Modal examples
- `nutrition-design-spec.html` - Design specification
- `CLAUDE.md` - UI/UX standards

---

## Implementation Plan

### Phase 1: Update Main Page Header

**File:** `src/pages/Nutrition.tsx`

**Current State:**
```tsx
// ✅ Already has:
// - FeatureErrorBoundary
// - Icon + title header
// - SegmentedControl for 2 tabs
```

**Changes Needed:**
1. Update header to match design spec gradient:
   ```tsx
   <div
     style={{
       background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
       padding: '60px 20px 20px',
       color: 'white',
       marginBottom: '16px'
     }}
   >
     <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
       🥗 Nutrition
     </h1>
     <div style={{ fontSize: '14px', opacity: 0.9 }}>
       Track food & reach your goals
     </div>
   </div>
   ```

2. Move SegmentedControl below header:
   ```tsx
   <div style={{ background: 'rgba(92, 74, 58, 0.1)', borderRadius: '12px', padding: '4px', margin: '16px 20px' }}>
     <SegmentedControl
       segments={[
         { value: 'tracker', label: 'Log Food' },
         { value: 'dashboard', label: 'Dashboard' },
       ]}
       value={activeTab}
       onChange={(value) => setActiveTab(value as NutritionTabView)}
     />
   </div>
   ```

**Expected Outcome:**
- Header matches design spec exactly (terracotta gradient, white text)
- SegmentedControl styled consistently with design

---

### Phase 2: Create CalorieSummaryCardV2 Component

**File:** `src/components/nutrition/v2/CalorieSummaryCardV2.tsx` (Create new)

**Purpose:** Display circular calorie progress prominently

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface CalorieSummaryCardV2Props {
  consumed: number;
  goal: number;
  burned?: number;
}

export const CalorieSummaryCardV2: React.FC<CalorieSummaryCardV2Props> = ({
  consumed,
  goal,
  burned = 0,
}) => {
  const colors = useThemeColors();
  const net = consumed - burned;
  const remaining = goal - net;
  const percentage = Math.min((net / goal) * 100, 100);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
        margin: '16px 20px',
        borderRadius: '16px',
        padding: '20px',
        color: 'white',
        textAlign: 'center',
      }}
    >
      {/* Circular Progress */}
      <div
        style={{
          width: '120px',
          height: '120px',
          margin: '0 auto 16px',
          position: 'relative',
        }}
      >
        {/* SVG Circle Progress */}
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - percentage / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s' }}
          />
        </svg>
        {/* Center text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '36px', fontWeight: 800 }}>
            {net}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
            of {goal} cal
          </div>
        </div>
      </div>

      {/* Remaining */}
      <div style={{ fontSize: '14px', opacity: 0.9 }}>
        {remaining > 0 ? `${remaining} cal remaining` : `${Math.abs(remaining)} cal over goal`}
      </div>

      {/* Exercise burned */}
      {burned > 0 && (
        <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
          🔥 {burned} cal burned from exercise
        </div>
      )}
    </div>
  );
};
```

**Expected Outcome:**
- Circular progress ring showing calorie consumption
- Shows consumed/goal ratio
- Exercise calories displayed separately
- Matches design spec gradient card

---

### Phase 3: Create MacroProgressCardV2 Component

**File:** `src/components/nutrition/v2/MacroProgressCardV2.tsx` (Create new)

**Purpose:** Display macro breakdown with progress bars

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface Macro {
  current: number;
  goal: number;
}

interface MacroProgressCardV2Props {
  protein: Macro;
  carbs: Macro;
  fat: Macro;
}

export const MacroProgressCardV2: React.FC<MacroProgressCardV2Props> = ({
  protein,
  carbs,
  fat,
}) => {
  const colors = useThemeColors();

  const macros = [
    {
      name: 'Protein',
      current: protein.current,
      goal: protein.goal,
      color: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
    },
    {
      name: 'Carbs',
      current: carbs.current,
      goal: carbs.goal,
      color: 'linear-gradient(90deg, #E8C48E 0%, #D4A574 100%)',
    },
    {
      name: 'Fat',
      current: fat.current,
      goal: fat.goal,
      color: 'linear-gradient(90deg, #C18B5E 0%, #A6785A 100%)',
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
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#5C4A3A', marginBottom: '12px' }}>
        Macros
      </div>

      {macros.map((macro, index) => {
        const percentage = Math.min((macro.current / macro.goal) * 100, 100);

        return (
          <div key={macro.name} style={{ marginBottom: index === macros.length - 1 ? 0 : '12px' }}>
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
                {macro.current}g / {macro.goal}g
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
                  width: `${percentage}%`,
                  height: '100%',
                  background: macro.color,
                  borderRadius: '4px',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

**Expected Outcome:**
- Clean macro progress bars
- Three macros: protein, carbs, fat
- Different gradient colors for each macro
- Grams displayed with goals

---

### Phase 4: Create MealSectionV2 Component

**File:** `src/components/nutrition/v2/MealSectionV2.tsx` (Create new)

**Purpose:** Group foods by meal (breakfast, lunch, dinner, snacks)

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FoodItemV2 } from './FoodItemV2';
import type { FoodEntry } from '@/types/nutrition';

interface MealSectionV2Props {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  foods: FoodEntry[];
  onAddFood: (mealType: string) => void;
  onEditFood: (food: FoodEntry) => void;
  onDeleteFood: (foodId: string) => void;
}

export const MealSectionV2: React.FC<MealSectionV2Props> = ({
  mealType,
  foods,
  onAddFood,
  onEditFood,
  onDeleteFood,
}) => {
  const colors = useThemeColors();

  const mealIcons: Record<string, string> = {
    breakfast: '🍳',
    lunch: '🥗',
    dinner: '🍽️',
    snacks: '🍎',
  };

  const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0);

  return (
    <div
      style={{
        background: 'white',
        margin: '0 20px 12px',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: 700,
            color: '#5C4A3A',
          }}
        >
          <span>{mealIcons[mealType]}</span>
          <span style={{ textTransform: 'capitalize' }}>{mealType}</span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#C18B5E' }}>
          {totalCalories} cal
        </div>
      </div>

      {/* Food Items */}
      {foods.length > 0 ? (
        <>
          {foods.map((food) => (
            <FoodItemV2
              key={food.id}
              food={food}
              onClick={() => onEditFood(food)}
              onDelete={() => onDeleteFood(food.id)}
            />
          ))}
        </>
      ) : null}

      {/* Add Food Button */}
      <button
        onClick={() => onAddFood(mealType)}
        style={{
          width: '100%',
          padding: '10px',
          background: 'rgba(212, 165, 116, 0.1)',
          border: '2px dashed #D4A574',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#C18B5E',
          cursor: 'pointer',
          marginTop: foods.length > 0 ? '8px' : 0,
        }}
      >
        + Add Food
      </button>
    </div>
  );
};
```

**Expected Outcome:**
- Meal sections for breakfast, lunch, dinner, snacks
- Each section shows total calories
- Add food button within each section
- Grouped food display

---

### Phase 5: Create FoodItemV2 Component

**File:** `src/components/nutrition/v2/FoodItemV2.tsx` (Create new)

**Purpose:** Display individual food entries

**Implementation:**
```tsx
import React from 'react';
import { Trash2 } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { FoodEntry } from '@/types/nutrition';

interface FoodItemV2Props {
  food: FoodEntry;
  onClick: () => void;
  onDelete: () => void;
}

export const FoodItemV2: React.FC<FoodItemV2Props> = ({ food, onClick, onDelete }) => {
  const colors = useThemeColors();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: '#FAFAFA',
        borderRadius: '12px',
        marginBottom: '8px',
        position: 'relative',
      }}
    >
      {/* Photo or Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          background: food.photoUrl
            ? `url(${food.photoUrl}) center/cover`
            : 'linear-gradient(135deg, #E8DCC8 0%, #D4C5B3 100%)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}
      >
        {!food.photoUrl && '🍴'}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#5C4A3A', marginBottom: '2px' }}>
          {food.name}
        </div>
        <div style={{ fontSize: '12px', color: '#9B8B7A' }}>
          {food.servingSize && `${food.servingSize} • `}
          {food.protein}g P • {food.carbs}g C • {food.fat}g F
        </div>
      </div>

      {/* Calories */}
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#C18B5E', marginRight: '8px' }}>
        {food.calories} cal
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="hover:bg-red-100 transition-colors"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
        }}
        aria-label="Delete food entry"
      >
        <Trash2 size={16} style={{ color: '#DC2626' }} />
      </button>
    </div>
  );
};
```

**Expected Outcome:**
- Food items with photo or icon placeholder
- Macros displayed (P/C/F)
- Calories prominently shown
- Delete button with hover effect

---

### Phase 6: Create FoodFormModalV2 Component

**File:** `src/components/nutrition/v2/FoodFormModalV2.tsx` (Create new)

**Purpose:** Add/edit food with Together pattern modal

**Key Fields:**
- Food name
- Meal type (breakfast, lunch, dinner, snacks)
- Serving size
- Calories
- Protein, Carbs, Fat (grams)
- Photo (optional)

**Multiple Entry Methods:**
1. **Manual Entry** - Type food name, enter macros
2. **Photo Upload** - Take photo, AI analyzes nutrition
3. **Barcode Scanner** - Scan barcode, lookup nutrition
4. **Food Search** - Search database, select food

**Modal Structure:**
```tsx
// Together pattern with:
// - Mobile drag handle
// - Fixed header "Log Food"
// - Scrollable content with 4 tabs for entry methods
// - Auto-save to localStorage
// - ESC key and backdrop support
// - Fixed footer with Cancel/Save buttons
```

**Expected Outcome:**
- Food modal matches Together pattern
- 4 entry methods (manual, photo, barcode, search)
- Auto-save drafts
- Photo upload integrated
- Barcode scanning integrated

---

### Phase 7: Create DateNavigatorV2 Component

**File:** `src/components/nutrition/v2/DateNavigatorV2.tsx` (Create new)

**Purpose:** Navigate between days

**Implementation:**
```tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatDateForDisplay } from '@/utils/dateUtils';

interface DateNavigatorV2Props {
  date: Date;
  onChange: (date: Date) => void;
}

export const DateNavigatorV2: React.FC<DateNavigatorV2Props> = ({ date, onChange }) => {
  const colors = useThemeColors();

  const goToPreviousDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    onChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    onChange(newDate);
  };

  const goToToday = () => {
    onChange(new Date());
  };

  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'white',
        borderBottom: '1px solid #E8DCC8',
      }}
    >
      <button
        onClick={goToPreviousDay}
        className="hover:bg-gray-100 transition-colors"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'rgba(212, 165, 116, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="Previous day"
      >
        <ChevronLeft size={18} style={{ color: '#C18B5E' }} />
      </button>

      <div
        onClick={!isToday ? goToToday : undefined}
        className={!isToday ? 'cursor-pointer hover:opacity-70' : ''}
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#5C4A3A',
          transition: 'opacity 0.2s',
        }}
      >
        {isToday ? 'Today' : formatDateForDisplay(date)}
      </div>

      <button
        onClick={goToNextDay}
        className="hover:bg-gray-100 transition-colors"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'rgba(212, 165, 116, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="Next day"
      >
        <ChevronRight size={18} style={{ color: '#C18B5E' }} />
      </button>
    </div>
  );
};
```

**Expected Outcome:**
- Previous/Next day buttons
- Date label (click to return to today)
- Matches design spec styling

---

### Phase 8: Create WeeklyChartV2 Component

**File:** `src/components/nutrition/v2/WeeklyChartV2.tsx` (Create new)

**Purpose:** Display weekly calorie chart on dashboard

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface DayData {
  day: string;
  calories: number;
}

interface WeeklyChartV2Props {
  data: DayData[];
  goal: number;
}

export const WeeklyChartV2: React.FC<WeeklyChartV2Props> = ({ data, goal }) => {
  const colors = useThemeColors();
  const maxCalories = Math.max(...data.map(d => d.calories), goal);

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
      <div style={{ fontSize: '16px', fontWeight: 700, color: '#5C4A3A', marginBottom: '16px' }}>
        This Week
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '8px',
          height: '120px',
        }}
      >
        {data.map((day) => {
          const heightPercentage = (day.calories / maxCalories) * 100;

          return (
            <div key={day.day} style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  height: `${heightPercentage}%`,
                  background: 'linear-gradient(180deg, #D4A574 0%, #C18B5E 100%)',
                  borderRadius: '6px 6px 0 0',
                  minHeight: '4px',
                  transition: 'height 0.3s',
                }}
              />
              <div style={{ fontSize: '11px', color: '#9B8B7A', marginTop: '6px' }}>
                {day.day}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

**Expected Outcome:**
- Bar chart showing 7 days of calorie data
- Bars with terracotta gradient
- Day labels below bars
- Responsive height based on max calories

---

### Phase 9: Update NutritionTracker Page

**File:** `src/components/nutrition/NutritionTracker.tsx`

**Changes:**
1. Use all V2 components:
   - DateNavigatorV2 for day selection
   - CalorieSummaryCardV2 for calorie progress
   - MacroProgressCardV2 for macro tracking
   - MealSectionV2 for each meal (4 sections)

2. Layout structure:
   ```tsx
   <div style={{ paddingBottom: '100px' }}>
     {/* Owner Filter (if merged mode) */}
     {mergedConnection && <OwnerFilter />}

     {/* Date Navigator */}
     <DateNavigatorV2 date={selectedDate} onChange={setSelectedDate} />

     {/* Calorie Summary */}
     <CalorieSummaryCardV2
       consumed={totalCalories}
       goal={calorieGoal}
       burned={exerciseCalories}
     />

     {/* Macro Progress */}
     <MacroProgressCardV2
       protein={{ current: totalProtein, goal: proteinGoal }}
       carbs={{ current: totalCarbs, goal: carbsGoal }}
       fat={{ current: totalFat, goal: fatGoal }}
     />

     {/* Meal Sections */}
     {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => (
       <MealSectionV2
         key={mealType}
         mealType={mealType}
         foods={foodsByMeal[mealType]}
         onAddFood={handleAddFood}
         onEditFood={handleEditFood}
         onDeleteFood={handleDeleteFood}
       />
     ))}
   </div>
   ```

**Expected Outcome:**
- Tracker uses all V2 components
- Date navigation working
- Calorie/macro progress visible
- Meals grouped by type

---

### Phase 10: Update NutritionDashboard Page

**File:** `src/components/nutrition/NutritionDashboard.tsx`

**Changes:**
1. Add weekly chart (WeeklyChartV2)
2. Add stat cards:
   - Average calories per day
   - Days on track (met goal)
   - Current streak
   - Favorite foods

3. Layout structure:
   ```tsx
   <div style={{ paddingBottom: '100px' }}>
     {/* Stats Grid */}
     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '0 20px 16px' }}>
       <StatCard icon="📊" value={avgCalories} label="Avg Calories" />
       <StatCard icon="✅" value={daysOnTrack} label="Days On Track" />
       <StatCard icon="🔥" value={currentStreak} label="Day Streak" />
       <StatCard icon="⭐" value={favoriteCount} label="Favorites" />
     </div>

     {/* Weekly Chart */}
     <WeeklyChartV2 data={weeklyData} goal={calorieGoal} />

     {/* Insights */}
     <InsightsCard insights={nutritionInsights} />
   </div>
   ```

**Expected Outcome:**
- Dashboard shows weekly stats
- Chart visualizes calorie trend
- Stat cards display key metrics
- Insights from AI analysis

---

### Phase 11: Add Quick Log Options

**Add floating quick-log menu:**

```tsx
<div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    padding: '0 20px 100px',
    marginTop: '20px',
  }}
>
  {[
    { icon: '✍️', label: 'Manual Entry', desc: 'Type food details' },
    { icon: '📸', label: 'Take Photo', desc: 'AI nutrition analysis' },
    { icon: '📷', label: 'Barcode Scan', desc: 'Scan product barcode' },
    { icon: '🔍', label: 'Food Search', desc: 'Search database' },
  ].map((option) => (
    <button
      key={option.label}
      onClick={() => openFoodModal(option.label)}
      className="transition-transform active:scale-[0.98]"
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px 16px',
        textAlign: 'center',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>
        {option.icon}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#5C4A3A' }}>
        {option.label}
      </div>
      <div style={{ fontSize: '11px', color: '#9B8B7A', marginTop: '4px' }}>
        {option.desc}
      </div>
    </button>
  ))}
</div>
```

**Expected Outcome:**
- 4 quick-log options displayed as cards
- Opens FoodFormModalV2 with appropriate method selected
- Matches design spec styling

---

## Phase X: Code Quality & Cleanup (Post-Implementation) ⭐ **CRITICAL**

After completing the V2 implementation, perform these code quality improvements based on lessons learned from Notes and Journal modules.

### Step 1: Add Error Boundary (CRITICAL - Do First)

**Why:** Prevents crashes in one feature from taking down entire app

**File:** `src/pages/Nutrition.tsx`

**Current State:**
```typescript
// ✅ ALREADY IMPLEMENTED - Nutrition page already has error boundary!
const Nutrition: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Nutrition">
      <div>...</div>
    </FeatureErrorBoundary>
  );
};
```

**Impact:** High - Already done! ✅ No action needed.

---

### Step 2: Investigate and Remove Dead Code

**Why:** Reduces maintenance burden, improves clarity, smaller bundle

**Investigation Commands:**
```bash
# List all component files
find src/components/nutrition -name "*.tsx" -o -name "*.ts"

# Check if component is imported anywhere
grep -r "ComponentName" src --exclude-dir=nutrition

# Check exports
grep -r "from.*nutrition" src
```

**Process:**
1. List all components in nutrition directory
2. For each component:
   - Search codebase for imports
   - Check if used in NutritionTracker or NutritionDashboard
   - If NOT used → Mark for deletion
3. Delete unused files
4. Clean up barrel exports

**Common Dead Code Patterns:**
- Old food logging components (replaced by V2)
- Unused modal components
- Duplicate card components

**Expected Impact:** -100 to -300 lines

---

### Step 3: Replace Duplicate Date Formatting

**Solution:**
```typescript
// ✅ USE SHARED UTILITY
import { getRelativeTime, formatDateForDisplay } from '@/utils/dateUtils';

// In component:
{formatDateForDisplay(selectedDate)}
```

**Expected Impact:** -10 to -20 lines

---

### Step 4: Replace Framer Motion with CSS Transitions

**Solution:**
```typescript
// ✅ CSS TRANSITIONS
<div
  className="transition-transform hover:scale-[1.01] active:scale-[0.98]"
  style={{ transitionDuration: '150ms' }}
>
```

**Expected Impact:** -10-20KB bundle size

---

### Step 5: Use Theme Colors Consistently

**Solution:**
```typescript
// ✅ THEME COLORS
import { useThemeColors } from '@/hooks/useThemeColors';

const colors = useThemeColors();

<div style={{ color: colors.text.primary }}>
```

**Expected Impact:** 5-10 hardcoded colors replaced

---

### Step 6: Use Shared Date Comparison Utilities

**Solution:**
```typescript
// ✅ USE SHARED UTILITY
import { isSameDay } from '@/utils/dateUtils';

const todaysFoods = foods.filter(food =>
  isSameDay(food.dateLogged, selectedDate)
);
```

**Expected Impact:** -5 to -10 lines

---

### Step 7: Clean Up Unused Imports

**Common Unused Imports:**
- Old component imports
- Unused icon imports
- Framer Motion

---

### Step 8: Clean Up Module Exports

**File:** `src/components/nutrition/v2/index.ts`

**After:**
```typescript
// ✅ Only export active components

// V2 Components
export { CalorieSummaryCardV2 } from './CalorieSummaryCardV2';
export { MacroProgressCardV2 } from './MacroProgressCardV2';
export { MealSectionV2 } from './MealSectionV2';
export { FoodItemV2 } from './FoodItemV2';
export { FoodFormModalV2 } from './FoodFormModalV2';
export { DateNavigatorV2 } from './DateNavigatorV2';
export { WeeklyChartV2 } from './WeeklyChartV2';

// Keep existing
export { BarcodeScanner } from '../BarcodeScanner';
export { FoodPhotoUpload } from '../FoodPhotoUpload';
```

---

### Step 9: Verification & Testing

**Manual Testing:**
- [ ] Food logging works (all 4 methods)
- [ ] Photo upload and AI analysis works
- [ ] Barcode scanning works
- [ ] Calorie/macro tracking accurate
- [ ] Date navigation works
- [ ] Meal sections display correctly
- [ ] Dashboard charts render
- [ ] Responsive design intact
- [ ] Error boundary catches errors

---

### Code Quality Checklist

- [ ] ✅ Error boundary added (already done!)
- [ ] ✅ Dead code removed
- [ ] ✅ Date utilities used
- [ ] ✅ Framer Motion replaced with CSS
- [ ] ✅ Theme colors consistent
- [ ] ✅ Unused imports removed
- [ ] ✅ Module exports clean
- [ ] ✅ Build succeeds
- [ ] ✅ Manual testing complete
- [ ] ✅ Module CLAUDE.md compliant

---

### Expected Overall Impact

**Metrics:**
- Lines removed: -100 to -300
- Files deleted: 3-8 legacy components
- Bundle size: -10-20KB
- Error boundaries: Already in place ✅
- Code grade: C/D range → A (95/100)

**Benefits:**
- ✅ Crash isolation
- ✅ Smaller bundle
- ✅ Less maintenance
- ✅ Consistent theming
- ✅ Better performance
- ✅ Cleaner codebase

---

## File Modification Summary

**Files to Create:** 7
- ✏️ `src/components/nutrition/v2/CalorieSummaryCardV2.tsx`
- ✏️ `src/components/nutrition/v2/MacroProgressCardV2.tsx`
- ✏️ `src/components/nutrition/v2/MealSectionV2.tsx`
- ✏️ `src/components/nutrition/v2/FoodItemV2.tsx`
- ✏️ `src/components/nutrition/v2/FoodFormModalV2.tsx`
- ✏️ `src/components/nutrition/v2/DateNavigatorV2.tsx`
- ✏️ `src/components/nutrition/v2/WeeklyChartV2.tsx`

**Files to Update:** 3
- ✏️ `src/pages/Nutrition.tsx` - Update header with gradient
- ✏️ `src/components/nutrition/NutritionTracker.tsx` - Use V2 components
- ✏️ `src/components/nutrition/NutritionDashboard.tsx` - Add charts and stats

**Files to Keep (Complex):** 3
- 📖 `src/components/nutrition/BarcodeScanner.tsx` - Camera integration
- 📖 `src/components/nutrition/FoodPhotoUpload.tsx` - Photo capture
- 📖 `src/components/nutrition/FoodSearch.tsx` - Database search

**Files to Delete (After Investigation):** 3-8
- 🗑️ Old food logging components (if unused)
- 🗑️ Legacy modal components
- 🗑️ Duplicate card components

**Reference Files:** 4
- 📖 `nutrition-design-spec.html`
- 📖 `src/pages/Together.tsx`
- 📖 `src/pages/Notes.tsx`
- 📖 `CLAUDE.md`

---

## Commit Message Template

```bash
feat: Complete Nutrition tab UI/UX enhancement with Together patterns

Updated Nutrition feature to match nutrition-design-spec.html and apply
all 25 UI/UX enhancement patterns from CLAUDE.md. Major improvements:

UI Components:
- Updated header: Terracotta gradient with clean title
- Created CalorieSummaryCardV2: Circular calorie progress ring
- Created MacroProgressCardV2: Protein/carbs/fat progress bars
- Created MealSectionV2: Meal grouping (breakfast/lunch/dinner/snacks)
- Created FoodItemV2: Enhanced food entry cards with photos
- Created DateNavigatorV2: Day navigation controls
- Created WeeklyChartV2: 7-day calorie bar chart

Modals (Together Pattern):
- FoodFormModalV2: 4 entry methods (manual, photo, barcode, search)
  - Manual entry with macro inputs
  - Photo upload with AI nutrition analysis
  - Barcode scanner integration
  - Food database search
  - Auto-save to localStorage
- Mobile drag handles, fixed headers/footers, scrollable content
- ESC key and backdrop support

Page Updates:
- NutritionTracker: Circular progress, meal sections, date nav
- NutritionDashboard: Weekly chart, stat cards, insights

Features:
- 2 views: Log Food, Dashboard
- Circular calorie progress ring (design spec)
- 4 meal sections with add buttons
- Macro tracking (protein, carbs, fat)
- Multiple food entry methods
- Photo upload with AI analysis
- Barcode scanning
- Food database search
- Weekly calorie chart
- Dashboard stats and insights
- Date navigation
- Goal tracking

Code Quality:
- Removed 3-8 legacy components
- Replaced duplicate date formatting
- Used theme colors consistently
- Cleaned up unused imports
- -100 to -300 lines removed

Technical:
- All V2 components in src/components/nutrition/v2/
- Error boundary already in place ✅
- Responsive mobile/desktop behavior
- Photo capture maintained
- Barcode scanning maintained

Fixes:
- Header matches design spec
- Circular calorie progress implemented
- Meal sections properly grouped
- Dashboard charts visualize trends

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Success Criteria

✅ Nutrition page matches `nutrition-design-spec.html` exactly
✅ All 25 UI/UX patterns from CLAUDE.md applied
✅ FoodFormModalV2 matches Together pattern
✅ Circular calorie progress implemented
✅ Meal sections properly grouped
✅ 4 food entry methods working
✅ Photo upload and AI analysis maintained
✅ Barcode scanning maintained
✅ Dashboard charts display weekly trends
✅ Responsive mobile/desktop
✅ Accessible
✅ No console errors

---

## Nutrition-Specific Challenges

### Challenge 1: Multiple Food Entry Methods

**Solution:**
- Single modal (FoodFormModalV2) with tabs for each method
- Manual entry tab with macro inputs
- Photo tab with camera/upload
- Barcode tab with scanner
- Search tab with database lookup

### Challenge 2: Photo Upload and AI Analysis

**Solution:**
- Keep existing FoodPhotoUpload component (complex)
- Integrate into FoodFormModalV2 photo tab
- Display AI-detected nutrition values
- Allow editing before saving

### Challenge 3: Barcode Scanning

**Solution:**
- Keep existing BarcodeScanner component (camera integration)
- Integrate into FoodFormModalV2 barcode tab
- Lookup nutrition from product database
- Populate form with scanned data

### Challenge 4: Meal Grouping

**Solution:**
- MealSectionV2 component for each meal type
- Store mealType with each food entry
- Filter foods by mealType when displaying
- Separate "Add Food" button for each meal

### Challenge 5: Circular Calorie Progress

**Solution:**
- SVG circle with stroke-dasharray/stroke-dashoffset
- Animate progress with CSS transition
- Display consumed/goal in center
- Match design spec gradient card

---

## Notes

- Nutrition already has FeatureErrorBoundary ✅
- Keep photo upload and barcode scanning (complex camera integration)
- Circular progress is key visual element from design spec
- Meal sections improve organization and clarity
- Dashboard should show trends and insights
- AI nutrition analysis is a premium feature
