# Complete Shopping Module - Merged Mode Mockups

## Overview
This document shows **all pages** of the Shopping module in merged mode, demonstrating how both partners will see combined household shopping data.

**Key Principle:** No owner filter - always show both partners' data with owner badges for identification.

## Complete Page List

Based on `src/pages/ShoppingSmart.tsx`, the Shopping module has **4 main views**:

1. ✅ **Master List** - Central shopping list with all items
2. ✅ **Distribute** - Smart store distribution by strategy
3. ✅ **Store Lists** - Shopping lists organized by store
4. ✅ **Pantry** - Pantry inventory management

---

## Page 1: Master List (`/shopping` - Master List View)

**Purpose:** Central shopping list where both partners add items

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🛒 Smart Shopping System                                                  │
│  Master list + intelligent store distribution                              │
│                                                                             │
│  📊 Summary                                                                │
│  ┌──────────────────┬──────────────────┬──────────────────┐                │
│  │  📝 Items        │  🏪 Store Lists  │  💰 Est. Cost    │                │
│  │  12 items        │  3 stores        │  $156.47         │                │
│  │  (Both partners) │  (Distributed)   │  (Combined)      │                │
│  └──────────────────┴──────────────────┴──────────────────┘                │
│                                                                             │
│  [🎤 Voice Add] [📷 Scan Barcode] [+ Add Item]                            │
│                                                                             │
│  Tabs: [Master List ✓] [Distribute] [Store Lists] [Pantry]                │
├────────────────────────────────────────────────────────────────────────────┤
│  Search: [________________]  Filters: [All Categories ▼] [All Priority ▼] │
│                                                                             │
│  🥬 Produce (3 items)                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☐ Organic Bananas                                    [Sarah]         │  │
│  │    2 bunches • High priority                                         │  │
│  │    Est: $3.99 • Whole Foods                                          │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☐ Spinach                                            [Me]            │  │
│  │    1 bag • Medium priority                                           │  │
│  │    Est: $4.99 • Trader Joe's                                         │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☐ Avocados                                           [Sarah]         │  │
│  │    4 pcs • Medium priority                                           │  │
│  │    Est: $5.96 • Whole Foods                                          │  │
│  │    Note: For guacamole                                               │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  🥛 Dairy (2 items)                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☐ Organic Milk                                       [Me]            │  │
│  │    1 gallon • High priority                                          │  │
│  │    Est: $6.99 • Whole Foods                                          │  │
│  │    Brand: Organic Valley                                             │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☐ Greek Yogurt                                       [Sarah]         │  │
│  │    6 cups • Medium priority                                          │  │
│  │    Est: $8.94 • Costco                                               │  │
│  │    Brand: Fage                                                       │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  🍖 Meat (2 items)                                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☐ Chicken Breast                                     [Me]            │  │
│  │    2 lbs • High priority                                             │  │
│  │    Est: $12.98 • Whole Foods                                         │  │
│  │    🌱 Organic                                                        │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☐ Ground Beef                                        [Sarah]         │  │
│  │    1 lb • Medium priority                                            │  │
│  │    Est: $7.99 • Trader Joe's                                         │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  🏠 Household (3 items)                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☐ Paper Towels                                       [Me]            │  │
│  │    12 rolls • Low priority                                           │  │
│  │    Est: $24.99 • Costco                                              │  │
│  │    Brand: Bounty                                                     │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☐ Dish Soap                                          [Sarah]         │  │
│  │    2 bottles • Medium priority                                       │  │
│  │    Est: $8.98 • Target                                               │  │
│  │    Brand: Dawn                                                       │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☐ Laundry Detergent                                  [Me]            │  │
│  │    1 bottle • Low priority                                           │  │
│  │    Est: $15.99 • Costco                                              │  │
│  │    Brand: Tide                                                       │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  🎉 Purchased Items (2)                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ✓ Coffee Beans                                       [Sarah]         │  │
│  │   Purchased Jan 28 • $12.99 at Trader Joe's                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ✓ Bread                                              [Me]            │  │
│  │   Purchased Jan 27 • $4.99 at Whole Foods                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Combined master list from both partners
- ✅ Owner badges on all items `[Me]` / `[Sarah]`
- ✅ Edit/Delete buttons only on your own items
- ✅ Grouped by category
- ✅ Shows estimated prices and preferred stores
- ✅ Priority indicators
- ✅ Purchased items section with history
- ✅ Voice and barcode scanning features
- ✅ No filter by owner - always shows all items

---

## Page 2: Distribute View (`/shopping` - Distribute View)

**Purpose:** Smart distribution of items to stores based on strategy

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🛒 Smart Shopping System                                                  │
│  Master list + intelligent store distribution                              │
│                                                                             │
│  📊 Summary                                                                │
│  ┌──────────────────┬──────────────────┬──────────────────┐                │
│  │  📝 Items        │  🏪 Store Lists  │  💰 Est. Cost    │                │
│  │  12 items        │  3 stores        │  $156.47         │                │
│  │  (Both partners) │  (Distributed)   │  (Combined)      │                │
│  └──────────────────┴──────────────────┴──────────────────┘                │
│                                                                             │
│  [🎤 Voice Add] [📷 Scan Barcode] [+ Add Item]                            │
│                                                                             │
│  Tabs: [Master List] [Distribute ✓] [Store Lists] [Pantry]                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Distribution Strategy                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Strategy: [💰 Price ▼]  [Quality] [Convenience] [Mixed]              │  │
│  │                                                                       │  │
│  │ 💡 Smart Recommendations:                                            │  │
│  │ • Costco for bulk items (Paper Towels, Greek Yogurt, Laundry Det.)  │  │
│  │ • Whole Foods for organic items (Bananas, Milk, Chicken)            │  │
│  │ • Trader Joe's for specialty items (Spinach, Ground Beef)           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Recommended Store Distribution                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🏪 Whole Foods                                       2.3 mi away     │  │
│  │    6 items • Est. $42.90                                             │  │
│  │    ⭐⭐⭐⭐⭐ Quality • 💰💰💰 Price                                    │  │
│  │                                                                       │  │
│  │    ☐ Organic Bananas (2 bunches)              $3.99    [Sarah]      │  │
│  │    ☐ Avocados (4 pcs)                         $5.96    [Sarah]      │  │
│  │    ☐ Organic Milk (1 gallon)                  $6.99    [Me]         │  │
│  │    ☐ Chicken Breast (2 lbs)                   $12.98   [Me]         │  │
│  │    ☐ Spinach (1 bag)                          $4.99    [Me]         │  │
│  │    ☐ Dish Soap (2 bottles)                    $8.98    [Sarah]      │  │
│  │                                                                       │  │
│  │    [📍 Get Directions] [✓ Create Store List]                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🏪 Costco                                            5.1 mi away     │  │
│  │    3 items • Est. $49.92                                             │  │
│  │    ⭐⭐⭐⭐ Quality • 💰💰💰💰💰 Price (Best Value)                     │  │
│  │                                                                       │  │
│  │    ☐ Greek Yogurt (6 cups)                    $8.94    [Sarah]      │  │
│  │    ☐ Paper Towels (12 rolls)                  $24.99   [Me]         │  │
│  │    ☐ Laundry Detergent (1 bottle)             $15.99   [Me]         │  │
│  │                                                                       │  │
│  │    [📍 Get Directions] [✓ Create Store List]                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🏪 Trader Joe's                                      1.8 mi away     │  │
│  │    2 items • Est. $12.98                                             │  │
│  │    ⭐⭐⭐⭐ Quality • 💰💰💰💰 Price                                    │  │
│  │                                                                       │  │
│  │    ☐ Ground Beef (1 lb)                       $7.99    [Sarah]      │  │
│  │    ☐ Spinach (1 bag)                          $4.99    [Me]         │  │
│  │                                                                       │  │
│  │    [📍 Get Directions] [✓ Create Store List]                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Route Optimization                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🗺️ Suggested Route (Total: 12.4 mi, ~45 min)                        │  │
│  │                                                                       │  │
│  │ 1. 🏠 Home → Trader Joe's (1.8 mi)                                   │  │
│  │ 2. Trader Joe's → Whole Foods (2.1 mi)                              │  │
│  │ 3. Whole Foods → Costco (3.5 mi)                                    │  │
│  │ 4. Costco → 🏠 Home (5.0 mi)                                         │  │
│  │                                                                       │  │
│  │ [📍 Open in Maps] [✓ Create All Store Lists]                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Smart distribution algorithm based on strategy
- ✅ Shows items from both partners in each store
- ✅ Owner badges on distributed items
- ✅ Store ratings and distance information
- ✅ Estimated costs per store
- ✅ Route optimization for efficient shopping
- ✅ One-click creation of store-specific lists
- ✅ Location-based store suggestions
- ✅ Combined household shopping optimization

---

## Page 3: Store Lists View (`/shopping` - Store Lists View)

**Purpose:** View shopping organized by specific stores

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🛒 Smart Shopping System                                                  │
│  Master list + intelligent store distribution                              │
│                                                                             │
│  📊 Summary                                                                │
│  ┌──────────────────┬──────────────────┬──────────────────┐                │
│  │  📝 Items        │  🏪 Store Lists  │  💰 Est. Cost    │                │
│  │  12 items        │  3 stores        │  $156.47         │                │
│  │  (Both partners) │  (Distributed)   │  (Combined)      │                │
│  └──────────────────┴──────────────────┴──────────────────┘                │
│                                                                             │
│  [🎤 Voice Add] [📷 Scan Barcode] [+ Add Item]                            │
│                                                                             │
│  Tabs: [Master List] [Distribute] [Store Lists ✓] [Pantry]                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Active Store Lists                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🏪 Whole Foods                                       2.3 mi          │  │
│  │    6 items • $42.90 estimated                                        │  │
│  │    Last visited: 3 days ago                                          │  │
│  │    ⭐⭐⭐⭐⭐ Quality • Open until 10 PM                               │  │
│  │                                                                       │  │
│  │    High Priority (3 items)                                           │  │
│  │    ☐ Organic Bananas (2 bunches)              $3.99    [Sarah]      │  │
│  │    ☐ Organic Milk (1 gallon)                  $6.99    [Me]         │  │
│  │    ☐ Chicken Breast (2 lbs)                   $12.98   [Me]         │  │
│  │                                                                       │  │
│  │    Medium Priority (3 items)                                         │  │
│  │    ☐ Avocados (4 pcs)                         $5.96    [Sarah]      │  │
│  │    ☐ Spinach (1 bag)                          $4.99    [Me]         │  │
│  │    ☐ Dish Soap (2 bottles)                    $8.98    [Sarah]      │  │
│  │                                                                       │  │
│  │    [📍 Directions] [✓ Mark All Purchased] [📄 Print List]           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🏪 Costco                                            5.1 mi          │  │
│  │    3 items • $49.92 estimated                                        │  │
│  │    Last visited: 1 week ago                                          │  │
│  │    ⭐⭐⭐⭐ Quality • Open until 8:30 PM                              │  │
│  │                                                                       │  │
│  │    Medium Priority (1 item)                                          │  │
│  │    ☐ Greek Yogurt (6 cups)                    $8.94    [Sarah]      │  │
│  │                                                                       │  │
│  │    Low Priority (2 items)                                            │  │
│  │    ☐ Paper Towels (12 rolls)                  $24.99   [Me]         │  │
│  │    ☐ Laundry Detergent (1 bottle)             $15.99   [Me]         │  │
│  │                                                                       │  │
│  │    [📍 Directions] [✓ Mark All Purchased] [📄 Print List]           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🏪 Trader Joe's                                      1.8 mi          │  │
│  │    2 items • $12.98 estimated                                        │  │
│  │    Last visited: 2 days ago                                          │  │
│  │    ⭐⭐⭐⭐ Quality • Open until 9 PM                                 │  │
│  │                                                                       │  │
│  │    Medium Priority (2 items)                                         │  │
│  │    ☐ Ground Beef (1 lb)                       $7.99    [Sarah]      │  │
│  │    ☐ Spinach (1 bag)                          $4.99    [Me]         │  │
│  │                                                                       │  │
│  │    [📍 Directions] [✓ Mark All Purchased] [📄 Print List]           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Recent Shopping Trips                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Jan 28 • Trader Joe's                                 [Sarah]        │  │
│  │ 3 items purchased • $27.97 total                                     │  │
│  │ Coffee Beans, Pasta, Tomato Sauce                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Jan 27 • Whole Foods                                  [Me]           │  │
│  │ 2 items purchased • $12.98 total                                     │  │
│  │ Bread, Eggs                                                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Shopping lists organized by store
- ✅ Items from both partners in each store list
- ✅ Owner badges on all items
- ✅ Grouped by priority within each store
- ✅ Store information (distance, hours, ratings)
- ✅ Quick actions (directions, mark purchased, print)
- ✅ Recent shopping trip history with owner badges
- ✅ Combined household view - no filtering by owner

---

## Page 4: Pantry View (`/shopping` - Pantry View)

**Purpose:** Track pantry inventory and get low-stock alerts

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🛒 Smart Shopping System                                                  │
│  Master list + intelligent store distribution                              │
│                                                                             │
│  📊 Summary                                                                │
│  ┌──────────────────┬──────────────────┬──────────────────┐                │
│  │  📝 Items        │  🏪 Store Lists  │  💰 Est. Cost    │                │
│  │  12 items        │  3 stores        │  $156.47         │                │
│  │  (Both partners) │  (Distributed)   │  (Combined)      │                │
│  └──────────────────┴──────────────────┴──────────────────┘                │
│                                                                             │
│  [🎤 Voice Add] [📷 Scan Barcode] [+ Add Item]                            │
│                                                                             │
│  Tabs: [Master List] [Distribute] [Store Lists] [Pantry ✓]                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Pantry Inventory                                      [+ Add Pantry Item] │
│                                                                             │
│  Search: [________________]  Filters: [All Categories ▼] [All Status ▼]   │
│                                                                             │
│  ⚠️ Low Stock Items (3)                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🍝 Pasta                                             [Sarah]          │  │
│  │    Current: 1 box • Min: 3 boxes                                     │  │
│  │    Location: Pantry Shelf 2                                          │  │
│  │    Expires: Mar 2027                                                 │  │
│  │    [+ Add to Shopping List] [✏️ Edit] [🗑️ Delete]                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🍚 Rice                                              [Me]             │  │
│  │    Current: 0.5 lbs • Min: 2 lbs                                     │  │
│  │    Location: Pantry Shelf 1                                          │  │
│  │    Expires: Jun 2027                                                 │  │
│  │    [+ Add to Shopping List] [✏️ Edit] [🗑️ Delete]                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🥫 Canned Tomatoes                                   [Sarah]          │  │
│  │    Current: 1 can • Min: 4 cans                                      │  │
│  │    Location: Pantry Shelf 3                                          │  │
│  │    Expires: Dec 2026                                                 │  │
│  │    [+ Add to Shopping List] [✏️ Edit] [🗑️ Delete]                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ✅ Well Stocked Items (8)                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☕ Coffee Beans                                      [Me]             │  │
│  │    Current: 3 bags • Min: 1 bag                                      │  │
│  │    Location: Kitchen Counter                                         │  │
│  │    Expires: Apr 2026                                                 │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🧂 Salt                                              [Sarah]          │  │
│  │    Current: 2 containers • Min: 1 container                          │  │
│  │    Location: Spice Rack                                              │  │
│  │    Expires: Never                                                    │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🍯 Honey                                             [Me]             │  │
│  │    Current: 1 jar • Min: 1 jar                                       │  │
│  │    Location: Pantry Shelf 1                                          │  │
│  │    Expires: Never                                                    │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🌾 Flour                                             [Sarah]          │  │
│  │    Current: 5 lbs • Min: 2 lbs                                       │  │
│  │    Location: Pantry Shelf 2                                          │  │
│  │    Expires: Aug 2026                                                 │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🍬 Sugar                                             [Me]             │  │
│  │    Current: 3 lbs • Min: 1 lb                                        │  │
│  │    Location: Pantry Shelf 2                                          │  │
│  │    Expires: Never                                                    │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🫒 Olive Oil                                         [Sarah]          │  │
│  │    Current: 2 bottles • Min: 1 bottle                                │  │
│  │    Location: Kitchen Counter                                         │  │
│  │    Expires: Nov 2026                                                 │  │
│  │    [✏️ Edit] [🗑️ Delete]                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ⏰ Expiring Soon (2)                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🥜 Peanut Butter                                     [Me]             │  │
│  │    Current: 1 jar • Min: 1 jar                                       │  │
│  │    Location: Pantry Shelf 1                                          │  │
│  │    ⚠️ Expires: Feb 15, 2026 (15 days)                                │  │
│  │    [+ Add to Shopping List] [✏️ Edit] [🗑️ Delete]                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🥛 Almond Milk                                       [Sarah]          │  │
│  │    Current: 1 carton • Min: 1 carton                                 │  │
│  │    Location: Refrigerator                                            │  │
│  │    ⚠️ Expires: Feb 5, 2026 (5 days)                                  │  │
│  │    [+ Add to Shopping List] [✏️ Edit] [🗑️ Delete]                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Combined pantry inventory from both partners
- ✅ Owner badges on all pantry items
- ✅ Low stock alerts with quick "Add to Shopping List" action
- ✅ Expiration tracking and warnings
- ✅ Location tracking (which shelf/area)
- ✅ Minimum quantity thresholds
- ✅ Edit/Delete only on your own items
- ✅ Grouped by status (Low Stock, Well Stocked, Expiring Soon)
- ✅ No filter by owner - household pantry view

---

## Additional Features & Modals

### Add Item Modal

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ➕ Add Shopping Item                                          [✕ Close]  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Item Name *                                                               │
│  [_________________________________]                                       │
│                                                                             │
│  Quantity *          Unit                                                  │
│  [_______]           [pcs ▼]                                               │
│                                                                             │
│  Category *          Priority *                                            │
│  [Produce ▼]         [Medium ▼]                                            │
│                                                                             │
│  Estimated Price     Brand                                                 │
│  [$_______]          [_________________________________]                   │
│                                                                             │
│  Preferred Store                                                           │
│  [Whole Foods ▼]                                                           │
│                                                                             │
│  Barcode                                                                   │
│  [_________________________________]  [📷 Scan]                            │
│                                                                             │
│  Notes                                                                     │
│  [_________________________________]                                       │
│  [_________________________________]                                       │
│                                                                             │
│  Special Attributes                                                        │
│  ☐ Organic  ☐ Gluten-Free  ☐ Vegan                                        │
│                                                                             │
│  Added By: Me                                                              │
│                                                                             │
│                                      [Cancel]  [Add Item]                  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Barcode Scanner Modal

```
┌────────────────────────────────────────────────────────────────────────────┐
│  📷 Barcode Scanner                                            [✕ Close]  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │                      [Camera View]                                   │  │
│  │                                                                       │  │
│  │                  Align barcode in frame                              │  │
│  │                                                                       │  │
│  │                  ┌─────────────────┐                                 │  │
│  │                  │                 │                                 │  │
│  │                  │                 │                                 │  │
│  │                  │                 │                                 │  │
│  │                  └─────────────────┘                                 │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Status: Scanning...                                                       │
│                                                                             │
│  💡 Tip: Hold steady and ensure good lighting                             │
│                                                                             │
│                                      [Stop Scanning]                       │
└────────────────────────────────────────────────────────────────────────────┘
```

### Store Suggestions Modal (Location-Based)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  📍 Store Suggestions for "Organic Bananas"                   [✕ Close]  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Your Location: [📍 Get Current Location]                                 │
│  Current: 123 Main St, San Francisco, CA                                  │
│                                                                             │
│  Nearby Stores                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🏪 Whole Foods Market                                1.2 mi          │  │
│  │    ⭐⭐⭐⭐⭐ Quality • 💰💰💰 Price                                    │  │
│  │    Best for: Organic produce                                         │  │
│  │    Est. Price: $3.99                                                 │  │
│  │    Open: 8 AM - 10 PM                                                │  │
│  │                                      [Assign Store] [Directions]     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🏪 Trader Joe's                                      1.8 mi          │  │
│  │    ⭐⭐⭐⭐ Quality • 💰💰💰💰 Price                                    │  │
│  │    Best for: Specialty items                                         │  │
│  │    Est. Price: $2.99                                                 │  │
│  │    Open: 8 AM - 9 PM                                                 │  │
│  │                                      [Assign Store] [Directions]     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🏪 Safeway                                           2.5 mi          │  │
│  │    ⭐⭐⭐ Quality • 💰💰💰💰 Price                                      │  │
│  │    Best for: General groceries                                       │  │
│  │    Est. Price: $4.49                                                 │  │
│  │    Open: 6 AM - 11 PM                                                │  │
│  │                                      [Assign Store] [Directions]     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                                          [Cancel]          │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary of Merged Mode Changes

### Data Visibility
- ✅ **Always show both partners' data** - No owner filter toggle
- ✅ **Owner badges everywhere** - `[Me]` and `[Sarah]` on all items
- ✅ **Combined metrics** - Total items, costs, and counts from both partners

### Permissions
- ✅ **Edit/Delete own items only** - Full control over your own shopping items
- ✅ **View-only on partner's items** - Can see but not modify partner's items
- ✅ **Shared pantry management** - Both can add/edit pantry items

### Smart Features
- ✅ **Household optimization** - Distribution considers all items from both partners
- ✅ **Combined route planning** - Optimizes shopping trips for all household items
- ✅ **Shared store preferences** - Store ratings and preferences benefit both partners
- ✅ **Joint pantry tracking** - Low stock alerts for household pantry

### User Experience
- ✅ **Clear ownership** - Always know who added what
- ✅ **Collaborative shopping** - Both partners contribute to master list
- ✅ **Efficient distribution** - Smart algorithm distributes all items optimally
- ✅ **Unified inventory** - Single source of truth for pantry items

---

## Implementation Notes

### Database Schema Considerations
1. **shopping_items table** - Add `user_id` field for ownership tracking
2. **pantry_items table** - Add `user_id` field for ownership tracking
3. **stores table** - Shared across household (no user_id needed)
4. **shopping_lists table** - Add `user_id` for list ownership

### UI Components to Update
1. **ShoppingHeader** - Show combined metrics
2. **MasterListView** - Add owner badges, conditional edit/delete
3. **DistributeView** - Show owner badges in distributed items
4. **StoreListsView** - Show owner badges in store-specific lists
5. **PantryView** - Add owner badges, conditional edit/delete
6. **ShoppingModals** - Auto-populate "Added By" field

### API Changes
1. **getShoppingItems** - Fetch items from both partners
2. **getPantryItems** - Fetch pantry items from both partners
3. **updateShoppingItem** - Verify ownership before allowing updates
4. **deleteShoppingItem** - Verify ownership before allowing deletes

### Business Logic
1. **Distribution algorithm** - Consider all items regardless of owner
2. **Route optimization** - Optimize for all household items
3. **Low stock alerts** - Alert both partners for pantry items
4. **Purchase tracking** - Track who purchased what for analytics


