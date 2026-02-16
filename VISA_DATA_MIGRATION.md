# Visa Requirements Data Migration

## Overview

This migration moves the 2.5MB visa requirements dataset from a static TypeScript file to Supabase database.

**Benefits:**
- ✅ **Reduces bundle size by 2.5MB** (39,601 entries no longer in JavaScript bundle)
- ✅ **Faster initial page load** (data only loads when needed)
- ✅ **Efficient querying** (fetch only needed data, ~200 entries vs 39,601)
- ✅ **Easy updates** (update data without redeploying app)

**Files Created:**
1. `supabase/migrations/20260216_150000_add_visa_requirements.sql` - Table schema
2. `supabase/migrations/20260216_150001_import_visa_data.sql` - Data import (1.78 MB)
3. `src/travel/api/visaRequirementsAPI.ts` - Database query layer
4. `src/travel/hooks/useVisaRequirements.ts` - React Query hooks
5. `scripts/import-visa-data.ts` - Data conversion script (already run)

---

## Migration Steps

### Step 1: Run Database Migrations

**Option A: Local Supabase (Recommended for testing)**
```bash
# Start local Supabase (if not running)
npx supabase start

# Apply migrations
npx supabase db push

# Verify data imported
npx supabase db psql -c "SELECT COUNT(*) FROM visa_requirements;"
# Should return: 39601
```

**Option B: Production Supabase**
```bash
# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push

# Or manually via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Run 20260216_150000_add_visa_requirements.sql
# 3. Run 20260216_150001_import_visa_data.sql
```

### Step 2: Update Components to Use New API

**Old code (VisaCalculator.tsx, VisaMap.tsx):**
```typescript
// ❌ Old - Static synchronous data
import {
  getVisaRequirement,
  getAccessibleDestinations,
  getVisaAccessSummary,
  getAvailablePassportCountries
} from '../data/visaRequirements';

// Synchronous calls
const countries = getAvailablePassportCountries();
const summary = getVisaAccessSummary(passportCountry);
```

**New code:**
```typescript
// ✅ New - Database queries with React Query
import {
  useAvailablePassportCountries,
  useVisaAccessSummary,
  usePassportVisaData
} from '../hooks/useVisaRequirements';

// Use hooks
const { data: countries = [] } = useAvailablePassportCountries();
const { data: summary } = useVisaAccessSummary(passportCountry);

// For components that need full passport data, use bulk fetch
const { data: passportData = {} } = usePassportVisaData(passportCountry);
```

**Files to update:**
- [ ] `src/travel/components/VisaCalculator.tsx`
- [ ] `src/travel/components/VisaMap.tsx`

### Step 3: Remove Old Static Data File (After Testing)

Once you've verified everything works:

```bash
# Remove the 2.5MB static file
rm src/travel/data/visaRequirements.ts

# This will reduce your bundle size by ~2.5MB!
```

### Step 4: Verify Bundle Size Reduction

```bash
npm run build

# Check bundle size - should be ~2.5MB smaller
# Look for the travel chunk size in build output
```

---

## Component Update Guide

### VisaCalculator.tsx Changes

**Current Issue:**
- Line 78: `const availableCountries = React.useMemo(() => getAvailablePassportCountries(), []);`
  - This is synchronous and runs on every render

**Fix:**
```typescript
// At top of component
const { data: availableCountries = [] } = useAvailablePassportCountries();
```

**Full passport data caching:**
```typescript
// Instead of calling getVisaRequirement() for each country individually,
// Fetch all at once when passport changes:
const { data: passportVisaData = {} } = usePassportVisaData(passport?.countryCode || '');

// Then use passportVisaData[destinationCountry] for lookups
```

### VisaMap.tsx Changes

**Current:**
- Line 11: `import { getVisaRequirement } from '../data/visaRequirements';`
- Uses `getVisaRequirement()` synchronously in map rendering

**Fix:**
```typescript
// Fetch all requirements at once
const { data: passportVisaData = {} } = usePassportVisaData(passportCountry);

// Then in map render:
const visaReq = passportVisaData[country.properties.iso_a2];
```

---

## Performance Comparison

### Before (Static Data)
- **Bundle size**: +2.5MB for visa page chunk
- **Initial load**: Downloads all 39,601 entries
- **Memory**: ~10MB in browser memory
- **Query speed**: Instant (in-memory lookup)

### After (Database)
- **Bundle size**: +0KB (no static data)
- **Initial load**: Downloads only needed data (~2KB for 1 passport)
- **Memory**: ~10KB in browser memory
- **Query speed**: ~50-100ms (cached by React Query)

**Result**: ~2.5MB smaller bundle, 99% less data transferred

---

## Rollback Plan

If something goes wrong, you can rollback:

1. Keep the old `visaRequirements.ts` file (don't delete it yet)
2. Revert component changes to use old imports
3. Drop the database table:
   ```sql
   DROP TABLE IF EXISTS visa_requirements CASCADE;
   ```

---

## Testing Checklist

- [ ] Migrations applied successfully
- [ ] Query returns 39,601 rows: `SELECT COUNT(*) FROM visa_requirements;`
- [ ] VisaCalculator page loads and shows passport countries
- [ ] Map visualization works with database data
- [ ] Filtering by visa type works
- [ ] Performance is acceptable (<100ms queries)
- [ ] Build size reduced by ~2.5MB
- [ ] No console errors in browser

---

## Next Steps

1. ✅ Database migrations created
2. ✅ API layer created
3. ✅ React hooks created
4. ⏳ **Update components** (VisaCalculator.tsx, VisaMap.tsx)
5. ⏳ **Test thoroughly**
6. ⏳ **Remove old static file**
7. ⏳ **Verify bundle size reduction**

---

## Questions?

- **Why not lazy load the static file?**
  Even with code splitting, you'd still download 2.5MB when visiting /travel/visa. Database approach only fetches ~2KB per passport.

- **What if visa requirements change?**
  Update the database directly via SQL or admin panel. No code deploy needed!

- **Can I update the data?**
  Yes! The original data source is [passport-index-dataset](https://github.com/ilyankou/passport-index-dataset). Re-run `scripts/import-visa-data.ts` with updated data.
