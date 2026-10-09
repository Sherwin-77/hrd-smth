# AGENTS.md

NestJS + Postgres API (`backend/`) and a Next.js frontend (`frontend/`), wired together by `docker-compose.yml`.

## Important Guidelines
Follow these 4 guidelines closely.

### 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
  Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Layout

- Two independent npm projects. There is **no root `package.json` and no workspace** — always run commands from inside `backend/` or `frontend/`, and never `npm install` at the root.
- `backend/` is tracked as regular files in the root repo (there is no nested `backend/.git`).
- `frontend/AGENTS.md` is **auto-generated and re-written by `next dev`** (see `node_modules/next/dist/server/lib/generate-agent-files.js`). Never hand-edit or delete it; leave its block intact in diffs. `frontend/CLAUDE.md` just `@AGENTS.md`-includes it.
- Both `backend/README.md` and `frontend/README.md` are unmodified framework boilerplate. They are not documentation for this project — trust `package.json`, configs, and source instead.

## Backend

- **ESM, so relative imports must carry the `.js` extension**, even when importing a `.ts` file: `import { AppModule } from './app.module.js'`. `package.json` has `"type": "module"` and `tsconfig.json` uses `module`/`moduleResolution: nodenext`.
- Backend path alias is `#*` → `./src/*`, wired through **both** `tsconfig.json` (`paths`) and `package.json` (`imports`). Import via `#...` with the `.js` suffix: `import { Payroll } from '#payrolls/entities/payroll.entity.js'`.
- **Tests are Vitest, not Jest**. `npm test` is `vitest run` over `**/*.spec.ts`; `npm run test:e2e` uses `vitest.config.e2e.ts` over `**/*.e2e-spec.ts`. Globals are enabled, so `describe`/`it`/`expect` need no import.
- The e2e suite imports `AppModule`, so it needs a live Postgres. Unit specs do not — the shipped specs run with no DB and all pass. The e2e without a DB fails with `ECONNREFUSED`.
- **There is no `typecheck` script.** `npm run build` (`nest build`, `tsc` under the hood) is the typecheck. `tsconfig.build.json` excludes `test/` and `**/*spec.ts`, so a green build does not typecheck tests.
- Lint is **oxlint with type-aware rules**, not eslint: `npm run lint` → `oxlint --type-aware src/ test/`. `.oxlintrc.json` sets `no-floating-promises: error` and turns `no-explicit-any` off.
- Format with prettier (`singleQuote`, `trailingComma: all`). `npm run format` globs `src/**`, `test/**`.
- Auth is bearer-session based via `@nestjs/authentication`: `AuthenticationModule.forRoot({ session })` registers its guard **globally**, so every route is authenticated unless marked `@Public()` (only `POST /auth/login` is).
- Controllers sit behind `AuthenticationGuard` and validate ids with `ParseUUIDPipe`. Statuses are const-object unions, not TS enums (e.g `PayrollStatus`: `active`/`inactive`; `PayslipStatus`: `pending`/`approved`/`rejected`). Use resource DTO for any response unless stated otherwise.
- `@casl/ability` is installed but unused anywhere in `src/`; authentication is built (see above) but role/ability authorization is still unbuilt.

### Database

- TypeORM CLI scripts use the ESM runner (`typeorm-ts-node-esm -d ./src/data-source.ts`), which loads the `.ts` data source correctly. `make:migration`, `migrate:up`, and `migrate:down` still need a live Postgres (they fail with `ECONNREFUSED` without one), so do not assume a schema change was applied just because the script was invoked.
- DB config is **duplicated** in two files that must stay in sync: `TypeOrmModule.forRoot(...)` in `src/app.module.ts` and the `DataSource` in `src/data-source.ts`. Env is read straight off `process.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), not via `ConfigService`.
- `synchronize: false` and `migrationsRun` is never set, so the app neither auto-creates the schema nor auto-applies migrations on boot. `src/database/migrations/` and `src/data-source.ts` globs `src/database/migrations/*{.ts,.js}`.

## Frontend

- Next.js **16.3.6** on React 19. This version has breaking changes; read the matching guide in `frontend/node_modules/next/dist/docs/` (present, with `01-app`, `02-pages`, `03-architecture`) before writing pages, routing, or data-fetching code.
- `app/layout.tsx` uses the Next 16 generated global `LayoutProps<"/">`. Prefer these generated route types over hand-written prop interfaces, and do not "fix" them into a missing-import error.
- `tsconfig.json` maps `@/*` to `./*` — project-root-relative, **not** `src/*`. There is no `src/` directory; the app router lives in `app/`.
- Tailwind v4 via `@tailwindcss/postcss`. No theme file; utilities are used directly.
- No test runner is configured on this side.
- `npm run lint` is `eslint` with a flat config (`eslint-config-next` core-web-vitals + typescript). There is no separate typecheck script; `npx tsc --noEmit` passes on its own.

### Design: simple, no AI slop

- Plain and flat: solid colors (white cards on light gray pages) with thin gray borders. No gradients, glassmorphism, blur, glows, or shadows.
- No decorative motion: no page transitions, hover lifts, fades, or animation libraries. Only functional states (loading text, disabled buttons, inline errors).
- Typography: Inter only, default scale, regular/medium/semibold weights. No oversized hero type.
- Restrained color: neutrals plus one accent (`blue-700`, `blue-800` hover). No multi-color palettes.
- No decorative icons, emojis, illustrations, or stock imagery. Text labels and standard form controls only.
- Semantic HTML with visible labels and focus states; prefer centered single-column layouts.

## Commands

| Purpose | Command | CWD |
| --- | --- | --- |
| Backend dev server (port 3001) | `npm run start:dev` | `backend/` |
| Backend typecheck | `npm run build` | `backend/` |
| Backend unit tests | `npm test` | `backend/` |
| Backend e2e tests (needs Postgres) | `npm run test:e2e` | `backend/` |
| Seed starter superadmin (idempotent, needs Postgres) | `npm run seed` | `backend/` |
| Frontend dev server (port 3000) | `npm run dev` | `frontend/` |
| Full stack with Postgres | `docker compose up --build` | repo root |

Verification order that matters: `npm run build` → `npm run lint` → `npm test` in `backend/`, then `npx tsc --noEmit` → `npm run lint` in `frontend/`. There is no CI to catch omissions for you.

## Ports and env

`db` 5432, `backend` 3001, `frontend` 3000. Docker service hostnames differ from browser-facing URLs: inside the compose network the backend is `http://backend:3001`, but the browser needs `http://localhost:3001` — hence the separate `INTERNAL_API_URL` and `NEXT_PUBLIC_API_URL` in compose. For a local non-Docker run, `backend/.env` is gitignored local config and `backend/.env.example` is its template (empty `DB_*`, filled `SEED_SUPERADMIN_*` defaults for the starter superadmin); when unset, the code falls back to `localhost:5432`, `postgres`/`secret`, database `hrd` (see `src/data-source.ts` and `src/app.module.ts`). `npm run seed` is the idempotent superadmin seed (reads `SEED_SUPERADMIN_*`).
