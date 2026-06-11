# Superfrej — Architecture

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) + React 19 | One TypeScript codebase for UI + API; server components keep data access on the server |
| Language | TypeScript everywhere (strict) | Requirement; zod schemas shared between client and server |
| Styling | Tailwind CSS 4 + custom design tokens ("Maison" design system) | Unique UI without a component-library look |
| Persistence | SQLite file (`better-sqlite3`) via **Drizzle ORM** | File-backed (no external install), real SQL, typed queries |
| Validation | zod | Single source of truth for input validation, reused in tests |
| Tests | Vitest (+ in-memory SQLite) | Fast unit tests against the real schema |
| CI | GitHub Actions | typecheck + lint + test + build on every PR |

## Layout

```
src/
  app/          # Next.js routes (pages + API route handlers). Thin: parse, call service, render.
  components/   # React components (shell/, ui/, per-feature)
  db/           # Drizzle schema, client, migrations runner, test utils
  server/       # Domain services — ALL business logic lives here, framework-free
  lib/          # Pure shared helpers
drizzle/        # Generated SQL migrations (committed)
data/           # Local SQLite files (gitignored)
docs/           # Architecture, feature docs, user guide
```

**Rule: business logic never lives in routes or components.** Services in `src/server/<feature>/` take a `Db` handle as first argument (dependency injection — this is what makes them unit-testable against in-memory SQLite) and throw typed errors; route handlers translate those to HTTP.

## Database

- Schema: `src/db/schema.ts` (Drizzle `sqlite-core`).
- Migrations: generated with `npm run db:generate`, committed under `drizzle/`, applied automatically on first connection (and by `npm run db:migrate`).
- Conventions: text UUID ids, epoch-ms timestamps, money in integer cents, JSON columns validated by zod in services.

### Switching to a real database later

Designed to be a small, mechanical change:

1. `npm i pg` (or postgres.js); change `src/db/client.ts` to `drizzle-orm/node-postgres`.
2. Change `src/db/schema.ts` imports from `sqlite-core` to `pg-core` (column types map 1:1 given our conventions — no sqlite-specific types are used).
3. Re-generate migrations with the `postgresql` dialect.

Nothing in `src/server/**` or `src/app/**` changes: services only see the Drizzle query API.

## External integrations

Every integration (OTA channels, payment provider, SMS/email, smart locks, dynamic pricing) is defined as a TypeScript interface in `src/server/<domain>/` with at least one **local implementation** (simulator or file-based) so the entire product works offline with zero accounts. Real adapters (Stripe, OTA APIs…) are added later behind the same interfaces.

## Engineering workflow

- Every feature = GitHub issue (story) under an epic → branch `feat/<issue>-<slug>` → PR referencing the issue → review → squash-merge.
- Unit tests required for services; CI must be green.
- Each feature ships with `docs/features/<feature>.md` (behavior + decisions) and a user-guide page under `docs/user-guide/`.
