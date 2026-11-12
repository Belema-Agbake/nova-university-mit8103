# Local PostgreSQL setup

Prerequisites: Docker Desktop and Node.js.

```powershell
Copy-Item .env.example .env.local
Copy-Item .env.local .env
docker compose --env-file .env.local up -d --wait
npm run db:migrate
npm run db:seed
```

Compose pins `postgres:16.8-alpine`, uses a named volume and waits for `pg_isready`. Credentials are supplied only through ignored local env files.

Create the test database once, then deploy/seed it with `TEST_DATABASE_URL` assigned as `DATABASE_URL` before each integration-test run. `npm run db:seed` deletes and rebuilds development data in FK-safe order. `docker compose down -v` destroys the local volume and must never be run against production.
