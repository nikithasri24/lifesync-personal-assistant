# Plan: Unified Shopping List (Option B)

## Goal
One shopping list that contains everything — batch cook recipe ingredients, manual household items (pads, washing bag), and general groceries. Items carry a source badge so you know *why* each item is on the list.

## End State
```
🛒 Shopping List  (24 items)

[ All ] [ Meals ] [ Household ] [ Manual ]

☐  paneer · 400g        🍽 Next Week Prep
☐  yogurt · 1 cup       🍽 Next Week Prep
☐  garam masala · 1 tsp 🍽 Afgani paneer
☐  Pads                 🏠 Household
☐  Washing bag          🏠 Household
☐  Tomato               ➕ General
```

- The Meals > Grocery tab becomes a **planning/preview** view only
- The action is now **"Add to Shopping List"** — items flow into the unified list tagged with their source
- No separate grocery list in Meals; everything lives in Shopping

---

## What Changes

### 1. Database — New columns on `shopping_items`

```sql
ALTER TABLE shopping_items
  ADD COLUMN source_type text DEFAULT 'manual',
  ADD COLUMN source_name text;
-- source_type: 'manual' | 'batch_cook' | 'recipe' | 'pantry'
-- source_name: "Next Week Prep - Mar 15" or "Afgani paneer recipe" or null
```

The existing `recipe_id` column stays — used for deduplication guard (don't add same recipe twice).

---

### 2. Type Updates

**`src/services/types.ts` — ShoppingItemData:**
```ts
source_type?: 'manual' | 'batch_cook' | 'recipe' | 'pantry' | null;
source_name?: string | null; // display label for the source
```

---

### 3. New API Function

**`src/api/shoppingAPI.ts` — `addIngredientsToShoppingList()`**

```ts
async function addIngredientsToShoppingList(
  listId: string,
  ingredients: Array<{ name: string; amount?: string; unit?: string }>,
  sourceType: 'batch_cook' | 'recipe',
  sourceName: string,
  recipeId?: string  // guard: skip if already added from this recipe
): Promise<{ added: number; skipped: number }>
```

**Logic:**
1. If `recipeId` provided → check if items with this `recipe_id` already exist in list. If yes, skip (idempotent add).
2. For each ingredient → insert with `source_type`, `source_name`, `recipe_id`
3. Return count of added vs skipped

**No cross-source deduplication** (too complex, error-prone). If "paneer" appears from a recipe AND a manual add — that's two rows. User resolves in-store. This is intentional simplicity.

---

### 4. Shopping Page UI Updates

**`src/pages/ShoppingSmart.tsx`**

Add source filter pills above the item list:
```
[ All (24) ]  [ 🍽 Meals (18) ]  [ 🏠 Household (4) ]  [ ➕ Manual (2) ]
```

Add source badge on each item card:
- `batch_cook` → terracotta pill: "Next Week Prep"
- `recipe` → terracotta pill: recipe name
- `manual` / `null` → no badge (clean, no noise for regular items)
- `pantry` → muted badge: "Pantry"

**No other changes** to Shopping page. List, Pantry, Stores, History tabs stay.

---

### 5. Meals — Grocery Tab Redesign

**`src/meals/components/views/GroceryView.tsx`**

Keep the ingredient preview list (useful for seeing what you need before adding). Change the action:

- **Old:** "Add (N) to list" → pushed to a separate internal grocery list
- **New:** "Add to Shopping List" → calls `addIngredientsToShoppingList()` → items appear in Shopping page with source badge

UI layout change:
```
Session: Next Week Prep - Mar 15  [Add all to Shopping →]

  paneer 400g
  yogurt 1 cup
  garam masala 1 tsp
  ...

Already in Shopping List ✓ (shown if already added)
```

If already added → button becomes "Added ✓" (greyed out) to prevent duplicates.

---

### 6. Fridge Pool — "Shop for This Session" Button

**`src/meals/components/v2/FridgePoolV2.tsx`**

Add a small "🛒 Shop" button in the session header (next to "Add dish"):
- Opens a mini-preview of all ingredients across recipe-linked dishes in this session
- Confirms "Add 12 ingredients to Shopping List"
- One tap → done

```
[Add dish] [🛒 Shop] [🗑] [+New]
```

---

### 7. No Changes To

- Shopping item add form (still manual, `source_type` defaults to `'manual'`)
- Pantry tab
- Stores / History tabs
- Batch cook session creation flow
- The existing "Send to Shopping" in old GroceryView — this gets replaced

---

## Implementation Order

| Step | File(s) | Work |
|------|---------|------|
| 1 | `supabase/migrations/` | Add `source_type`, `source_name` columns |
| 2 | `src/services/types.ts` | Update `ShoppingItemData` interface |
| 3 | `src/schemas/shopping.ts` | Update Zod schema |
| 4 | `src/api/shoppingAPI.ts` | Add `addIngredientsToShoppingList()` + mapper updates |
| 5 | `src/shopping/hooks/useShoppingQuery.ts` | Add `useAddIngredientsToShoppingList` mutation |
| 6 | `src/pages/ShoppingSmart.tsx` | Source filter pills + source badge on item cards |
| 7 | `src/meals/components/views/GroceryView.tsx` | Replace "Add to list" with "Add to Shopping List" action |
| 8 | `src/meals/components/v2/FridgePoolV2.tsx` | Add "🛒 Shop" button in session header |
| 9 | `src/pages/MealPlanning.tsx` | Wire new GroceryView props (active list id, onAddToShopping) |

---

## Deduplication Strategy (Deliberate)

**Within same source:** Idempotent. If you click "Add to Shopping" twice for the same recipe session, it detects existing `recipe_id` match and skips. No duplicate entries.

**Across sources:** Not deduplicated. "paneer" from batch cook + "paneer" from manual = two rows.

Rationale: Name-matching across sources is error-prone (paneer vs Paneer 400g vs paneer cube). Trust the user to eyeball duplicates. This is how every major shopping app (AnyList, OurGroceries) handles it.

---

## Source Badge Design

| source_type | Badge style | Label |
|-------------|------------|-------|
| `batch_cook` | Terracotta pill | Session name (e.g. "Next Week Prep") |
| `recipe` | Terracotta pill | Recipe name |
| `manual` | None | — |
| `pantry` | Muted gray pill | "Pantry" |
| `null` | None | — |

Badges are small, right-aligned on the item row. Don't clutter the left side where name/quantity live.

---

## What This Solves

- ✅ One list to check before any shopping trip
- ✅ Know why each item is on the list (source badge)
- ✅ Batch cook recipes automatically suggest ingredients, one tap to add
- ✅ Pads, washing bag, random household items — same list, no badge
- ✅ No more Meals > Grocery as a second brain to maintain
- ✅ Filter by "Meals" before the grocery run, "Household" before Target run
