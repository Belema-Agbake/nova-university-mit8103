# SQL optimisation evidence plan

This repository now includes a guarded benchmark command: `npm run benchmark:sql`.
It requires `BENCHMARK_DATABASE_URL` and refuses any database host other than
`localhost`, `127.0.0.1`, or `::1`. It must never be pointed at Cloud SQL.

## Repeatable method

1. Create a dedicated local database such as `nova_university_benchmark`.
2. Apply the existing Prisma migrations to that local database only.
3. Load a deterministic synthetic dataset with at least 10,000 students,
   multiple sessions, registrations, lecturer assignments and results.
4. Run every baseline query three times after `ANALYZE`; retain the median.
5. Apply only candidate indexes from `optimisations.sql`, rerun the plans, and
   retain an index only when the plan/timing shows a material benefit or an
   integrity/access requirement justifies it.
6. Save unedited `EXPLAIN (ANALYZE, BUFFERS)` output in
   `portfolios/portfolio-2-sql-optimisation/explain-results/`.

Sequential scans are acceptable when PostgreSQL estimates that scanning a
small fraction of a small table is cheaper than an index lookup. The evidence
must therefore report actual timings and buffers rather than claiming that an
index is always better.

## Current status

The existing 3-student benchmark is retained as an honest baseline. No large
dataset timings are claimed in this repository yet; measured files must be
generated on the isolated local database before they are submitted.
