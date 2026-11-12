# Nova University Result Management System

Local Next.js 16 academic-result UI with PostgreSQL 16, Prisma 6, deterministic fictional seed data, and a fail-closed authentication boundary.

## Start locally

1. Copy `.env.example` to `.env.local`, choose local-only values, then copy it to `.env` for the Prisma CLI.
2. `docker compose --env-file .env.local up -d --wait`
3. `npm run db:migrate && npm run db:seed && npm run dev`

The UI is a local preview. No academic data HTTP endpoint is usable until Phase 3 authentication: `GET /api/v1/academic` returns `401`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run db:generate` | Generate Prisma Client. |
| `npm run db:migrate` | Create/apply a development migration. |
| `npm run db:deploy` | Apply committed migrations. |
| `npm run db:seed` | Rebuild fictional development data. |
| `npm run test:db` | Run integration tests against `TEST_DATABASE_URL`. |
| `npm run lint` / `npx tsc --noEmit` / `npm run build` | Quality checks. |

See `docs/database/local-setup.md` before resetting any database. No Firebase deployment or Git push is included.
