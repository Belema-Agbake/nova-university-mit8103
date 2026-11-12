# MIT 8103 Portfolio Evidence Index

This directory contains assignment evidence only. The working Nova University
application remains in the project root so that the frontend, API routes,
server services, database schema and tests run together from one codebase.

## Run the application and evidence suites

```powershell
npm run dev
npm run test:db:isolated
npm run test:firestore
npm run test:outbox
npm run test:e2e
npm run test:e2e:roles
npm run benchmark:sql
```

## Portfolio map

| Portfolio | Assignment focus | Primary evidence |
| --- | --- | --- |
| 1 | Database design and modelling | `prisma/`, schema DBML, migrations, constraints and relationship documentation |
| 2 | Query processing and optimisation | SQL scripts, 10,000-student benchmark, `EXPLAIN ANALYZE` results and index analysis |
| 3 | Transactions and concurrency | Executable concurrency benchmark and machine-readable results |
| 4 | NoSQL and advanced data models | Firestore rules, transactional outbox, reliability tests and data-flow explanation |
| 5 | Distributed and cloud databases | App Hosting, Cloud SQL, private VPC, recovery, Cloud Run worker and Scheduler evidence |

Each portfolio README links to the exact frontend or backend code that supports
its claim. No application code is duplicated here.
