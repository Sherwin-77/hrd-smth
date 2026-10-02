# AGENTS.md

NestJS + Postgres API (`backend/`) and a Next.js frontend (`frontend/`), wired together by `docker-compose.yml`.
The backend already has an HR domain model: `employees` is fully implemented, while `payrolls` has entities but still a stub service (see Backend). Frontend state was not re-verified.

## Layout

- Two independent npm projects. There is **no root `package.json` and no workspace** — always run commands from inside `backend/` or `frontend/`, and never `npm install` at the root.
- `backend/` is tracked as regular files in the root repo (there is no nested `backend/.git`).
- `frontend/AGENTS.md` is **auto-generated and re-written by `next dev`** (see `node_modules/next/dist/server/lib/generate-agent-files.js`). Never hand-edit or delete it; leave its block intact in diffs. `frontend/CLAUDE.md` just `@AGENTS.md`-includes it.
- Both `backend/README.md` and `frontend/README.md` are unmodified framework boilerplate. They are not documentation for this project — trust `package.json`, configs, and source instead.

## Backend

- **ESM, so relative imports must carry the `.js` extension**, even when importing a `.ts` file: `import { AppModule } from './app.module.js'`. `package.json` has `"type": "module"` and `tsconfig.json` uses `module`/`moduleResolution: nodenext`.
- Backend path alias is `#*` → `./src/*`, wired through **both** `tsconfig.json` (`paths`) and `package.json` (`imports`). Import via `#...` with the `.js` suffix: `import { Payroll } from '#payrolls/entities/payroll.entity.js'`.
- **Tests are Vitest, not Jest** (the README still claims the old Nest defaults). `npm test` is `vitest run` over `**/*.spec.ts`; `npm run test:e2e` uses `vitest.config.e2e.ts` over `**/*.e2e-spec.ts`. Globals are enabled, so `describe`/`it`/`expect` need no import.
- The e2e suite imports `AppModule`, so it needs a live Postgres. Unit specs do not — the shipped specs (8 files, 22 tests) run with no DB, but 5 currently fail on query-builder mocks (see state note). The base e2e (`test/app.e2e-spec.ts`, `GET /`) passes on a host with live Postgres (user-verified 2026-10-02); in a sandbox with no DB it fails with `ECONNREFUSED` as expected.
- **There is no `typecheck` script.** `npm run build` (`nest build`, `tsc` under the hood) is the typecheck. `tsconfig.build.json` excludes `test/` and `**/*spec.ts`, so a green build does not typecheck tests.
- Lint is **oxlint with type-aware rules**, not eslint: `npm run lint` → `oxlint --type-aware src/ test/`. `.oxlintrc.json` sets `no-floating-promises: error` and turns `no-explicit-any` off.
- Format with prettier (`singleQuote`, `trailingComma: all`). `npm run format` globs `src/**`, `test/**`, and the root-level `data-source.ts`.
- `main.ts` calls `app.enableCors()` with no origin config, so any frontend origin is allowed.
- Domain state: `employees` is fully implemented (TypeORM-backed CRUD, paginated `GET /employees` with search, unique-email guard, uuid ids). `payrolls` has entities (`Payroll`, `PayrollComponent`) but the service is still Nest-generated stubs returning strings — and the controller coerces `+id` while the entity PK is uuid, so treat payrolls as unbuilt. Entities were fixed 2026-10-02: the duplicate `payrolls/entities/payroll-component.entity.ts` is gone (canonical is `payroll-components/entities/payroll-component.entity.ts`), columns use explicit snake_case names with `Relation<>` types, and `payroll_components.date` now has a `@Column`.

### Database

- TypeORM CLI scripts use the ESM runner (`typeorm-ts-node-esm -d ./data-source.ts`), which loads the `.ts` data source correctly — the previous `typeorm-ts-node-commonjs` runner died with `ERR_UNKNOWN_FILE_EXTENSION`. `make:migration`, `migrate:up`, and `migrate:down` still need a live Postgres (they fail with `ECONNREFUSED` without one), so do not assume a schema change was applied just because the script was invoked.
- DB config is **duplicated** in two files that must stay in sync: `TypeOrmModule.forRoot(...)` in `src/app.module.ts` and the `DataSource` in `data-source.ts`. Env is read straight off `process.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), not via `ConfigService`.
- `synchronize: false` and `migrationsRun` is never set, so the app neither auto-creates the schema nor auto-applies migrations on boot. `src/database/migrations/` holds 3 migrations (`employees`, `payrolls`, `payroll_components`, all `UUIDV7()` defaults) and `data-source.ts` globs `src/database/migrations/*{.ts,.js}`. Warning: `src/scripts/make-migration.js` still generates into stale `src/migrations/${name}`, which the glob misses — fix the script before creating new migrations.
- Runtime entity loading is via `autoLoadEntities: true` in `src/app.module.ts` (entities registered through `TypeOrmModule.forFeature`); `data-source.ts` currently sets no `entities` array (migration CLI only), so the old `src/**/*.entity` glob note no longer applies.
- `dotenv` (`^18.0.5`) is a declared dependency; `data-source.ts` imports it via `dotenv/config`.
- `@casl/ability` is installed but unused anywhere in `src/`; treat authorization as unbuilt.
- In `docker-compose.yml` the `db` service has a `pg_isready` healthcheck and `backend` waits on it (`condition: service_healthy`), so the backend no longer boots against a Postgres that is not ready yet.

## Frontend

- Next.js **16.3.6** on React 19. This version has breaking changes; read the matching guide in `frontend/node_modules/next/dist/docs/` (present, with `01-app`, `02-pages`, `03-architecture`) before writing pages, routing, or data-fetching code.
- `app/layout.tsx` uses the Next 16 generated global `LayoutProps<"/">`. Prefer these generated route types over hand-written prop interfaces, and do not "fix" them into a missing-import error.
- `tsconfig.json` maps `@/*` to `./*` — project-root-relative, **not** `src/*`. There is no `src/` directory; the app router lives in `app/`.
- Tailwind v4 via `@tailwindcss/postcss`. No theme file; utilities are used directly.
- No test runner is configured on this side.
- `docker-compose.yml` passes `NEXT_PUBLIC_*` variables at **runtime**, but `frontend/Dockerfile` builds first — anything prefixed `NEXT_PUBLIC_` is inlined into the client bundle at build time, so setting it in compose alone will not reach the browser. It needs a build arg or runtime config.
- `npm run lint` is `eslint` with a flat config (`eslint-config-next` core-web-vitals + typescript). There is no separate typecheck script; `npx tsc --noEmit` passes on its own.

## Commands

| Purpose | Command | CWD |
| --- | --- | --- |
| Backend dev server (port 3001) | `npm run start:dev` | `backend/` |
| Backend typecheck | `npm run build` | `backend/` |
| Backend unit tests | `npm test` | `backend/` |
| Backend e2e tests (needs Postgres) | `npm run test:e2e` | `backend/` |
| Frontend dev server (port 3000) | `npm run dev` | `frontend/` |
| Full stack with Postgres | `docker compose up --build` | repo root |

Verification order that matters: `npm run build` → `npm run lint` → `npm test` in `backend/`, then `npx tsc --noEmit` → `npm run lint` in `frontend/`. There is no CI to catch omissions for you.

Note on this workspace's current state (verified 2026-10-02): `npm run build` and `npm run lint` (warnings only, no errors) pass in `backend/`; `npm test` runs 8 files / 22 tests with 5 failing on query-builder mocks (`employees.repository.spec` ×2, `employees.service.spec` ×3). The base e2e (`GET /`) passes on a host with live Postgres (user-verified 2026-10-02). Frontend `npx tsc --noEmit` was not re-verified.

## Ports and env

`db` 5432, `backend` 3001, `frontend` 3000. Docker service hostnames differ from browser-facing URLs: inside the compose network the backend is `http://backend:3001`, but the browser needs `http://localhost:3001` — hence the separate `INTERNAL_API_URL` and `NEXT_PUBLIC_API_URL` in compose. For a local non-Docker run, `backend/.env` and `backend/.env.example` exist (empty placeholders); when unset, the code falls back to `localhost:5432`, `postgres`/`secret`, database `hrd` (see `data-source.ts` and `src/app.module.ts`).
