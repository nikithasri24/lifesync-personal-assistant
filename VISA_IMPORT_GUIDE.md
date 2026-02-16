# Visa Requirements Import Guide

The large SQL file (1.8MB) is too big for Supabase SQL Editor. Use one of these alternative methods:

---

## ✅ **Method 1: Direct Import via Script (Recommended)**

This method directly imports data to Supabase using the JavaScript client in batches.

### Prerequisites
Make sure your `.env` file has:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Steps

1. **Create the table schema** (run this in Supabase SQL Editor):
```bash
# Copy contents of this file to SQL Editor and run:
supabase/migrations/20260216_150000_add_visa_requirements.sql
```

2. **Run the import script**:
```bash
npm run import:visa-to-db
```

This will:
- Import 39,601 entries in batches of 1,000
- Show progress as it imports
- Verify the final count
- Takes ~2-3 minutes

**Output:**
```
🚀 Starting visa requirements import to Supabase...
📊 Total entries to import: 39,601
⚙️  Importing in 40 batches of 1000 rows...

✅ Batch 1/40 imported (2.5% complete)
✅ Batch 2/40 imported (5.1% complete)
...
✅ Batch 40/40 imported (100.0% complete)

✅ Successfully imported: 39,601 entries
✅ Database contains 39,601 total entries
🎉 Import complete!
```

---

## ✅ **Method 2: CSV Import via Dashboard**

This method creates a CSV file you can upload through Supabase Dashboard.

### Steps

1. **Create the table schema** (run in Supabase SQL Editor):
```bash
# Copy and run: supabase/migrations/20260216_150000_add_visa_requirements.sql
```

2. **Generate CSV file**:
```bash
npm run export:visa-csv
```

This creates `visa_requirements.csv` (~1.5MB) in your project root.

3. **Import via Supabase Dashboard**:
   - Go to: **Supabase Dashboard** > **Table Editor**
   - Select table: `visa_requirements`
   - Click: **Insert** > **Import data via spreadsheet**
   - Upload: `visa_requirements.csv`
   - Map columns (should auto-detect):
     - `passport_country` → `passport_country`
     - `destination_country` → `destination_country`
     - `requirement` → `requirement`
     - `days_allowed` → `days_allowed`
   - Click **Import**
   - Wait 1-2 minutes for upload to complete

---

## ✅ **Method 3: Supabase CLI (Local)**

If you're running Supabase locally, the large SQL file works fine.

### Steps

1. **Start local Supabase**:
```bash
npx supabase start
```

2. **Run migrations**:
```bash
npx supabase db push
```

This will run both migration files automatically (table creation + data import).

3. **Verify**:
```bash
npx supabase db psql -c "SELECT COUNT(*) FROM visa_requirements;"
# Should return: 39601
```

4. **Push to production** (when ready):
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

---

## 🔍 **Verification**

After import, verify the data:

### Check row count:
```sql
SELECT COUNT(*) FROM visa_requirements;
-- Expected: 39601
```

### Check sample data:
```sql
SELECT * FROM visa_requirements
WHERE passport_country = 'United States'
LIMIT 10;
```

### Check requirements breakdown:
```sql
SELECT requirement, COUNT(*) as count
FROM visa_requirements
GROUP BY requirement
ORDER BY count DESC;
```

Expected results:
- `visa-required`: ~15,000+
- `visa-free`: ~10,000+
- `visa-on-arrival`: ~6,000+
- `e-visa`: ~5,000+
- `eta`: ~2,000+
- `no-admission`: ~500+

---

## 🚨 **Troubleshooting**

### "Missing environment variables"
Make sure `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### "Batch X failed: duplicate key"
This means data was partially imported. Run the script again - it uses `upsert` so duplicates are safe.

### "Permission denied"
Check RLS policies are correct. The migration file sets public read access.

### Import is slow
This is normal - 39,601 rows takes 2-3 minutes. Be patient!

### CSV upload fails
Try Method 1 (direct script) instead - it's more reliable for large datasets.

---

## 📊 **What Each Method Does**

| Method | Speed | Reliability | Complexity |
|--------|-------|-------------|------------|
| **Direct Script** | Fast (2-3 min) | ✅ High | Low - just run command |
| **CSV Upload** | Medium (1-2 min) | ⚠️ Medium | Medium - manual upload |
| **Supabase CLI** | Fast (1 min) | ✅ High | Low (if using local dev) |

**Recommendation**: Use **Method 1 (Direct Script)** - it's automated, reliable, and shows progress.

---

## ✅ **After Successful Import**

Once data is imported, you can:

1. ✅ Test queries in SQL Editor
2. ✅ Update components to use new API (see VISA_DATA_MIGRATION.md)
3. ✅ Remove old static file: `rm src/travel/data/visaRequirements.ts`
4. ✅ Build and verify bundle size reduction

---

## 📝 **Quick Start (TL;DR)**

```bash
# 1. Create table (copy SQL from migration file to SQL Editor)
# 2. Import data
npm run import:visa-to-db

# 3. Verify
# Go to Supabase Dashboard > Table Editor > visa_requirements
# Should show 39,601 rows
```

Done! 🎉
