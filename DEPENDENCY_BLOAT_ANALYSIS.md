# Dependency Bloat Analysis

## Summary

You're shipping **multiple heavy libraries that either duplicate functionality or aren't used at all**.

**Analysis Results:**

| Library | Status | Used In | Action |
|---------|--------|---------|--------|
| **Leaflet + react-leaflet** | ✅ USED | Travel pages (5 files) | **KEEP** |
| **Google Maps** | ❌ NOT USED | 0 files | **DELETE** |
| **d3-geo + d3-geo-projection** | ✅ USED | Travel maps (4 files) | **KEEP** |
| **topojson-client** | ✅ USED | RealisticMapView | **KEEP** |
| **recharts** | ✅ USED | Finance Projections page | **KEEP** |
| **@tiptap/react** | ❌ NOT USED | 0 files | **DELETE** |
| **@dnd-kit** | ❌ NOT USED | 0 files | **DELETE** |

---

## Detailed Analysis

### 1. Google Maps - ❌ DELETE

**Package:** `@react-google-maps/api`

**Size:** ~500KB minified

**Usage:**
```bash
$ grep -r "@react-google-maps" src/
# No results
```

**Verdict:** **DELETE** - Not imported anywhere

**Why it exists:** Probably experimented with Google Maps before choosing Leaflet for travel features.

---

### 2. TipTap Rich Text Editor - ❌ DELETE

**Packages:**
- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/pm`

**Size:** ~400KB combined minified

**Usage:**
```bash
$ grep -r "@tiptap" src/
# No results
```

**Verdict:** **DELETE** - Not imported anywhere

**Why it exists:**
- Probably planned for rich text in Notes or Journal
- But you just use plain textareas
- Check `src/pages/Notes.tsx` and `src/pages/Journal.tsx` - no TipTap

---

### 3. DND Kit (Drag and Drop) - ❌ DELETE

**Packages:**
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

**Size:** ~150KB combined minified

**Usage:**
```bash
$ grep -r "@dnd-kit" src/
# No results
```

**Verdict:** **DELETE** - Not imported anywhere

**Why it exists:**
- Probably planned for:
  - Drag-and-drop tasks in Todos
  - Reordering habits
  - Project kanban board
- But none of these features use it

---

### 4. Leaflet + react-leaflet - ✅ KEEP

**Packages:**
- `leaflet`
- `react-leaflet`
- `@types/leaflet`

**Size:** ~150KB minified

**Usage:**
```
src/travel/components/VisaMap.tsx
src/travel/components/LeafletTravelMapV2.tsx
src/travel/components/LeafletTravelMap.tsx
src/components/WorldVisitedMap.tsx
src/components/NationalParksMap.tsx
```

**Verdict:** **KEEP** - Used in Travel and National Parks features

**Pages that render these:**
- Travel page (accessible from sidebar)
- Visa Calculator page (accessible from sidebar)
- Trip Planner page (accessible from sidebar)

---

### 5. d3-geo + d3-geo-projection - ✅ KEEP

**Packages:**
- `d3-geo`
- `d3-geo-projection`
- `@types/d3-geo`

**Size:** ~200KB combined minified

**Usage:**
```
src/travel/components/EnhancedGeographicMap.tsx
src/travel/components/MappackerStyleMap.tsx
src/travel/components/RealisticMapView.tsx
src/travel/components/EnhancedWorldMap.tsx
```

**Verdict:** **KEEP** - Used for custom world map projections in Travel

**Why needed:**
- Creates custom SVG world maps (not using Leaflet tiles)
- Geographic projections (Mercator, Robinson, etc.)
- Used alongside Leaflet (different use cases)

---

### 6. topojson-client - ✅ KEEP

**Package:** `topojson-client`

**Size:** ~50KB minified

**Usage:**
```
src/travel/components/RealisticMapView.tsx
```

**Verdict:** **KEEP** - Used for TopoJSON map data

**Why needed:**
- TopoJSON is a compressed format for geographic data
- Smaller than GeoJSON for complex shapes
- Used with d3-geo for rendering

---

### 7. recharts - ✅ KEEP

**Package:** `recharts`

**Size:** ~300KB minified

**Usage:**
```
src/finance/pages/ProjectionsPage.tsx
```

**Verdict:** **KEEP** - Used in Finance Projections tab

**Pages that render this:**
- Finances page → "Projections" tab
- Accessible from sidebar

**Why needed:**
- Financial projections charts (line graphs, area charts)
- Net worth over time
- Retirement projections

---

## Summary Table

### DELETE (3 packages, ~1.05MB)

| Package | Size | Reason |
|---------|------|--------|
| `@react-google-maps/api` | ~500KB | Not imported anywhere |
| `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/pm` | ~400KB | Not imported anywhere |
| `@dnd-kit/*` (3 packages) | ~150KB | Not imported anywhere |

### KEEP (7 packages, ~700KB)

| Package | Size | Reason |
|---------|------|--------|
| `leaflet` + `react-leaflet` | ~150KB | Travel/Visa/National Parks maps |
| `d3-geo` + `d3-geo-projection` | ~200KB | Custom world map projections |
| `topojson-client` | ~50KB | Compressed map data |
| `recharts` | ~300KB | Finance projections charts |

---

## Cleanup Commands

### Step 1: Remove Unused Dependencies

```bash
npm uninstall @react-google-maps/api
npm uninstall @tiptap/react @tiptap/starter-kit @tiptap/pm
npm uninstall @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm uninstall @types/react-beautiful-dnd  # Also unused (old dnd library)
```

### Step 2: Remove Unused Backend Dependencies

Since you deleted the backend server, also remove:

```bash
npm uninstall express cors pg @types/pg node-fetch
```

### Step 3: Verify Build

```bash
npm run build
```

### Step 4: Check Bundle Size

```bash
ls -lh dist/assets/*.js
```

---

## Expected Impact

### Before Cleanup
```
Total dependencies: ~95 packages
Bundle size: ~2.5MB (estimated)
```

### After Cleanup
```
Total dependencies: ~85 packages (10 fewer)
Bundle size: ~1.4MB (estimated)
Savings: ~1.1MB (44% reduction)
```

### Load Time Impact
- **Before:** ~3-5 seconds on 3G
- **After:** ~1.5-2.5 seconds on 3G
- **Improvement:** ~50% faster

---

## Why These Exist

### Google Maps
- Probably experimented with Google Maps API
- Chose Leaflet instead (open source, no API key needed)
- Never cleaned up

### TipTap
- Planned for rich text editing in Notes/Journal
- Decided plain textareas were sufficient
- Never cleaned up

### DND Kit
- Planned for drag-and-drop in Tasks/Habits
- Never implemented
- Never cleaned up

**Pattern:** You experiment, choose an alternative, but never remove the abandoned dependency.

---

## Recommended Action

**Delete immediately:**
- `@react-google-maps/api`
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `@types/react-beautiful-dnd`
- `express`, `cors`, `pg`, `@types/pg`, `node-fetch` (backend is deleted)

**Keep:**
- `leaflet`, `react-leaflet` (Travel maps)
- `d3-geo`, `d3-geo-projection` (Custom world maps)
- `topojson-client` (Map data compression)
- `recharts` (Finance charts)

---

## Future Proofing

**Before adding any dependency:**
1. Check if you already have a similar library
2. Test in a branch first
3. If you abandon it, REMOVE it immediately
4. Run `npm uninstall <package>` as part of cleanup

**Audit dependencies quarterly:**
```bash
npx depcheck  # Shows unused dependencies
npx npm-check-updates  # Shows outdated packages
```
