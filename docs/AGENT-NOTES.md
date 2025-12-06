# Agent Working Notes (Testing & Hardening Summary)

This file summarizes the work completed on the LifeSync Tasks tab, infra hardening, and testing harness, so future changes can proceed seamlessly without re-explaining context.

## Infra & Security Hardening
- Consolidated API routes into the TypeScript Express server (`server/src/**`).
- CORS restricted via `CORS_ORIGINS`; DB-guard returns 503 when `SKIP_DB=1`.
- External fetches (YouTube/OCR/OpenFoodFacts) now have timeouts.
- OCR endpoint only accepts server-side `OCR_SPACE_API_KEY`.
- Field whitelisting for SQL `UPDATE` to prevent injection via dynamic keys.
- Supabase URL logging removed.
- Vite Playwright config made env-driven (`E2E_BASE_URL`, `E2E_DEV_COMMAND`).
- `.gitignore` expanded (envs, logs, binaries, coverage, backups).

## Dev Guardrails & CI
- Scripts: `guard` (typecheck + unit tests watch), `typecheck`, `watch:unit`, `watch:type`.
- Husky hooks: pre-commit (lint-staged), pre-push (typecheck + unit tests).
- CI: lint + typecheck + unit tests, plus an E2E smoke matrix on PRs.

## Parsers
- Extracted and unit-tested quick-add parsers in `src/utils/quickAdd.ts`.
- UI wired to shared parsers so unit tests guard production code.

## DnD Reliability
- Custom collision detection uses `pointerWithin` for sidebar/calendar droppables to improve hover & drop accuracy.

## Tasks Tab: Test Coverage

### Unit Tests (highlights)
- Drag reorder payload; drop targets (Today/Inbox/Scheduled/Waiting/Starred/Completed/Archived/Upcoming/Project) → update calls validated.
- Calendar date/hour drop → due_date set correctly.
- Inline edit title saved on Enter.
- Bulk selection: archive/delete; Select All respects filtered list.
- Filters & sorting: search filter and Title A–Z order; project/status filter behaviors.
- Badges/Counts: status & priority badges render; sidebar groups present.
- Hooks/Utils: useLocalStorage/useSessionStorage; validation utils; Error/Empty components.
- CLI: `tasks add` (flags), `tasks list --tag`, `tasks status`, `tasks today`.

### E2E Smokes (highlights)
- Reorder persistence across reloads.
- Drops: Today/Waiting/Scheduled/Upcoming/Project/Calendar Date.
- Drop persistence across reloads (Waiting/Scheduled/Project).
- Inline title edit + persistence after reload.
- Bulk archive/delete flows.
- Search + sort A–Z end-to-end.
- Star toggle + persistence after reload.
- Project filter toggle back to All; project filter combined with search.

All E2E tests are wired into CI:
- `reorder.spec.ts`, `subtask-quickadd.spec.ts`, `quickadd-parse.spec.ts`,
- `drag-to-calendar-date.spec.ts`, `drag-to-today.spec.ts`, `drag-to-upcoming.spec.ts`,
- `drag-to-project.spec.ts`, `drag-persistence.spec.ts`, `star-toggle.spec.ts`,
- `star-persistence.spec.ts`, `project-filter-toggle.spec.ts`, `project-filter-search.spec.ts`,
- `inline-edit-title.spec.ts`, `bulk-archive.spec.ts`, `bulk-delete.spec.ts`.

## Remaining (Tasks) Toward 100%
- Tag-specific filter dropdown (if/when implemented).
- Sidebar count exactness (optionally assert numeric chips against a seeded set; presence covered).

## Habits Module: Plan & Initial Coverage
- Unit tests: addHabit (done), completeHabit, resetHabitToday, resetHabitHistory, updateHabit edit form, streak/target helpers.
- Component tests: habit list rendering by category; edit/save flows; error toasts.
- E2E: add habit, complete habit, verify target/streak indicators; reset today/history.

## 75 Hard Module: Plan
- Unit tests: challenge creation; rules & daily targets; edit rules; export/import helpers.
- E2E: create challenge; mark a rule complete; verify daily progress indicator.

## How to Run
- Local guard while coding: `npm run guard`
- Unit tests: `npm test`
- Typecheck: `npm run typecheck`
- E2E smoke locally (subset):
  ```bash
  npx playwright test tests/e2e/reorder.spec.ts tests/e2e/inline-edit-title.spec.ts tests/e2e/drag-to-today.spec.ts
  ```

## Notes
- Quick-Add tokens: `#project:Name` or `#project:"Name With Spaces"`, `#tags`, `@today|@tomorrow|@YYYY-MM-DD`, `!urgent|!high|!medium|!low|!1..4`.
- Tasks UI uses shared parsers from `src/utils/quickAdd.ts`.
