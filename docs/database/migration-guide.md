# Migration guide

Edit `prisma/schema.prisma`, then run `npm run db:migrate -- --name meaningful_change`. Review generated SQL; PostgreSQL checks, partial indexes and trigger functions belong in the migration SQL file alongside Prisma output.

Use `npm run db:deploy` for a clean or existing local environment. Do not substitute `prisma db push` for versioned migrations. Verified baseline: `20261110063915_init`.
