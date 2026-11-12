# Portfolio 3 — Transactions and Concurrency

Benchmarks were executed on 2026-11-11 against the isolated local PostgreSQL database `nova_university_test`. No production or Cloud SQL connections were used. Each run created temporary benchmark fixtures and removed them afterward without resetting the database or deleting Docker volumes.

## Measured results

| Scenario | Concurrency | Success / failure | Retries | Avg ms | P95 ms | Throughput/s | Integrity |
|---|---:|---:|---:|---:|---:|---:|---|
| Last available course seat | 20 | 1 / 19 | 0 | 42.034 | 69.314 | 274.919 | Verified |
| Duplicate registration | 20 | 1 / 19 | 0 | 19.784 | 22.556 | 876.635 | Verified |
| Concurrent course dropping | 20 | 1 / 19 | 0 | 13.842 | 21.530 | 873.077 | Verified |
| Transaction rollback | 1 | 1 / 0 | 0 | 1.987 | 1.987 | 500.551 | Verified |
| Row locking | 20 | 20 / 0 | 0 | 26.411 | 44.045 | 437.573 | Verified |
| Serializable retries | 20 | 5 / 15 | 71 | 131.881 | 161.205 | 123.067 | Verified |
| Concurrent grade updates | 20 | 20 / 0 | 190 | 104.388 | 167.699 | 115.210 | Verified |
| Result publication consistency | 20 | 1 / 19 | 19 | 18.909 | 19.747 | 1003.190 | Verified |

The seat, duplicate-registration, drop, and publication scenarios intentionally permit one state transition and reject competing attempts. Serializable registration is capacity-limited to five successful registrations. Grade updates preserve all 20 increments through serializable retry handling. Publication produces one published result and one audit record.

The executable benchmark is [`run.ts`](./run.ts), and the machine-readable evidence is [`results.json`](./results.json).
