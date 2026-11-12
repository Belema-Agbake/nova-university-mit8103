# System overview

Next.js 16 App Router provides the local web shell. PostgreSQL 16 runs through Docker Compose. Prisma 6 owns the schema, versioned migration history and generated client.

`src/server/database/prisma.ts` is server-only and provides the local hot-reload-safe Prisma singleton. Repositories select narrow records; `academic-read-service.ts` exposes those read models. The sole Phase 2 route intentionally fails closed with `401`, because no verified session or role can yet exist.
