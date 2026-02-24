# Shopping Manual Entry Bug - Fix Guide
## Critical Bug Fix (P0 BLOCKER)
## Date: February 24, 2026

---

## Bug Summary

**Error**: "Rendered more hooks than during the previous render"
**Location**: Shopping module → Add Item → Manual Entry
**Severity**: P0 BLOCKER (prevents production deployment)
**Impact**: Users cannot add shopping items manually (primary workflow completely broken)

---

## Root Cause Analysis

### The Problem

**File**: `src/shopping/components/v2/AddItemModalV2.tsx`
**Lines**: 65-70

```typescript
{(formState, setFormState) => {
  // Sync form state changes back to parent
  useEffect(() => {
    onFormChange(formState);
  }, [formState]);
```

**Issue**: The `useEffect` hook is called **inside a render prop function**, which violates React's Rules of Hooks.

### Why This Causes the Error

1. **Conditional Hook Rendering**: The `FormModalV2` component conditionally renders the children function based on internal state (likely when `isOpen` changes or during modal transitions)

2. **Inconsistent Hook Count**: When the modal opens/closes, the children function may not be called, causing React to see different numbers of hooks between renders

3. **React's Rules of Hooks**: Hooks MUST be called:
   - At the top level (not inside loops, conditions, or nested functions)
   - In the same order every render
   - Not conditionally

4. **The Violation**: By placing `useEffect` inside the render prop function `(formState, setFormState) => {...}`, the hook becomes conditional because the function may or may not execute depending on `FormModalV2`'s internal state

### How the Error Manifests

**User Flow**:
1. User clicks FAB button on Shopping page
2. Add Item Choice modal appears (✅ works)
3. User clicks "Manual Entry" option
4. `setShowAddItem(true)` is called
5. `AddItemModalV2` component renders
6. `FormModalV2` renders and calls children function
7. `useEffect` hook executes inside children function
8. Modal state changes (animation, focus management, etc.)
9. Children function re-executes
10. React detects different hook count → **CRASH**

**Error Message**:
```
Error: Rendered more hooks than during the previous render.
```

**Visual Result**: Error boundary appears with "Error in Shopping"

---

## The Fix

### Solution 1: Move useEffect Outside Render Prop (RECOMMENDED)

**Approach**: Synchronize form state using parent component's useEffect instead of inside the modal.

**File to Modify**: `src/shopping/components/v2/AddItemModalV2.tsx`

**Current Code** (Lines 42-70):
```typescript
return (
  <FormModalV2<ShoppingItemForm>
    isOpen={isOpen}
    onClose={onClose}
    title="Add Item Manually"
    defaultData={formData}
    initialData={formData}
    draftKey="shopping_add_item_draft"
    isPending={false}
    submitText="Add to List"
    onSubmit={async (data) => {
      const syntheticEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
      } as React.FormEvent;
      onSubmit(syntheticEvent);
    }}
    validate={(data) => {
      if (!data.name.trim()) return 'Item name is required';
      return null;
    }}
  >
    {(formState, setFormState) => {
      // ❌ PROBLEM: useEffect inside render prop
      useEffect(() => {
        onFormChange(formState);
      }, [formState]);

      return (
        <>{/* ...form fields... */}</>
      );
    }}
  </FormModalV2>
);
```

**Fixed Code**:
```typescript
return (
  <FormModalV2<ShoppingItemForm>
    isOpen={isOpen}
    onClose={onClose}
    title="Add Item Manually"
    defaultData={formData}
    initialData={formData}
    draftKey="shopping_add_item_draft"
    isPending={false}
    submitText="Add to List"
    onSubmit={async (data) => {
      const syntheticEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
      } as React.FormEvent;
      onSubmit(syntheticEvent);
    }}
    validate={(data) => {
      if (!data.name.trim()) return 'Item name is required';
      return null;
    }}
  >
    {(formState, setFormState) => {
      // ✅ SOLUTION: Remove useEffect entirely
      // Let parent handle synchronization via onFormChange callback
      // which gets called by input onChange events

      return (
        <>
          {/* Item Name */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
              Item Name *
            </label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) => {
                setFormState({ ...formState, name: e.target.value });
                // ✅ Call onFormChange here directly
                onFormChange({ ...formState, name: e.target.value });
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="e.g., Organic Bananas"
              required
              autoFocus
            />
          </div>

          {/* ... other form fields with same pattern ... */}
        </>
      );
    }}
  </FormModalV2>
);
```

**Changes Required**:
1. Remove `useEffect` hook (lines 67-69)
2. Add `onFormChange` calls to each input's `onChange` handler
3. This ensures parent state stays synchronized without using hooks

---

### Solution 2: Restructure Component to Avoid Render Prop

**Approach**: Create a separate component for form fields that can use hooks at top level.

**Create New File**: `src/shopping/components/v2/AddItemFormFields.tsx`

```typescript
import React, { useEffect } from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { ShoppingItemForm } from '../../types/forms';
import type { Store } from '../../types';
import { CATEGORY_ICONS, STORE_TYPES } from '../../constants';
import { validateCategory, validatePriority } from '../../utils/typeValidators';

interface AddItemFormFieldsProps {
  formState: ShoppingItemForm;
  setFormState: (data: ShoppingItemForm) => void;
  barcodeResult: string | null;
  stores: Store[];
  onFormChange: (updates: Partial<ShoppingItemForm>) => void;
  onBarcodeChange: (barcode: string) => void;
}

export const AddItemFormFields: React.FC<AddItemFormFieldsProps> = ({
  formState,
  setFormState,
  barcodeResult,
  stores,
  onFormChange,
  onBarcodeChange,
}) => {
  const colors = useThemeColors();

  // ✅ NOW SAFE: useEffect at component top level
  useEffect(() => {
    onFormChange(formState);
  }, [formState, onFormChange]);

  return (
    <>
      {/* All form fields here */}
    </>
  );
};
```

**Update**: `src/shopping/components/v2/AddItemModalV2.tsx`

```typescript
import { AddItemFormFields } from './AddItemFormFields';

export const AddItemModalV2: React.FC<AddItemModalV2Props> = ({
  isOpen,
  formData,
  barcodeResult,
  stores,
  onClose,
  onSubmit,
  onFormChange,
  onBarcodeChange,
}) => {
  return (
    <FormModalV2<ShoppingItemForm>
      isOpen={isOpen}
      onClose={onClose}
      title="Add Item Manually"
      defaultData={formData}
      initialData={formData}
      draftKey="shopping_add_item_draft"
      isPending={false}
      submitText="Add to List"
      onSubmit={async (data) => {
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
        } as React.FormEvent;
        onSubmit(syntheticEvent);
      }}
      validate={(data) => {
        if (!data.name.trim()) return 'Item name is required';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <AddItemFormFields
          formState={formState}
          setFormState={setFormState}
          barcodeResult={barcodeResult}
          stores={stores}
          onFormChange={onFormChange}
          onBarcodeChange={onBarcodeChange}
        />
      )}
    </FormModalV2>
  );
};
```

---

### Solution 3: Check if FormModalV2 Needs Update

**Alternative**: The issue might also be in `FormModalV2` if it conditionally renders children.

**File to Check**: `src/components/v2/FormModalV2.tsx`

**Look for**:
```typescript
// ❌ BAD: Conditional rendering
{isOpen && children(formState, setFormState)}

// ✅ GOOD: Always render, use CSS for visibility
{children(formState, setFormState)}
```

If `FormModalV2` conditionally renders children based on `isOpen`, update it to always render but hide with CSS instead.

---

## Recommended Fix

**Use Solution 1**: Remove `useEffect` and call `onFormChange` directly in input handlers.

**Why**:
1. Simplest fix (no new files)
2. Most explicit (clear data flow)
3. No performance impact
4. Follows React best practices

**Estimated Time**: 15 minutes
**Risk Level**: Low (localized change)
**Testing Required**: Manual Entry flow only

---

## Implementation Steps

### Step 1: Backup Current File

```bash
cp src/shopping/components/v2/AddItemModalV2.tsx src/shopping/components/v2/AddItemModalV2.tsx.backup
```

### Step 2: Remove useEffect Hook

**File**: `src/shopping/components/v2/AddItemModalV2.tsx`
**Line**: 67-69

**Delete these lines**:
```typescript
useEffect(() => {
  onFormChange(formState);
}, [formState]);
```

### Step 3: Add onFormChange to Each Input

Update all input `onChange` handlers to call both `setFormState` AND `onFormChange`:

**Pattern**:
```typescript
// BEFORE:
onChange={(e) => setFormState({ ...formState, name: e.target.value })}

// AFTER:
onChange={(e) => {
  const newState = { ...formState, name: e.target.value };
  setFormState(newState);
  onFormChange(newState);
}}
```

**Apply to these inputs** (11 total):
1. Line 81: Item Name
2. Line 99: Quantity
3. Line 109: Unit
4. Line 133: Category
5. Line 149: Priority
6. Line 165: Preferred Store
7. Line 191: Est. Price
8. Line 203: Brand
9. Line 219: Barcode (already has onBarcodeChange, skip)
10. Line 233: Notes

### Step 4: Test the Fix

1. Start dev server: `npm run dev`
2. Navigate to `/shopping`
3. Click FAB button (+ icon)
4. Click "Manual Entry"
5. **Expected**: Modal opens with form fields (NO ERROR)
6. Fill out form and submit
7. **Expected**: Item added successfully

### Step 5: Regression Testing

Test other add item methods still work:
- [ ] Voice Input
- [ ] Barcode Scanner
- [ ] Edit existing item

---

## Testing Checklist

### Unit Test (Optional but Recommended)

**File**: `src/shopping/components/v2/__tests__/AddItemModalV2.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AddItemModalV2 } from '../AddItemModalV2';

describe('AddItemModalV2', () => {
  it('should not crash when opening modal', () => {
    const mockProps = {
      isOpen: true,
      formData: { name: '', quantity: 1, /* ... */ },
      barcodeResult: null,
      stores: [],
      onClose: jest.fn(),
      onSubmit: jest.fn(),
      onFormChange: jest.fn(),
      onBarcodeChange: jest.fn(),
    };

    // Should not throw "Rendered more hooks" error
    expect(() => {
      render(<AddItemModalV2 {...mockProps} />);
    }).not.toThrow();
  });

  it('should call onFormChange when input changes', () => {
    const onFormChange = jest.fn();
    const mockProps = {
      isOpen: true,
      formData: { name: '', quantity: 1, /* ... */ },
      barcodeResult: null,
      stores: [],
      onClose: jest.fn(),
      onSubmit: jest.fn(),
      onFormChange,
      onBarcodeChange: jest.fn(),
    };

    render(<AddItemModalV2 {...mockProps} />);

    const input = screen.getByPlaceholderText('e.g., Organic Bananas');
    fireEvent.change(input, { target: { value: 'Milk' } });

    expect(onFormChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Milk' })
    );
  });
});
```

### Manual Testing

**Test Case 1: Manual Entry Opens**
- [ ] Navigate to /shopping
- [ ] Click FAB button
- [ ] Click "Manual Entry"
- [ ] Modal opens with all form fields
- [ ] NO error message
- [ ] NO console errors

**Test Case 2: Form Submission**
- [ ] Fill in Item Name: "Test Item"
- [ ] Leave other fields as default
- [ ] Click "Add to List"
- [ ] Item appears in shopping list
- [ ] Modal closes
- [ ] Toast notification appears

**Test Case 3: Form State Sync**
- [ ] Open Manual Entry
- [ ] Type in each field
- [ ] Verify parent state updates (check with React DevTools)
- [ ] Form data should sync without useEffect

**Test Case 4: Modal Close/Reopen**
- [ ] Open Manual Entry
- [ ] Type some text
- [ ] Close modal (X button or backdrop click)
- [ ] Reopen Manual Entry
- [ ] Draft should be restored (if auto-save works)

**Test Case 5: Rapid Open/Close**
- [ ] Rapidly open and close modal 10 times
- [ ] Should not crash
- [ ] No console errors

---

## Verification

### Before Fix
```
✅ FAB button works
✅ Add Item Choice modal works
❌ Manual Entry crashes with React hooks error
```

### After Fix
```
✅ FAB button works
✅ Add Item Choice modal works
✅ Manual Entry opens successfully
✅ Form fields render correctly
✅ Item can be added to list
✅ No console errors
```

---

## Similar Issues to Check

This same pattern might exist in other modals. Check these files:

1. **EditItemModalV2.tsx** - Same pattern?
   - `src/shopping/components/v2/EditItemModalV2.tsx`
   - Search for `useEffect` inside render props

2. **AddPantryItemModalV2.tsx** - Same pattern?
   - `src/shopping/components/v2/AddPantryItemModalV2.tsx`
   - Search for `useEffect` inside render props

3. **Other V2 Modals** - Check all FormModalV2 usage
   ```bash
   grep -r "FormModalV2" src/
   ```

---

## Root Cause Prevention

### Code Review Checklist

When reviewing modal components:
- [ ] No hooks inside render props
- [ ] No hooks inside callbacks
- [ ] No hooks inside loops
- [ ] No hooks inside conditions
- [ ] useEffect only at top level
- [ ] Hooks called in same order every render

### ESLint Rule

Add `eslint-plugin-react-hooks` to catch this:

```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

This would have caught the error during development.

---

## Success Criteria

**Definition of Done**:
1. ✅ Manual Entry modal opens without error
2. ✅ All form fields render correctly
3. ✅ Form submission creates shopping item
4. ✅ No React hooks errors in console
5. ✅ Unit tests pass (if added)
6. ✅ Manual testing complete
7. ✅ Regression tests pass
8. ✅ Similar issues fixed (Edit modal, etc.)

**Production Readiness**:
- After this fix, Shopping module should be production ready
- This was the ONLY P0 blocker
- All other Shopping features tested and working

---

## Timeline

**Estimated Fix Time**: 30 minutes
- Code changes: 15 minutes
- Testing: 10 minutes
- Documentation: 5 minutes

**Deployment Timeline**:
- Fix immediately (today)
- Test in staging (1 hour)
- Deploy to production (tomorrow)

---

## Additional Notes

### Why This Wasn't Caught Earlier

1. **Migration Oversight**: Comments indicate this modal was recently migrated to use FormModalV2
2. **Conditional Rendering**: The bug only manifests when modal state changes (open/close transitions)
3. **No E2E Tests**: Automated tests would have caught this
4. **QA Timing**: Manual testing discovered it (Session 3, Feb 24)

### Lessons Learned

1. **Follow Rules of Hooks**: Never call hooks conditionally
2. **Test Migrations**: Thoroughly test after refactoring
3. **Add E2E Tests**: Prevent regressions
4. **Code Review**: Peer review would have caught this
5. **ESLint**: Enable react-hooks plugin

---

## References

**React Documentation**:
- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [useEffect](https://react.dev/reference/react/useEffect)

**Error Message**:
- "Rendered more hooks than during the previous render"
- Cause: Inconsistent hook count between renders
- Solution: Ensure hooks called at top level only

**Related Files**:
- `src/shopping/components/v2/AddItemModalV2.tsx` (primary fix)
- `src/pages/ShoppingSmart.tsx` (usage)
- `src/components/v2/FormModalV2.tsx` (base modal)

---

**Fix Prepared By**: Claude AI QA Agent
**Date**: February 24, 2026
**Priority**: P0 BLOCKER
**Status**: Ready for Implementation
**Estimated Impact**: Unblocks Shopping module for production deployment
