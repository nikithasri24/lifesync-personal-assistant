Finance Module (Self‑contained)

Overview
- Namespaced module under `src/finance/*`, tree‑shakable and route‑scoped.
- Mock and Supabase adapters with an env flag switch.
- Routes mounted under `/finance/*`. Exported helpers for host integration.

Install/Env
- Required env in `.env.local` or `.env`:
  - `VITE_FINANCE_BACKEND=mock` (default) or `supabase`
  - `VITE_SUPABASE_URL=your-url` (when using Supabase)
  - `VITE_SUPABASE_ANON_KEY=your-anon-key` (when using Supabase)
- Optional (seeding script only):
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side seed script)
  - `USER_ID=<auth.uid()>` or pass `--user=<uuid>`

Host Integration
- Import from the module’s entrypoint and wire router + nav:
  - `import { registerFinanceRoutes, FinanceNavItem } from './finance'`.
  - Add `<FinanceNavItem />` to your app’s navbar/tabs.
  - Add `...registerFinanceRoutes()` into your existing router configuration.
- Example (React Router v6):
  - `createBrowserRouter([ ...appRoutes, ...registerFinanceRoutes() ])`

Adapters
- Factory: `getFinanceAPI()` in `src/finance/data/index.ts` chooses adapter by `VITE_FINANCE_BACKEND`.
- Mock (`mock`): reads static JSON seeds under `src/finance/data/seed/*` with simulated latency.
- Supabase (`supabase`): uses `@supabase/supabase-js`. Requires the user to be authenticated; all queries scoped by `auth.uid()`.

Supabase Schema & RLS
- Migration: `supabase/migrations/finance_init.sql` — creates tables, enables RLS, and adds per-user policies and indexes.
- Apply via the Supabase CLI or SQL editor; ensure `gen_random_uuid()` is available (pgcrypto).

Seeding
- Mock mode: seeds are already in JSON files read by the adapter.
- Supabase mode: use Node script `scripts/seedFinance.ts`.
  - Run: `USER_ID=<your-user-uuid> VITE_SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<service-key> node scripts/seedFinance.ts`
  - Or: `node scripts/seedFinance.ts --user=<uuid>` with env vars for URL and service key.
  - The script maps seed IDs to UUIDs and preserves relationships.

Routes
- `/finance` → Dashboard
- `/finance/accounts`
- `/finance/transactions`
- `/finance/budgets`
- `/finance/net-worth`
- `/finance/goals`
- `/finance/settings`

UI & State
- UI primitives live under `src/finance/ui/*` to avoid global collisions.
- Charts load via a lazy wrapper that requires `recharts` at runtime; shows a fallback message if not installed.
- UI state (filters) via Zustand at `src/finance/store/useFinanceFilters.ts` with light localStorage persistence.

Testing
- Minimal tests in `src/finance/__tests__/` using Vitest + RTL:
  - Dashboard totals vs seed.
  - Transactions filtering and CSV export trigger.
  - Budgets over/under indicator.

Notes
- No global CSS leaks: components use Tailwind utility classes within a `.finance-scope` wrapper where applicable.
- Switching `VITE_FINANCE_BACKEND` requires no code changes.
- If `recharts`, `zustand`, or `zod` are not in your project, install them to enable full functionality.

