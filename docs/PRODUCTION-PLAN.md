# LifeSync Production Readiness Plan

This document captures the gaps between the current work-in-progress state of LifeSync and the “production ready” experience you outlined—persistent data, collaboration with your husband, secure habits, budgets, meals, and more—while keeping the operational cost at $0.

## 1. Current State Snapshot

- **Frontend**: Vite + React + TypeScript single-page app. UI covers dashboard, tasks, habits, journal, finances, shopping, travel, meal planning, etc. Many sections rely on in-memory or mock data.
- **State management**: Zustand `useRealAppStore` ties the UI to an API layer. When the API is unavailable the UI quietly falls back to an empty app state.
- **APIs**: `src/services/apiClient.ts` targets the TypeScript Express server under `server/src/**` for privileged utilities and selected domains; most CRUD goes direct to Supabase via the client adapter.
- **Supabase integration**: Exists but unused. `src/lib/supabase.ts` and `src/services/database.ts` implement real-time CRUD for tasks/projects with placeholder env vars and a hard-coded `TEMP_USER_ID`.
- **Persistence**: Local storage only. Backend services exist but are not wired up or hosted. No authentication or sharing yet.

## 2. Target Experience (from requirements)

1. **True persistence**: All critical entities (tasks, habits, meals, groceries, finances, notes, etc.) live in a durable database.
2. **Shared workspace**: You and your husband authenticate, manage personal + shared data, and keep history/audit trails.
3. **Zero monthly cost**: Leverage generous free tiers and self-hosting so there is no ongoing bill.
4. **Production quality**: Stable deployments, environment-driven config, automated tests covering the critical flows, and docs for setup/maintenance.

## 3. Recommended Architecture (Zero Cost)

| Layer | Choice | Why | Notes |
| --- | --- | --- | --- |
| **Database + Auth** | **Supabase free tier** | PostgreSQL storage, row-level security, email+password auth for 2 users. | Free tier allows 500MB DB, 50MB storage, 10k monthly active users—more than enough. |
| **API (optional)** | **Edge functions or direct Supabase client** | Small team can call Supabase directly from frontend using Row Level Security. | For complex workflows you can still keep a thin Express layer hosted on Render free tier. |
| **File Storage** | Supabase storage bucket | Store attachments, meal photos, receipts. Free up to 1 GB. |
| **Frontend hosting** | Cloudflare Pages or Vercel free tier | Zero cost static hosting for Vite build with HTTPS. |
| **Background jobs** | Supabase cron or GitHub Actions | Use scheduled edge functions/cron for reminders, cleanup, etc. |
| **Monitoring** | Supabase dashboards + lightweight health cron | Supabase provides metrics; optional Pingdom/Upptime (GitHub Actions) for uptime. |

Fallbacks if Supabase ever outgrows requirements: deploy PocketBase (binary already in repo) on fly.io free tier; or self-host Postgres on Railway/Neon (both have free hobby tiers). Supabase keeps your stack simple today.

## 4. Implementation Phases

### Phase 0 – Repository hygiene (Today)
- Replace placeholder env usage (`process.env.REACT_APP_*`) with Vite’s `import.meta.env.VITE_*` and commit a `.env.example` listing all required keys.
- Split mock/demo code from production code; mark components that still render fake data.
- Add `docs/` folder (this file) and keep high-level architecture decisions here.

### Phase 1 – Core persistence + auth (1–2 days)
1. **Create Supabase project** (free). Enable email/password auth.
2. **Seed database** using a trimmed version of `database-schema.sql`. Start with users, tasks, projects, habits, shopping lists/items, recipes, focus sessions, financial tables.
3. **Configure Row Level Security** so each user sees only their data, plus a “shared household” concept:
   ```sql
   create table households (
     id uuid primary key default gen_random_uuid(),
     name text not null,
     join_code text unique,
     created_at timestamptz default now()
   );

   alter table users add column household_id uuid references households(id);
   ```
   Add policies allowing users within the same household to read/write shared entities (e.g., tasks marked `scope = 'household'`).
4. **Wire Supabase client**:
   - Update `src/lib/supabase.ts` to use `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
   - Replace the temporary `TEMP_USER_ID` in `useTasks`, `useRealAppStore` with the authenticated Supabase user.
   - Move API calls inside the store to a new `src/services/dataProvider` that detects whether Supabase credentials exist. Prefer Supabase, fallback to mock store while you migrate features gradually.
5. **Auth UI**: Create a minimal `AuthGate` component (email/password login, invitation flow for your husband). Protect the rest of the app behind it.
6. **Persistence coverage**: Convert Tasks, Habits, Shopping, Recipes, Finances to Supabase tables. For features still under construction (travel, period tracking), keep using local state but document the plan.

### Phase 2 – Collaboration features (1 week)
- **Shared responsibilities**: add `assigned_to` / `owner_id` columns to tasks, shopping lists, grocery items.
- **Audit + history**: create trigger tables (`task_history`, `habit_history`) for debugging and accountability.
- **Notifications**: use Supabase Edge Functions + email to send daily digest or habit reminders (free 50k emails via Resend trial or integrate with Gmail API using OAuth).
- **Meal planning workflow**: connect recipes ↔ meal calendar ↔ grocery auto-generation. Persist pantry inventory with quantity + exp dates.
- **Budget + finance**: persist budgets, transactions, subscriptions. Implement CSV import/export for bank statements to avoid paid aggregators.

### Phase 3 – Production polish (ongoing)
- **Testing**: add Vitest suites for store actions hitting Supabase (use Supabase’s local emulator). Build Playwright smoke tests for login, task CRUD, meal planner, grocery list, finance ledger.
- **Deployment automation**: GitHub Actions pipeline (lint → test → build). Deploy to Cloudflare Pages on merge to `main`. Use Supabase CLI for migrations + DDL versioning.
- **Observability**: Add logging around store actions, integrate Sentry (free tier) for frontend error reporting.
- **Data portability**: Implement Settings → Export (JSON/CSV) and Import flows so you can backup locally.
- **Offline-first**: keep a small IndexedDB cache (e.g., `idb-keyval`) for tasks/habits to survive spotty connections.

## 5. Immediate Action Items Checklist

- [ ] Update Supabase client to use Vite env vars.
- [ ] Commit `.env.example` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_SERVICE_ROLE` (for local scripts only), `VITE_SUPABASE_REDIRECT_URL`.
- [ ] Build `AuthGate` + `useSupabaseAuth` hook that surfaces `user`, `household`, and `loading` state.
- [ ] Refactor `useRealAppStore.initializeData` to wait for auth, then load entities via Supabase.
- [ ] Convert Task/Habit/Shopping CRUD methods to Supabase (start with `database.ts`, extend tables + methods).
- [ ] Extract finance/shopping/meal mock data into `fixtures/` and mark TODOs in components so production paths depend on the store instead of constants.
- [x] Document Supabase SQL migrations under `supabase/migrations/` (use Supabase CLI or plain SQL files).
- [x] Add migration extending shopping tables with priority, tags, store metadata, and recurring fields for Shopping Smart.
- [x] Persist pantry inventory and weekly meal plans in Supabase; sync shopping purchases into pantry stock adjustments.
- [ ] Add GitHub Actions workflow running lint + vitest on push.

## 6. Deployment Outline (Zero Cost)

1. **Supabase**
   - Create project → copy URL + anon key.
   - Run SQL migrations via dashboard > SQL editor.
   - Configure OAuth providers later if desired.

2. **Frontend**
   - Create Cloudflare Pages project pointing to GitHub repo.
   - Add environment variables in Pages dashboard.
   - Build command: `npm install && npm run build` (fits into free limits).

3. **Optional Express API (TS Server)**
   - If you need server-side cron jobs or data shaping, deploy the TypeScript Express API under `server/src/**` (build to `server/dist`) to Render/Fly/Heroku. Point it to your Postgres using the connection string. Free tiers may sleep after inactivity but restart on request.

4. **DNS / Custom domain**
   - Cloudflare Pages includes free TLS; map `assistant.yourdomain.com` if desired.

## 7. Risk & Mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Large schema vs Supabase row limits | Medium | Start with core tables, archive/cleanup via scheduled jobs, export old data locally. |
| Free tier cold starts (Render, Supabase Edge) | Low | Use direct Supabase client to avoid server hops; Cloudflare Pages is CDN-backed. |
| Auth complexity | Medium | Limit to email/password initially. Add social logins later if needed. |
| Many unfinished UI modules | Medium | Track production readiness per page (Dashboard ✓, Tasks ✓, Habits ✓, others in progress). Use feature flags to hide unready pages in production. |

## 8. Next Steps

1. Land the env + Supabase client fixes (already in progress).
2. Stand up Supabase project and run initial schema.
3. Implement auth + Supabase backed task CRUD end-to-end.
4. Gradually migrate remaining sections, cutting mock data.
5. Add tests + CI before inviting your husband to use the app daily.

Once Phase 1 is complete you’ll have true persistence, collaborative access, and a deployment pipeline—all without monthly cost. Subsequent phases layer on automation, analytics, and polish.
