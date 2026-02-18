# Shopping Tab UI/UX Enhancement Plan

## Context

The Shopping feature (ShoppingSmart.tsx) needs to be updated to match the design specifications in `shopping-design-spec.html` and apply all 25 UI/UX enhancement patterns from CLAUDE.md (established by the Together tab reference implementation).

**Current State:**
- Shopping page exists at `src/pages/ShoppingSmart.tsx` with partial V2 components
- Has V2 components: ShoppingHeaderV2, ShoppingItemCardV2
- 4 main views: Master List, Pantry, Stores, History
- Advanced features: Barcode scanning, voice input, receipt scanning, store distribution
- Many modals already exist (15+ modals)
- Missing: Centered layout, simplified header, complete Together modal patterns
- Header uses gradient text (needs simplification)

**Goal:**
- Match `shopping-design-spec.html` styling exactly
- Apply all Together tab UI patterns
- Maintain existing functionality (barcode, voice, receipt, pantry, stores)
- Ensure responsive mobile/desktop behavior
- Simplify header to match Together tab
- Upgrade all modals to Together pattern

**Why This Matters:**
- Shopping is a highly interactive feature with advanced input methods
- Has unique features (barcode scan, voice, receipt scan, store distribution)
- Demonstrates how to handle complex input modalities
- Pantry tracking is a critical sub-feature
- Will serve as reference for other inventory-based features

---

## Critical Files to Modify

### Primary Files (Must Update)
1. `src/pages/ShoppingSmart.tsx` - Main page component (currently ~500 lines)
2. `src/shopping/components/v2/ShoppingHeaderV2.tsx` - Simplify header (remove gradient)
3. `src/shopping/components/v2/ShoppingItemCardV2.tsx` - Enhanced card styling
4. All modals in `src/shopping/components/modals/` - Upgrade to Together pattern

### V2 Components to Create
1. `src/shopping/components/v2/ShoppingHeaderV2.tsx` - Update (simplify)
2. `src/shopping/components/v2/AddItemModalV2.tsx` - Together pattern
3. `src/shopping/components/v2/EditItemModalV2.tsx` - Together pattern
4. `src/shopping/components/v2/AddPantryItemModalV2.tsx` - Together pattern
5. `src/shopping/components/v2/PantryItemDetailsModalV2.tsx` - Together pattern
6. `src/shopping/components/v2/AddStoreModalV2.tsx` - Together pattern
7. `src/shopping/components/v2/FilterBarV2.tsx` - Pill-style filters
8. `src/shopping/components/v2/ViewSelectorV2.tsx` - View tabs
9. `src/shopping/components/v2/StatsCardsV2.tsx` - Shopping stats
10. `src/shopping/components/v2/PantryCardV2.tsx` - Pantry item card
11. `src/shopping/components/v2/StoreCardV2.tsx` - Store card
12. `src/shopping/components/v2/index.ts` - Barrel exports

### Modals to Upgrade (15+ modals)
- AddItemModal.tsx → AddItemModalV2.tsx
- EditItemModal.tsx → EditItemModalV2.tsx
- AddPantryItemModal.tsx → AddPantryItemModalV2.tsx
- PantryItemDetailsModal.tsx → PantryItemDetailsModalV2.tsx
- AddStoreModal.tsx → AddStoreModalV2.tsx
- BarcodeScannerModal.tsx → Keep as-is (camera modal different pattern)
- ReceiptScanningModal.tsx → Keep as-is (camera modal different pattern)
- StoreSuggestionsModal.tsx → StoreSuggestionsModalV2.tsx
- StoreShoppingListModal.tsx → StoreShoppingListModalV2.tsx
- AddItemChoiceModal.tsx → AddItemChoiceModalV2.tsx
- AddToPantryPrompt.tsx → AddToPantryPromptV2.tsx
- ReplenishModal.tsx → ReplenishModalV2.tsx

### Reference Files (Do NOT Modify)
- `src/pages/Together.tsx` - Reference implementation
- `src/pages/Notes.tsx` - Recent implementation
- `shopping-design-spec.html` - Design specification
- `CLAUDE.md` - UI/UX standards

---

## Phase 0: Discovery & Verification ⭐ **START HERE**

Before making any changes, verify the current state to avoid wasted effort.

### Step 1: Compare with Design Spec
```bash
# Open design spec in browser
open shopping-design-spec.html

# Run dev server and navigate to Shopping tab
npm run dev
# Navigate to: http://localhost:5173/ → Shopping tab
```

**Compare side-by-side:**
- [ ] Header design (gradient text vs simple)
- [ ] View tabs (Master List/Pantry/Stores/History)
- [ ] Shopping item cards
- [ ] Add item modal structure
- [ ] Barcode scanner modal
- [ ] Receipt scanner modal
- [ ] Pantry cards
- [ ] Store cards
- [ ] Stats display
- [ ] Empty states
- [ ] FAB placement

### Step 2: Inspect Current Database Schema
```typescript
// Shopping items: shopping_items table
// Pantry items: pantry_items table
// Stores: stores table
// Shopping lists: shopping_lists table

// Key fields to verify:
// ShoppingItem:
// - category (produce | dairy | meat | pantry | frozen | bakery | deli | household | personal | electronics | other)
// - priority (low | medium | high)
// - purchased (boolean)
// - barcode (string)
// - assignedStore (store ID)

// PantryItem:
// - expiryDate (date)
// - quantity (number)
// - location (string - fridge, freezer, pantry, etc.)

// Store:
// - type (grocery | wholesale | specialty | organic | international | pharmacy)
// - preferences (price/quality/cleanliness/service ratings)
// - coordinates (lat/lng)
```

### Step 3: Check Current Component Structure
```bash
# List existing V2 components
ls -la src/shopping/components/v2/

# Expected output:
# - ShoppingHeaderV2.tsx ✓ (exists, needs simplification)
# - ShoppingItemCardV2.tsx ✓ (exists, needs verification)

# List all modals
ls -la src/shopping/components/modals/

# Expected: 15+ modal files to upgrade
```

### Step 4: Review Current Hooks
```bash
# Check Shopping query hooks
cat src/hooks/useShoppingQuery.ts | head -50
cat src/hooks/usePantryQuery.ts | head -50
cat src/hooks/useStoresQuery.ts | head -50
```

**Verify hooks available:**
- [ ] `useShoppingItems()` - Fetch items
- [ ] `usePantryItems()` - Fetch pantry
- [ ] `useStoresQuery()` - Fetch stores
- [ ] `useCreateShoppingItem()`
- [ ] `useUpdateShoppingItem()`
- [ ] `useDeleteShoppingItem()`
- [ ] `useCreatePantryItem()`
- [ ] `useUpdatePantryItem()`
- [ ] `useDeletePantryItem()`
- [ ] `useCreateStore()`
- [ ] Voice, barcode, receipt hooks

### Step 5: Identify Gaps

**From design spec comparison, identify missing/broken:**
- Header has gradient text (should be simple like Together)
- All modals need Together pattern upgrade
- No centered layout
- No filter bar with pills
- Stats display needs styling
- [Add more as you discover them]

**Document in notes:**
```
Current Issues to Fix:
1. Header uses gradient text (should be simple)
2. Modals don't match Together pattern (15+ modals to upgrade)
3. No centered layout (900px max-width)
4. No filter bar with pills
5. Stats need better styling
6. [Add more as you discover them]
```

---

## Implementation Plan

### Phase 1: Page Layout - Centered Container

**File:** `src/pages/ShoppingSmart.tsx`

**Changes:**
1. Wrap entire page content in centered container pattern:
   ```tsx
   import { useThemeColors } from '@/hooks/useThemeColors';

   const colors = useThemeColors();

   return (
     <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
       <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
         {/* All content */}
         <ShoppingHeaderV2 />
         {/* View selector, stats, filters, content */}
       </div>
     </div>
   );
   ```

2. Update Layout.tsx to exclude duplicate header:
   ```typescript
   // src/components/Layout.tsx
   {!isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && activeView !== 'todos' && activeView !== 'shopping' && (
   {isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && activeView !== 'todos' && activeView !== 'shopping' && (
   ```

**Expected Outcome:**
- Content centered on desktop (max 900px wide)
- Full width on mobile (minus padding)
- No duplicate "Shopping" header
- Matches Together/Notes/Goals/Tasks layout

---

### Phase 2: Update ShoppingHeaderV2 Component

**File:** `src/shopping/components/v2/ShoppingHeaderV2.tsx`

**Current:**
```tsx
// Uses gradient text with voice/barcode/filter buttons
<h1 style={{
  background: gradients.text,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}}>
  {title}
</h1>
```

**Changes:**
1. Simplify to match Together tab pattern:
   ```tsx
   import React from 'react';
   import { useThemeColors } from '@/hooks/useThemeColors';

   export const ShoppingHeaderV2: React.FC = () => {
     const colors = useThemeColors();

     return (
       <div className="mb-6">
         <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
           <span className="text-4xl">🛒</span>
           Shopping
         </h1>
         <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
           Track your shopping lists and pantry
         </p>
       </div>
     );
   };
   ```

2. Move voice/barcode/filter buttons to action bar or FAB menu

**Why This Change:**
- Gradient text inconsistent with Together pattern
- Simple header matches established pattern
- Cleaner design
- Action buttons belong in toolbar, not header

**Expected Outcome:**
- Simple header with emoji 🛒
- No gradient text
- No action buttons in header
- Matches Together/Notes/Goals/Tasks style

---

### Phase 3: Create ViewSelectorV2 Component

**File:** `src/shopping/components/v2/ViewSelectorV2.tsx` (Create new)

**Changes:**
1. Create view selector with SegmentedControlV2:
   ```tsx
   import React from 'react';
   import { SegmentedControlV2 } from '@/components/v2/SegmentedControlV2';

   export type ShoppingView = 'list' | 'pantry' | 'stores' | 'history';

   interface ViewSelectorV2Props {
     activeView: ShoppingView;
     onChange: (view: ShoppingView) => void;
   }

   export const ViewSelectorV2: React.FC<ViewSelectorV2Props> = ({
     activeView,
     onChange,
   }) => {
     return (
       <div className="mb-6">
         <SegmentedControlV2
           options={[
             { value: 'list', label: '🛒 List' },
             { value: 'pantry', label: '🥫 Pantry' },
             { value: 'stores', label: '🏪 Stores' },
             { value: 'history', label: '📜 History' },
           ]}
           value={activeView}
           onChange={(value) => onChange(value as ShoppingView)}
         />
       </div>
     );
   };
   ```

**Expected Outcome:**
- Pill-style tab navigation
- Active view highlighted with terracotta
- Smooth transitions
- Matches Together pattern

---

### Phase 4: Create StatsCardsV2 Component

**File:** `src/shopping/components/v2/StatsCardsV2.tsx` (Create new)

**Changes:**
1. Create shopping stats cards:
   ```tsx
   import React from 'react';
   import { useThemeColors } from '@/hooks/useThemeColors';

   interface StatsCardsV2Props {
     totalItems: number;
     completedItems: number;
     totalCost: number;
     remainingCost: number;
   }

   export const StatsCardsV2: React.FC<StatsCardsV2Props> = ({
     totalItems,
     completedItems,
     totalCost,
     remainingCost,
   }) => {
     const colors = useThemeColors();

     return (
       <div className="grid grid-cols-2 gap-3 mb-6">
         {/* Total Items Card */}
         <div
           className="p-4 rounded-xl border"
           style={{
             backgroundColor: colors.bg.white,
             borderColor: colors.border.light,
           }}
         >
           <div className="flex items-center gap-2 mb-1">
             <span className="text-2xl">📋</span>
             <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
               {totalItems}
             </div>
           </div>
           <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>
             Total Items
           </div>
         </div>

         {/* Completed Items Card */}
         <div
           className="p-4 rounded-xl border"
           style={{
             backgroundColor: colors.bg.white,
             borderColor: colors.border.light,
           }}
         >
           <div className="flex items-center gap-2 mb-1">
             <span className="text-2xl">✅</span>
             <div className="text-2xl font-bold" style={{ color: '#10B981' }}>
               {completedItems}
             </div>
           </div>
           <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>
             Completed
           </div>
         </div>

         {/* Total Cost Card */}
         <div
           className="p-4 rounded-xl border"
           style={{
             backgroundColor: colors.bg.white,
             borderColor: colors.border.light,
           }}
         >
           <div className="flex items-center gap-2 mb-1">
             <span className="text-2xl">💰</span>
             <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
               ${totalCost.toFixed(2)}
             </div>
           </div>
           <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>
             Total Cost
           </div>
         </div>

         {/* Remaining Cost Card */}
         <div
           className="p-4 rounded-xl border"
           style={{
             backgroundColor: colors.bg.white,
             borderColor: colors.border.light,
           }}
         >
           <div className="flex items-center gap-2 mb-1">
             <span className="text-2xl">📊</span>
             <div className="text-2xl font-bold" style={{ color: '#C18B5E' }}>
               ${remainingCost.toFixed(2)}
             </div>
           </div>
           <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>
             Remaining
           </div>
         </div>
       </div>
     );
   };
   ```

**Expected Outcome:**
- 2x2 grid of stats cards
- Icons for each metric
- Color-coded numbers
- Responsive design

---

### Phase 5: Create FilterBarV2 Component

**File:** `src/shopping/components/v2/FilterBarV2.tsx` (Create new)

**Changes:**
1. Create pill-style filter buttons:
   ```tsx
   import React from 'react';
   import { useThemeColors } from '@/hooks/useThemeColors';
   import { Search } from 'lucide-react';

   export type CategoryFilter = 'all' | 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'bakery' | 'household' | 'other';
   export type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
   export type StoreFilter = 'all' | string; // 'all' or store ID

   interface FilterBarV2Props {
     categoryFilter: CategoryFilter;
     onCategoryFilterChange: (filter: CategoryFilter) => void;
     priorityFilter: PriorityFilter;
     onPriorityFilterChange: (filter: PriorityFilter) => void;
     storeFilter: StoreFilter;
     onStoreFilterChange: (filter: StoreFilter) => void;
     stores: Array<{ id: string; name: string; color: string }>;
     searchQuery: string;
     onSearchChange: (query: string) => void;
     showPurchasedOnly: boolean;
     onTogglePurchased: () => void;
   }

   export const FilterBarV2: React.FC<FilterBarV2Props> = ({
     categoryFilter,
     onCategoryFilterChange,
     priorityFilter,
     onPriorityFilterChange,
     storeFilter,
     onStoreFilterChange,
     stores,
     searchQuery,
     onSearchChange,
     showPurchasedOnly,
     onTogglePurchased,
   }) => {
     const colors = useThemeColors();

     const categoryOptions: { value: CategoryFilter; label: string; emoji: string }[] = [
       { value: 'all', label: 'All', emoji: '🛒' },
       { value: 'produce', label: 'Produce', emoji: '🥬' },
       { value: 'dairy', label: 'Dairy', emoji: '🥛' },
       { value: 'meat', label: 'Meat', emoji: '🥩' },
       { value: 'pantry', label: 'Pantry', emoji: '🥫' },
       { value: 'frozen', label: 'Frozen', emoji: '🧊' },
       { value: 'bakery', label: 'Bakery', emoji: '🍞' },
       { value: 'household', label: 'Household', emoji: '🧹' },
       { value: 'other', label: 'Other', emoji: '📦' },
     ];

     const priorityOptions: { value: PriorityFilter; label: string }[] = [
       { value: 'all', label: 'All' },
       { value: 'high', label: '🔥 High' },
       { value: 'medium', label: 'Medium' },
       { value: 'low', label: 'Low' },
     ];

     return (
       <div className="mb-6 space-y-3">
         {/* Search Bar */}
         <div className="relative">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: colors.text.tertiary }} />
           <input
             type="text"
             value={searchQuery}
             onChange={(e) => onSearchChange(e.target.value)}
             placeholder="Search items..."
             className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
           />
         </div>

         {/* Quick Filters */}
         <div className="flex gap-2 flex-wrap">
           <button
             onClick={onTogglePurchased}
             className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
             style={{
               background: showPurchasedOnly
                 ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                 : colors.bg.secondary,
               borderWidth: '2px',
               borderStyle: 'solid',
               borderColor: showPurchasedOnly ? '#C18B5E' : 'transparent',
               color: showPurchasedOnly ? '#C18B5E' : colors.text.secondary,
             }}
           >
             ✅ Purchased Only
           </button>
         </div>

         {/* Category Filter Pills */}
         <div>
           <div className="text-xs font-semibold mb-2" style={{ color: colors.text.tertiary }}>
             Category
           </div>
           <div className="flex gap-2 flex-wrap">
             {categoryOptions.map((option) => (
               <button
                 key={option.value}
                 onClick={() => onCategoryFilterChange(option.value)}
                 className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                 style={{
                   background: categoryFilter === option.value
                     ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                     : colors.bg.secondary,
                   borderWidth: '2px',
                   borderStyle: 'solid',
                   borderColor: categoryFilter === option.value ? '#C18B5E' : 'transparent',
                   color: categoryFilter === option.value ? '#C18B5E' : colors.text.secondary,
                 }}
               >
                 {option.emoji} {option.label}
               </button>
             ))}
           </div>
         </div>

         {/* Priority Filter Pills */}
         <div>
           <div className="text-xs font-semibold mb-2" style={{ color: colors.text.tertiary }}>
             Priority
           </div>
           <div className="flex gap-2 flex-wrap">
             {priorityOptions.map((option) => (
               <button
                 key={option.value}
                 onClick={() => onPriorityFilterChange(option.value)}
                 className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                 style={{
                   background: priorityFilter === option.value
                     ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                     : colors.bg.secondary,
                   borderWidth: '2px',
                   borderStyle: 'solid',
                   borderColor: priorityFilter === option.value ? '#C18B5E' : 'transparent',
                   color: priorityFilter === option.value ? '#C18B5E' : colors.text.secondary,
                 }}
               >
                 {option.label}
               </button>
             ))}
           </div>
         </div>

         {/* Store Filter Pills */}
         {stores.length > 0 && (
           <div>
             <div className="text-xs font-semibold mb-2" style={{ color: colors.text.tertiary }}>
               Store
             </div>
             <div className="flex gap-2 flex-wrap">
               <button
                 onClick={() => onStoreFilterChange('all')}
                 className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                 style={{
                   background: storeFilter === 'all'
                     ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                     : colors.bg.secondary,
                   borderWidth: '2px',
                   borderStyle: 'solid',
                   borderColor: storeFilter === 'all' ? '#C18B5E' : 'transparent',
                   color: storeFilter === 'all' ? '#C18B5E' : colors.text.secondary,
                 }}
               >
                 All Stores
               </button>
               {stores.map((store) => (
                 <button
                   key={store.id}
                   onClick={() => onStoreFilterChange(store.id)}
                   className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                   style={{
                     background: storeFilter === store.id
                       ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                       : colors.bg.secondary,
                     borderWidth: '2px',
                     borderStyle: 'solid',
                     borderColor: storeFilter === store.id ? '#C18B5E' : 'transparent',
                     color: storeFilter === store.id ? '#C18B5E' : colors.text.secondary,
                   }}
                 >
                   <span
                     className="inline-block w-2 h-2 rounded-full mr-2"
                     style={{ backgroundColor: store.color }}
                   />
                   {store.name}
                 </button>
               ))}
             </div>
           </div>
         )}
       </div>
     );
   };
   ```

**Expected Outcome:**
- Search bar at top
- Pill-style filter buttons (category, priority, store)
- Purchased toggle button
- Store pills show store color dot
- Smooth transitions

---

### Phase 6: Create AddItemModalV2 Component (Together Pattern)

**File:** `src/shopping/components/v2/AddItemModalV2.tsx` (Create new)

**This replaces the old AddItemModal with Together pattern.**

**Key Fields:**
- Name (required)
- Quantity + Unit
- Category (dropdown with emojis)
- Priority (low/medium/high)
- Estimated Price
- Store Assignment
- Notes
- Barcode (from scanner)

**Structure:**
```tsx
// Same Together pattern as previous modals:
// - Mobile drag handle
// - Fixed header with close button
// - Scrollable form content
// - Fixed footer with action buttons
// - Auto-save to localStorage
// - ESC key and backdrop click support
// - Delete button in edit mode
```

---

### Phase 7: Create AddPantryItemModalV2 Component

**File:** `src/shopping/components/v2/AddPantryItemModalV2.tsx` (Create new)

**Key Fields:**
- Name (required)
- Quantity + Unit
- Category
- Location (fridge, freezer, pantry, etc.)
- Expiry Date
- Purchase Date
- Purchase Price
- Notes

**Expected Outcome:**
- Together pattern modal
- All pantry-specific fields
- Expiry date picker
- Location selector

---

### Phase 8: Create StoreCardV2 & PantryCardV2 Components

**File:** `src/shopping/components/v2/StoreCardV2.tsx`

**Store Card Features:**
- Store name and type
- Color indicator
- Rating stars
- Distance (if available)
- Favorite indicator
- Budget display
- Last visited
- Click opens store details/shopping list

**File:** `src/shopping/components/v2/PantryCardV2.tsx`

**Pantry Card Features:**
- Item name
- Quantity remaining
- Expiry date with warning colors
- Location badge
- Category badge
- Running low indicator
- Click opens details modal

---

### Phase 9: Upgrade All Remaining Modals to Together Pattern

**Modals to upgrade (create V2 versions):**

1. **EditItemModalV2.tsx** - Edit shopping item
2. **PantryItemDetailsModalV2.tsx** - View/edit pantry item
3. **AddStoreModalV2.tsx** - Add/edit store
4. **StoreSuggestionsModalV2.tsx** - Store suggestions for item
5. **StoreShoppingListModalV2.tsx** - Store-specific shopping list
6. **AddItemChoiceModalV2.tsx** - Choose add to list vs pantry
7. **AddToPantryPromptV2.tsx** - Quick add to pantry
8. **ReplenishModalV2.tsx** - Replenish pantry from shopping

**Keep as-is (camera modals):**
- BarcodeScannerModal.tsx - Camera interface (different pattern OK)
- ReceiptScanningModal.tsx - Camera interface (different pattern OK)

**Each modal must have:**
- Together pattern structure
- Auto-save (where applicable)
- ESC key and backdrop click
- Delete button (edit mode)
- Loading states

---

### Phase 10: Create Action Menu Component

**File:** `src/shopping/components/v2/ActionMenuV2.tsx` (Create new)

**Instead of header buttons, create an action menu:**

```tsx
// Action menu with:
// - 🎤 Voice Input
// - 📷 Scan Barcode
// - 🧾 Scan Receipt
// - 🏪 Find Stores
// - ⚙️ Settings

// Opens from FAB or toolbar
```

---

### Phase 11: Update ShoppingItemCardV2 Component

**File:** `src/shopping/components/v2/ShoppingItemCardV2.tsx`

**Verify and enhance:**
- Checkbox for purchased (32x32px, green when checked)
- Category emoji icon
- Priority indicator (border or badge)
- Price display
- Store badge (if assigned)
- Quantity display
- Owner badge (merged mode)
- Click opens edit modal

---

### Phase 12: Update Main Page with V2 Components

**File:** `src/pages/ShoppingSmart.tsx`

**Changes:**
1. Apply centered layout
2. Replace header with simplified ShoppingHeaderV2
3. Add ViewSelectorV2
4. Add StatsCardsV2
5. Add FilterBarV2
6. Use all V2 modals
7. Replace manual state with useModalState
8. Add ActionMenuV2

---

### Phase 13: Update Layout.tsx to Exclude Duplicate Header

**File:** `src/components/Layout.tsx`

```typescript
// Add 'shopping' to exclusion list
{!isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && activeView !== 'todos' && activeView !== 'shopping' && (
{isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'lifegoals' && activeView !== 'todos' && activeView !== 'shopping' && (
```

---

## Testing Checklist

### Visual Comparison
- [ ] Open `shopping-design-spec.html`
- [ ] Open Shopping tab
- [ ] Compare side-by-side (mobile + desktop)
- [ ] All spacing, colors, fonts match

### Page Layout
- [ ] Content centered (max 900px)
- [ ] No duplicate "Shopping" header
- [ ] Proper padding

### Header
- [ ] Simple header (emoji + title)
- [ ] No gradient text
- [ ] Matches Together pattern

### View Tabs
- [ ] Master List view works
- [ ] Pantry view works
- [ ] Stores view works
- [ ] History view works
- [ ] Active view highlighted

### Stats Cards
- [ ] Total items correct
- [ ] Completed count correct
- [ ] Total cost correct
- [ ] Remaining cost correct

### Filters
- [ ] Search works
- [ ] Category filter works
- [ ] Priority filter works
- [ ] Store filter works
- [ ] Purchased toggle works
- [ ] Owner filter (merged mode)

### Shopping Item Cards
- [ ] Checkbox toggles purchased
- [ ] Category emoji shows
- [ ] Priority indicator
- [ ] Price displays
- [ ] Store badge shows
- [ ] Quantity correct
- [ ] Owner badge (merged mode)
- [ ] Click opens edit modal

### Add Item Modal
- [ ] Together pattern structure
- [ ] All fields present
- [ ] Category dropdown with emojis
- [ ] Priority selector
- [ ] Store assignment
- [ ] Barcode field
- [ ] Auto-save draft
- [ ] ESC/backdrop close
- [ ] Creates item correctly

### Pantry Features
- [ ] Add to pantry works
- [ ] Pantry cards show expiry
- [ ] Expiry warnings (colors)
- [ ] Location badges
- [ ] Running low indicator
- [ ] Edit pantry item works
- [ ] Delete pantry item works

### Store Features
- [ ] Store cards display
- [ ] Store ratings show
- [ ] Distance displays
- [ ] Store distribution works
- [ ] Store shopping lists work
- [ ] Add/edit store works

### Advanced Features
- [ ] Voice input works
- [ ] Barcode scanner works
- [ ] Receipt scanner works
- [ ] Store suggestions work
- [ ] Quick add to pantry works
- [ ] Replenish from shopping works

### Merged Mode
- [ ] Owner filter appears
- [ ] Partner name correct
- [ ] Filter by ownership works

### Responsive
- [ ] Mobile layout correct
- [ ] Desktop layout correct
- [ ] Modals responsive

### Accessibility
- [ ] Tab navigation works
- [ ] Aria-labels present
- [ ] Focus visible

---

## Common Pitfalls (Lessons from Previous Tabs)

| Issue | Solution | Prevention |
|-------|----------|------------|
| Duplicate headers | Exclude 'shopping' from Layout.tsx | Check Layout.tsx first |
| Gradient text inconsistent | Use simple header | Follow Together pattern |
| 15+ modals overwhelming | Do one at a time, copy pattern | Start with AddItemModalV2, use as template |
| Camera modals different | Keep barcode/receipt as-is | Different UX for camera modals is OK |
| Auto-save conflicts | Only when !isEditing | Add isEditing check |
| Store colors not showing | Verify store.color field | Test with multiple stores |

---

## Shopping-Specific Challenges

### Challenge 1: Multiple Input Methods (Voice, Barcode, Receipt)
**Solution:**
- Voice input: Modal with microphone animation
- Barcode scanner: Camera modal (keep existing pattern)
- Receipt scanner: Camera modal with image processing
- All populate AddItemModal with parsed data

### Challenge 2: Store Distribution Logic
**Solution:**
- Distribute items to stores based on:
  - Item preferences (bestStores field)
  - Store specialties
  - Distance/convenience
  - Price optimization
- Show distribution results in preview
- Allow manual reassignment

### Challenge 3: Pantry Tracking
**Solution:**
- Expiry date tracking with color warnings:
  - Red: Expired or < 3 days
  - Orange: 3-7 days
  - Green: > 7 days
- Running low indicator (< 20% of typical quantity)
- Quick replenish from pantry to shopping list
- Location-based organization (fridge, freezer, pantry)

### Challenge 4: Shopping History
**Solution:**
- Track purchased items with date/price
- Show spending trends
- Frequent items suggestions
- Price history for items
- Store spending breakdown

### Challenge 5: 15+ Modals to Upgrade
**Solution:**
- Start with core modals (AddItem, EditItem, AddPantry)
- Use first modal as template for others
- Copy Together pattern exactly
- Test thoroughly before moving to next
- Camera modals (barcode, receipt) can keep different pattern

---

## File Modification Summary

**Files to Create:** 15
- ✏️ `src/shopping/components/v2/ViewSelectorV2.tsx`
- ✏️ `src/shopping/components/v2/StatsCardsV2.tsx`
- ✏️ `src/shopping/components/v2/FilterBarV2.tsx`
- ✏️ `src/shopping/components/v2/AddItemModalV2.tsx`
- ✏️ `src/shopping/components/v2/EditItemModalV2.tsx`
- ✏️ `src/shopping/components/v2/AddPantryItemModalV2.tsx`
- ✏️ `src/shopping/components/v2/PantryItemDetailsModalV2.tsx`
- ✏️ `src/shopping/components/v2/AddStoreModalV2.tsx`
- ✏️ `src/shopping/components/v2/StoreCardV2.tsx`
- ✏️ `src/shopping/components/v2/PantryCardV2.tsx`
- ✏️ `src/shopping/components/v2/ActionMenuV2.tsx`
- ✏️ `src/shopping/components/v2/StoreSuggestionsModalV2.tsx`
- ✏️ `src/shopping/components/v2/StoreShoppingListModalV2.tsx`
- ✏️ `src/shopping/components/v2/AddItemChoiceModalV2.tsx`
- ✏️ `src/shopping/components/v2/index.ts`

**Files to Update:** 3
- ✏️ `src/pages/ShoppingSmart.tsx` - Integrate V2 components
- ✏️ `src/shopping/components/v2/ShoppingHeaderV2.tsx` - Simplify (remove gradient)
- ✏️ `src/components/Layout.tsx` - Exclude duplicate header

**Optional Upgrades:** 3
- `AddToPantryPromptV2.tsx`
- `ReplenishModalV2.tsx`
- Keep camera modals as-is

**Reference Files:** 4
- 📖 `shopping-design-spec.html`
- 📖 `src/pages/Together.tsx`
- 📖 `src/pages/Notes.tsx`
- 📖 `CLAUDE.md`

---

## Phase X: Code Quality & Cleanup (Post-Implementation) ⭐ **CRITICAL**

After completing the V2 implementation, perform these code quality improvements based on lessons learned from Notes and Journal modules.

### Step 1: Add Error Boundary (CRITICAL - Do First)

**Why:** Prevents crashes in one feature from taking down entire app

**File:** `src/pages/Shopping.tsx`

**Changes:**
```typescript
// BEFORE
const ShoppingPage: React.FC = () => {
  return <ShoppingContent />;
};

export default ShoppingPage;

// AFTER
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';

const ShoppingContent: React.FC = () => {
  // All existing content
};

const ShoppingPage: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Shopping">
      <ShoppingContent />
    </FeatureErrorBoundary>
  );
};

export default ShoppingPage;
```

**Impact:** High - App stability improved, errors isolated to feature

---

### Step 2: Investigate and Remove Dead Code

**Why:** Reduces maintenance burden, improves clarity, smaller bundle

**Investigation Commands:**
```bash
# List all component files
find src/shopping -name "*.tsx" -o -name "*.ts"

# Check if component is imported anywhere
grep -r "ComponentName" src --exclude-dir=shopping

# Check if routed in App.tsx
grep "shopping" src/App.tsx

# Check exports
grep -r "from.*shopping" src
```

**Process:**
1. List all components in legacy directories (`components/layout/`, `components/old/`, etc.)
2. For each component:
   - Search codebase for imports
   - Check if routed in App.tsx
   - Check if exported in index.ts
   - If NOT used → Mark for deletion
3. Delete unused files
4. Clean up barrel exports (index.ts)

**Common Dead Code Patterns:**
- Old form components replaced by V2 modals
- Legacy header/footer components
- Unused loading/error states
- Duplicate card components
- View wrapper abstractions

**Example Cleanup:**
```bash
# After investigation, delete unused files
rm -rf src/shopping/components/layout/OldComponent.tsx
rm -rf src/shopping/components/old/

# Update index.ts to remove deleted exports
# (Manual edit to remove references to deleted components)

# Stage deletions
git add -u src/shopping/
```

**Expected Impact:** -200 to -1,000 lines depending on module size

---

### Step 3: Replace Duplicate Date Formatting

**Why:** DRY principle, consistent formatting, less code to maintain

**Problem Pattern:**
```typescript
// ❌ DUPLICATE in component (10-20 lines)
const formatRelativeTime = (date: string) => {
  const now = new Date();
  const entryDate = new Date(date);
  const diffMs = now.getTime() - entryDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return entryDate.toLocaleDateString();
};
```

**Solution:**
```typescript
// ✅ USE SHARED UTILITY
import { getRelativeTime } from '@/utils/dateUtils';

// In component:
{getRelativeTime(createdAt)}
```

**Available Utilities in `src/utils/dateUtils.ts`:**
- `getRelativeTime(date)` - Returns "2 hours ago", "Yesterday", etc.
- `isSameDay(date1, date2)` - Compares dates ignoring time
- `formatDateForDisplay(date)` - Returns "Jan 15, 2025"
- `formatDateTimeForDisplay(date)` - Returns "Jan 15, 2025 at 3:30 PM"
- `addDays(date, days)` - Add/subtract days
- `startOfDay(date)` - Set to 00:00:00
- `endOfDay(date)` - Set to 23:59:59

**Search for Duplicates:**
```bash
# Find potential date formatting code
grep -r "toLocaleDateString\|getTime\|setHours.*0.*0.*0" src/shopping/components/
```

**Expected Impact:** -15 to -40 lines per card component

---

### Step 4: Replace Framer Motion with CSS Transitions

**Why:** Smaller bundle (-20-30KB), better performance, native browser optimization

**Problem:**
```typescript
// ❌ HEAVY LIBRARY for simple hover/tap effects
import { motion } from 'framer-motion';

<motion.div
  whileHover={{ scale: 1.01 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
>
```

**Solution:**
```typescript
// ✅ CSS TRANSITIONS (equivalent effect, zero JS)
<div
  className="transition-transform hover:scale-[1.01] active:scale-[0.98]"
  style={{ transitionDuration: '150ms' }}
>
```

**Common Framer Motion Replacements:**

| Framer Motion | CSS Equivalent |
|---------------|----------------|
| `whileHover={{ scale: 1.01 }}` | `hover:scale-[1.01]` |
| `whileTap={{ scale: 0.98 }}` | `active:scale-[0.98]` |
| `whileHover={{ opacity: 0.8 }}` | `hover:opacity-80` |
| `transition={{ duration: 0.15 }}` | `style={{ transitionDuration: '150ms' }}` |
| `initial={{ opacity: 0 }}` | Use CSS `@keyframes` or remove (not needed for simple cards) |

**Search for Usage:**
```bash
# Find Framer Motion imports
grep -r "framer-motion" src/shopping/
```

**Expected Impact:** -20-30KB bundle size

---

### Step 5: Use Theme Colors Consistently

**Why:** Automatic dark mode support, consistency, easier theming

**Problem:**
```typescript
// ❌ HARDCODED COLORS (no dark mode support)
<div style={{ color: '#5C4A3A' }}>
<div style={{ backgroundColor: '#F5F0EA' }}>
<div style={{ borderColor: '#E8DCC8' }}>
```

**Solution:**
```typescript
// ✅ THEME COLORS (automatic dark mode)
import { useThemeColors } from '@/hooks/useThemeColors';

const colors = useThemeColors();

<div style={{ color: colors.text.primary }}>
<div style={{ backgroundColor: colors.bg.secondary }}>
<div style={{ borderColor: colors.border.light }}>
```

**Theme Colors Reference:**
```typescript
// Background colors
colors.bg.primary      // Page background
colors.bg.secondary    // Section background
colors.bg.tertiary     // Card accent background
colors.bg.white        // Card background

// Text colors
colors.text.primary    // Headings, important text
colors.text.secondary  // Body text, labels
colors.text.tertiary   // Muted text, timestamps

// Border colors
colors.border.light    // Subtle borders
colors.border.medium   // Standard borders

// Accent colors (terracotta)
colors.accent.start    // #D4A574 (gradient start)
colors.accent.end      // #C18B5E (gradient end)

// Badge colors
colors.badge.bg        // Badge background
colors.badge.text      // Badge text
```

**Search for Hardcoded Colors:**
```bash
# Find hex colors in components
grep -r "#[0-9A-Fa-f]\{6\}" src/shopping/components/
```

**Expected Impact:** 5-15 hardcoded colors replaced per module

---

### Step 6: Use Shared Date Comparison Utilities

**Why:** DRY principle, consistent date logic

**Problem:**
```typescript
// ❌ DUPLICATE date comparison (8-10 lines)
const selectedItems = items.filter((item) => {
  const itemDate = new Date(item.createdAt);
  itemDate.setHours(0, 0, 0, 0);
  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0);
  return itemDate.getTime() === selected.getTime();
});
```

**Solution:**
```typescript
// ✅ USE SHARED UTILITY (1 line)
import { isSameDay } from '@/utils/dateUtils';

const selectedItems = items.filter(item =>
  isSameDay(item.createdAt, selectedDate)
);
```

**Expected Impact:** -8 to -15 lines per occurrence

---

### Step 7: Clean Up Unused Imports

**Why:** Cleaner code, better tree-shaking, smaller bundle

**How:**
```bash
# Build will show warnings
npm run build

# Or use ESLint
npx eslint src/shopping --fix
```

**Common Unused Imports After V2 Migration:**
- Old component imports (replaced by V2)
- Unused icon imports
- Framer Motion
- Unused type imports
- Duplicate utility imports

---

### Step 8: Clean Up Module Exports

**Why:** Clear API, prevents importing deleted components

**File:** `src/shopping/index.ts` or `src/shopping/components/v2/index.ts`

**Before:**
```typescript
// ❌ Exports deleted/unused components
export { OldComponent } from './components/OldComponent';
export { LegacyHeader } from './components/LegacyHeader';
export { UnusedView } from './components/UnusedView';
// ... 15+ mixed exports
```

**After:**
```typescript
// ✅ Only export active components, grouped logically

// V2 Components (primary)
export { ShoppingHeaderV2 } from './ShoppingHeaderV2';
export { ShoppingItemCardV2 } from './ShoppingItemCardV2';
export { ShoppingItemFormModalV2 } from './ShoppingItemFormModalV2';
export { PantryCardV2 } from './PantryCardV2';
export { VoiceInputModalV2 } from './VoiceInputModalV2';

// Legacy (actively used only)
export { DetailView } from '../DetailView'; // Still routed in App.tsx

// Hooks
export { useShoppingItemsQuery } from '../../hooks';
```

---

### Step 9: Verification & Testing

**Build Check:**
```bash
# Ensure no TypeScript errors
npx tsc --noEmit

# Ensure build succeeds
npm run build

# Check for warnings
npm run build 2>&1 | grep -i "warning"
```

**Manual Testing:**
- [ ] Feature loads without errors
- [ ] All modals open/close correctly
- [ ] CRUD operations work
- [ ] Filters work
- [ ] Search works (if applicable)
- [ ] Responsive design intact
- [ ] Error boundary catches errors (test by throwing error)

**Performance Check:**
```bash
# Check bundle size before/after
npm run build -- --stats
```

---

### Code Quality Checklist

After completing all steps, verify:

- [ ] ✅ Error boundary added to main page component
- [ ] ✅ Dead code identified and deleted (0 unused files remain)
- [ ] ✅ Duplicate date formatting replaced with `getRelativeTime()`
- [ ] ✅ Duplicate date comparison replaced with `isSameDay()`
- [ ] ✅ Framer Motion replaced with CSS (if applicable)
- [ ] ✅ Theme colors used consistently (no hardcoded hex colors)
- [ ] ✅ Unused imports removed
- [ ] ✅ Module exports cleaned up (only active components exported)
- [ ] ✅ Build succeeds with no errors or warnings
- [ ] ✅ Manual testing completed successfully
- [ ] ✅ Module marked as 100% CLAUDE.md compliant

---

### Expected Overall Impact

**Metrics:**
- Lines removed: -200 to -1,000 (varies by module complexity)
- Files deleted: 3-10 legacy components
- Bundle size: -20-40KB (if Framer Motion removed)
- Error boundaries: +1 (critical for stability)
- Code grade: C/D range → A (95/100)

**Benefits:**
- ✅ Crash isolation (errors don't take down entire app)
- ✅ Smaller bundle (faster load times)
- ✅ Less maintenance (no duplicate code)
- ✅ Consistent theming (dark mode ready)
- ✅ Better performance (CSS vs JS animations)
- ✅ Cleaner codebase (easier to understand)

---

## Commit Message Template

```bash
feat: Complete Shopping tab UI/UX enhancement with Together patterns

Updated Shopping feature to match shopping-design-spec.html and apply all 25
UI/UX enhancement patterns from CLAUDE.md. Major improvements include:

UI Components:
- Updated ShoppingHeaderV2: Simple header matching Together tab (removed gradient)
- Created ViewSelectorV2: 4 views (List/Pantry/Stores/History)
- Created StatsCardsV2: 2x2 grid with totals, completed, costs
- Created FilterBarV2: Pill-style filters (category, priority, store, search)
- Enhanced ShoppingItemCardV2: Checkbox, badges, indicators
- Created PantryCardV2: Expiry warnings, location badges
- Created StoreCardV2: Ratings, distance, budgets

Modals (Together Pattern):
- AddItemModalV2: Full shopping item creation
- EditItemModalV2: Shopping item editing
- AddPantryItemModalV2: Add to pantry
- PantryItemDetailsModalV2: Pantry item details
- AddStoreModalV2: Store management
- StoreSuggestionsModalV2: Store suggestions
- StoreShoppingListModalV2: Store-specific lists
- Mobile drag handles, fixed headers/footers, scrollable content
- Auto-save to localStorage
- ESC key and backdrop support

Page Layout:
- Applied centered layout (900px max-width)
- Removed duplicate "Shopping" header from Layout.tsx
- Simple header (no gradient text)

Features:
- 4 views: Master List, Pantry, Stores, History
- Pill-style filter buttons (category, priority, store)
- Search functionality
- Stats cards (items, completed, costs)
- Barcode scanner integration (kept existing camera modal)
- Receipt scanner integration (kept existing camera modal)
- Voice input support
- Store distribution logic
- Pantry tracking with expiry warnings
- Owner badges in merged mode
- Success toasts for all operations

Advanced Features:
- Store distribution by preferences
- Pantry expiry date tracking with color warnings
- Running low indicators
- Shopping history tracking
- Frequent items suggestions
- Price history

Technical:
- All V2 components in src/shopping/components/v2/
- Maintained existing functionality (voice, barcode, receipt, distribution)
- Responsive mobile/desktop behavior
- 15+ modals upgraded to Together pattern

Fixes:
- No duplicate headers
- Simple header (no gradient text)
- Modals update correctly
- Auto-save doesn't conflict with edit mode

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Success Criteria

✅ Shopping page matches `shopping-design-spec.html` exactly
✅ All 25 UI/UX patterns from CLAUDE.md applied
✅ All modals match Together pattern
✅ Auto-save functionality works
✅ Centered page layout (900px max-width)
✅ Simple header matching Together tab
✅ 4 views working correctly
✅ Pill-style filters
✅ Stats cards display
✅ Voice input works
✅ Barcode scanner works
✅ Receipt scanner works
✅ Store distribution works
✅ Pantry tracking works
✅ Expiry warnings work
✅ Responsive mobile/desktop
✅ Accessible
✅ No console errors

---

## Estimated Complexity

**Complexity:** Very High (15+ modals, advanced input methods, pantry tracking)
**Risk Level:** High (many modals to upgrade, complex input flows)
**Estimated Components:** 15 new V2 components + 3 file updates

---

## Next Steps After Shopping

Recommended order for remaining tabs:

1. **Meals** - Meal planning, recipes
2. **Travel** - Trip planning
3. **Finance** - Accounts, transactions
4. **Nutrition** - Food logging
5. **Self Care** - Activities
6. **Projects** - Project management
7. **Focus** - Focus sessions
8. **Calendar** - Calendar view
9. **Dashboard** - Overview
10. **Assistant** - AI assistant

Each will have a detailed plan created before implementation.
