# Superfrej

A full-featured **vacation-rental PMS + Channel Manager**: reservations, multi-property calendar, guest CRM, payments & deposits, unified inbox, automated messaging, guest portal, direct-booking site, and OTA channel sync — in one calm, modern app.

> Status: in active development. Modules ship one at a time — see the [roadmap issues](https://github.com/frejfrej/superfrej/issues) and [docs/product/feature-set.md](docs/product/feature-set.md).

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000 — database is created automatically
```

No external services required: persistence is a local SQLite file (`data/superfrej.db`), and every integration (payments, OTA channels, SMS…) has a local implementation.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm test` | Run unit tests (Vitest) |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run db:generate` | Generate SQL migrations after editing `src/db/schema.ts` |
| `npm run db:migrate` | Create/upgrade the local database file |
| `npm run db:studio` | Browse the database (Drizzle Studio) |

## Documentation

- [Architecture](docs/architecture.md) — stack, layering rules, how to switch SQLite → Postgres
- [Feature set & roadmap](docs/product/feature-set.md)
- [Feature docs](docs/features/) — one page per shipped feature
- [User guide](docs/user-guide/) — end-user documentation

## Contributing workflow

Every change starts from a GitHub issue (story under an epic), is developed on a branch (`feat/<issue>-<slug>`), reviewed, and merged via PR with green CI (typecheck, lint, tests, build).
