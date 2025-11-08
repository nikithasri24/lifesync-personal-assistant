# Repository Guidelines

## Project Structure & Module Organization
- App code lives in `src/` (React + TypeScript). Key folders: `src/components/` (PascalCase UI), `src/pages/`, `src/hooks/` (files start with `use*`), `src/stores/`, `src/services/`, `src/utils/` (camelCase helpers), `src/test/` (setup).
- Unit/integration tests colocated under `src/**/__tests__/`. E2E tests in `tests/e2e/` (Playwright).
- Public assets in `public/`. Build and tooling configs in project root (`vite.config.ts`, `vitest.config.ts`, `eslint.config.js`).
- Local API: TypeScript Express server under `server/src/**`. Utilities (YouTube/Barcode/OCR) are exposed via `/api/util/*` on the same server.

## Build, Test, and Development Commands
- `npm run dev` — start Vite dev server on `http://localhost:5173`.
- `npm run build` — type-check then build production bundle.
- `npm run preview` — serve the production build locally.
- `npm run lint` — lint codebase (auto-fix with `eslint --fix`).
- `npm test` / `npm run test:coverage` — run Vitest (JSDOM); coverage to `coverage/`.
- `npm run test:e2e` — run Playwright tests in `tests/e2e/` (spawns dev server).
- `npm run guard` — watch TypeScript and unit tests together.
- API helpers: `npm run api:start`, `npm run api:monitor`, `npm run api:status`.

## Coding Style & Naming Conventions
- TypeScript across app; follow ESLint rules in `eslint.config.js` (run `npm run lint`).
- Components: PascalCase (`AccountReconciliation.tsx`). Hooks: `use*` (`useTheme.ts`). Utilities: camelCase (`quickAdd.ts`). Tests: `*.test.ts(x)` under `__tests__/`.

## Testing Guidelines
- Frameworks: Vitest + Testing Library for unit/integration; Playwright for E2E.
- Test setup is in `src/test/setup.ts` (JSDOM, a11y matchers, mocks). Prefer colocated tests near source.
- Run targeted suites, e.g.: `npm run test:project-tracking`.
- Keep meaningful assertions and include accessibility checks where practical.

## Commit & Pull Request Guidelines
- Conventional Commits enforced via Commitlint (`.commitlintrc.json`): `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`, `build`, `revert`, `security`.
- Example: `feat(components): add LoadingSpinner a11y labels`.
- PRs must include: clear description, linked issues (e.g., `#123`), screenshots for UI changes, and a checklist confirming `lint`, `test`, and `build` pass.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local` for local runs; use `.env.test` for tests. Never commit secrets.
- Common ports: app `5173`, API `3001`. If busy: `npm run cleanup:ports`.
- Supabase utilities: `npm run verify:supabase-schema` and `npm run backup:supabase-schema`.
