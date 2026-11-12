# Repeated SQL benchmark results

- Database: `nova_university_benchmark` (local, fictional data only)
- Dataset: 10,000 synthetic students
- Method: 1 warm-up plus 11 measured EXPLAIN ANALYZE runs per query

| Query | Median (ms) | P95 (ms) |
| --- | ---: | ---: |
| Q1 student registered courses | 1.353 | 1.837 |
| Q2 available course offerings | 0.858 | 1.532 |
| Q3 lecturer assigned courses | 1.101 | 1.320 |
| Q4 lecturer course roster | 1.184 | 1.467 |
| Q5 administrator pending result approvals | 0.896 | 1.360 |
| Q6 student published results | 1.665 | 2.276 |
| Q7 outbox pending delivery queue | 2.439 | 3.726 |

The matching JSON file contains execution-plan output and individual timing samples.
