# Collapsible Meal Input - UX Improvement

## Problem
After adding a meal (e.g., "oatmeal") and pressing Enter, the input field remained visible, creating visual clutter and confusion about whether more input was expected.

## Solution
Implemented **collapsible input behavior**:
- ✅ Empty slot: Input always visible
- ✅ Slot with meals: Shows "Add meal" button instead
- ✅ Click button: Input appears with autofocus
- ✅ Add meal + Enter: Input collapses back to button

---

## User Experience

### Before (Always Visible)
```
┌─────────────────────────────┐
│ oatmeal                  [x]│
│ Type to add...              │ ← Always visible (cluttered)
└─────────────────────────────┘
```

### After (Collapsible)
```
┌─────────────────────────────┐
│ oatmeal                  [x]│
│ [+] Add meal                │ ← Button (clean)
└─────────────────────────────┘

User clicks button:
┌─────────────────────────────┐
│ oatmeal                  [x]│
│ Type to add...              │ ← Input appears
└─────────────────────────────┘

User types "bagel" + Enter:
┌─────────────────────────────┐
│ oatmeal                  [x]│
│ bagel                    [x]│
│ [+] Add meal                │ ← Button returns
└─────────────────────────────┘
```

---

## Implementation

### 1. Added `showByDefault` Prop
**Location**: `src/pages/MealPlanning.tsx:860-865`

```typescript
function AddMealControl({
  dateKey,
  mealType,
  onAdded,
  showByDefault = true  // ← New prop
}: {
  dateKey: string;
  mealType: string;
  onAdded?: () => void;
  showByDefault?: boolean;  // ← New prop
})
```

### 2. Added Input Toggle State
**Location**: `src/pages/MealPlanning.tsx:882`

```typescript
const [showInput, setShowInput] = React.useState(showByDefault);
```

### 3. Conditional Rendering
**Location**: `src/pages/MealPlanning.tsx:1098-1110`

```typescript
// If input is hidden, show a "+" button
if (!showInput) {
  return (
    <button
      type="button"
      onClick={() => setShowInput(true)}
      className="w-full rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-400 hover:text-slate-600 hover:border-slate-400 transition flex items-center justify-center gap-2"
    >
      <Plus className="w-4 h-4" />
      <span>Add meal</span>
    </button>
  );
}
```

### 4. Auto-Hide After Adding Meal
**Location**: `src/pages/MealPlanning.tsx:1054-1057`

```typescript
// Hide input if it wasn't shown by default
if (!showByDefault) {
  setShowInput(false);
}
```

### 5. Grid Integration
**Location**: `src/pages/MealPlanning.tsx:1951-1970`

```typescript
{dayMeals.length > 0 ? (
  <>
    <ul className="space-y-1">
      {dayMeals.map((meal) => (
        <MealItem key={meal.id} meal={meal} recipes={recipes} />
      ))}
    </ul>
    <AddMealControl
      dateKey={key}
      mealType={mealType}
      showByDefault={false}  // ← Hidden by default
    />
  </>
) : (
  <AddMealControl
    dateKey={key}
    mealType={mealType}
    showByDefault={true}  // ← Shown by default
  />
)}
```

---

## Behavior Matrix

| Scenario | Input Visible? | Action |
|----------|---------------|---------|
| Empty slot | ✅ Yes (auto) | Type to add first meal |
| Has 1+ meals | ❌ No (button) | Click "Add meal" to show input |
| Button clicked | ✅ Yes (focus) | Input appears with autofocus |
| Meal added | ❌ No (collapsed) | Input hides, button returns |
| Add failed | ✅ Yes (stays) | Input remains for retry |

---

## Features Preserved

✅ **Draft Auto-Save**: Still works! Saved text restored when button clicked
✅ **Multiple Meals**: Can add multiple meals per slot
✅ **Keyboard Navigation**: Arrow keys, Enter, Escape all work
✅ **Error Handling**: Input stays visible on failure
✅ **Visual Feedback**: "Draft saved" indicator still appears

---

## Testing Steps

### Test 1: Empty Slot (Always Visible)
1. Navigate to empty breakfast slot
2. **Verify**: Input field visible with placeholder "Type to add..."
3. Type "Oatmeal" and press Enter
4. **Verify**: Input collapses to "[+] Add meal" button

### Test 2: Add Multiple Meals
1. Click "[+] Add meal" button
2. **Verify**: Input appears with autofocus
3. Type "Bagel" and press Enter
4. **Verify**: "Bagel" added, button returns
5. Click button again
6. Type "Smoothie" and press Enter
7. **Verify**: 3 meals total (Oatmeal, Bagel, Smoothie)

### Test 3: Draft Restoration
1. Click "[+] Add meal" button
2. Type "Yogurt"
3. Navigate away (click another page)
4. Come back to meal planning
5. Click same "[+] Add meal" button
6. **Verify**: Input shows "Yogurt" (draft restored)

### Test 4: Error Handling
1. Disconnect internet
2. Click "[+] Add meal" button
3. Type "Toast" and press Enter
4. **Verify**: Error logged, input stays visible
5. **Verify**: "Toast" text preserved (not cleared)
6. Reconnect internet, press Enter
7. **Verify**: Meal added, input collapses

### Test 5: Visual Feedback
1. Click "[+] Add meal" button
2. Type "P"
3. **Verify**: "Draft saved" appears briefly
4. Continue typing "ancakes"
5. **Verify**: "Draft saved" appears again
6. Press Enter
7. **Verify**: Input collapses, draft cleared

---

## Design Decisions

### Why Not Use `display: none`?
- Used conditional rendering instead
- Better for screen readers
- Prevents autofocus issues

### Why AutoFocus?
```typescript
<input ... autoFocus />
```
- Clicking button → Input appears → Immediate typing
- No extra click needed
- Better UX flow

### Why Same Button Style as Input?
```css
border-dashed border-slate-300
```
- Visual consistency
- Users recognize it's an input area
- Matches existing design language

### Why Keep showByDefault Prop?
- Allows future flexibility
- Can easily change behavior per use case
- Explicit > implicit

---

## Edge Cases Handled

✅ **Rapid Clicking**: Button → Input → Add → Button (smooth)
✅ **Keyboard Only**: Tab to button → Enter → Type → Enter to add
✅ **Draft with Button**: Click button → Draft restores → Continue typing
✅ **Empty Draft**: No draft → Button → Empty input → Ready to type
✅ **Long Meal Names**: Button text doesn't wrap, truncates cleanly

---

## Files Modified

```
src/pages/MealPlanning.tsx
  - AddMealControl: Added showByDefault prop (860-865)
  - AddMealControl: Added showInput state (882)
  - AddMealControl: Added button conditional (1098-1110)
  - AddMealControl: Added collapse logic (1054-1057)
  - AddMealControl: Added autoFocus to input (1123)
  - MealPlanning: Updated grid rendering (1951-1970)
```

---

## Rollback Instructions

If needed:
```bash
git checkout HEAD -- src/pages/MealPlanning.tsx
npm run dev
```

Or manually change line 1961 to:
```typescript
showByDefault={true}  // Always show input
```

---

## Summary

**What**: Collapsible input field for meal slots with existing meals
**Why**: Reduce visual clutter, cleaner UI
**How**: Button toggles input, collapses after adding meal
**Impact**: Better UX, preserved functionality

Users now have a **clean, intentional workflow** for adding meals! 🎉
