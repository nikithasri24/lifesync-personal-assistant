# Database Analysis - PostgreSQL vs Supabase

## Executive Summary

**✅ You ARE using Supabase (cloud PostgreSQL) for your application**
**⚠️ You HAVE PostgreSQL installed locally, but it's NOT being used by the application**

---

## Current Database Setup

### Production/Active Database: **Supabase** ✅

**Connection Details:**
- **Host**: `db.rfwaiijodrowakcpayoa.supabase.co`
- **Project ID**: `rfwaiijodrowakcpayoa`
- **URL**: `https://rfwaiijodrowakcpayoa.supabase.co`
- **Type**: Cloud-hosted PostgreSQL
- **SSL**: Required

**Used By:**
1. **Frontend** (`src/lib/supabase.ts`) - Direct Supabase client
2. **Server** (`server/.env`) - PostgreSQL connection via `pg` library
3. **Scripts** - All migration and data scripts

**Environment Variables:**
```bash
# server/.env
DATABASE_URL=postgresql://postgres:AbNY4sCdEa6APPA@db.rfwaiijodrowakcpayoa.supabase.co:5432/postgres?sslmode=require

# .env.local
VITE_SUPABASE_URL=https://rfwaiijodrowakcpayoa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Local PostgreSQL Installation: **Installed but UNUSED** ⚠️

**Installation Details:**
- **Installed**: Yes (via Homebrew)
- **Running**: Yes (2 instances detected)
  - PostgreSQL 14: `/opt/homebrew/var/postgresql@14`
  - PostgreSQL 16: `/Library/PostgreSQL/16/data`
- **Databases**: Only default databases (postgres, template0, template1)
- **No `lifesync` database exists locally**

**Status**: PostgreSQL is installed and running but NOT connected to your application.

---

## Files with Outdated/Incorrect PostgreSQL References

### 🗑️ Files to DELETE (Obsolete):

1. **`cli/test-db-connection.js`** ❌
   - Tries to connect to `localhost:5432`
   - Uses wrong credentials (`lifesync123`)
   - Database `lifesync` doesn't exist locally
   - **Action**: DELETE

2. **`.env.external`** ❌
   - Contains localhost PostgreSQL config
   - Not used by application
   - **Action**: DELETE or UPDATE

3. **`cli/database-schema.sql`** ⚠️
   - Complete PostgreSQL schema definition
   - Not used (Supabase migrations are in `supabase/migrations_archive/`)
   - **Action**: DELETE (schema is managed via Supabase migrations)

---

## Files Using Supabase (Correct) ✅

### Frontend:
- `src/lib/supabase.ts` - Supabase client initialization
- `src/finance/data/supabaseApi.ts` - Finance API
- All API files in `src/api/` - Use Supabase client

### Server:
- `server/dist/db/pool.js` - Uses `pg` library to connect to Supabase PostgreSQL
- `server/.env` - Correct Supabase connection string

### Scripts:
- `scripts/apply-migrations.js` - Supabase migrations
- `scripts/apply-meal-planning-migrations.js` - Supabase
- All other migration scripts - Supabase

---

## Package Dependencies

### Root `package.json`:
```json
"pg": "^8.16.3"  // Used by server to connect to Supabase PostgreSQL
```

### CLI `package.json`:
```json
// NO pg dependency - CLI doesn't connect to database directly
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│  Frontend (localhost:5173)              │
│  - React + Vite                         │
│  - @supabase/supabase-js client        │
└─────────────┬───────────────────────────┘
              │
              │ HTTPS (Supabase Client SDK)
              ▼
┌─────────────────────────────────────────┐
│  Supabase Cloud                         │
│  (rfwaiijodrowakcpayoa.supabase.co)    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  PostgreSQL Database            │   │
│  │  - All application tables       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Authentication & RLS           │   │
│  └─────────────────────────────────┘   │
└─────────────▲───────────────────────────┘
              │
              │ PostgreSQL Protocol (pg library)
              │
┌─────────────┴───────────────────────────┐
│  Server (localhost:3001)                │
│  - Express API                          │
│  - pg Pool connection                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Local PostgreSQL (localhost:5432)      │
│  - INSTALLED but NOT USED               │
│  - No lifesync database                 │
└─────────────────────────────────────────┘
```

---

## Recommendations

### Immediate Actions:

1. **Delete obsolete files:**
   ```bash
   rm cli/test-db-connection.js
   rm cli/database-schema.sql
   rm .env.external
   ```

2. **Uninstall local PostgreSQL** (optional):
   ```bash
   brew uninstall postgresql@14
   brew uninstall postgresql@16
   # Or keep it if you use it for other projects
   ```

3. **Update documentation** to clarify Supabase-only setup

---

## Conclusion

**You are 100% using Supabase (cloud PostgreSQL).** The local PostgreSQL installation is a red herring - it's running but not connected to your application. All application data lives in Supabase.

The confusion comes from:
- Old test files referencing localhost
- PostgreSQL being installed (possibly for other projects)
- The `pg` npm package (which is used to connect to Supabase's PostgreSQL, not local)

