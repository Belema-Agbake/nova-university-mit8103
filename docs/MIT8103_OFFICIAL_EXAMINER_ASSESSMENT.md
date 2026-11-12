# MIT 8103 Official Examiner Assessment

Audit date: 2026-11-12. This is a read-only assessment against the official
MIT 8103 September Cohort 2026 PDF. It does not claim LMS submission, a
reachable private GitHub repository, or production verification.

## Executive summary

Nova University is an appropriate and consistently applied university/student
result portal case study. Its PostgreSQL/Prisma design, constraints,
transactions, local database tests, Firestore rules and application integration
are credible. However, the submission is not ready as an MIT 8103 portfolio:
there are no dedicated `portfolio-4-nosql` or `portfolio-5-distributed-cloud`
directories, no Git history in this workspace, and no compliant 2–3 page LMS
summary, individual reflection, references, or AI-use declaration.

## Official requirements checklist

| Official requirement | Status | Evidence |
|---|---|---|
| Consistent selected organisation | FULLY IMPLEMENTED | University result portal is reflected in `README.md`, Prisma schema and services. |
| Portfolio 1 evidence | FULLY IMPLEMENTED | `portfolios/portfolio-1-database-design/README.md`, `schema.dbml`, `docs/database/relationships.md`. |
| Portfolio 2 evidence | IMPLEMENTED BUT PARTIALLY VERIFIED | SQL files and captured JSON-format plans in `portfolios/portfolio-2-sql-optimisation/`; repeated median/p95 analysis is not yet evidenced. |
| Portfolio 3 evidence | FULLY IMPLEMENTED | `portfolios/portfolio-3-transactions-concurrency/run.ts`, `results.json`, registration locking service. |
| Portfolio 4 directory/evidence | PARTIALLY IMPLEMENTED | Firestore rules and outbox code exist, but no dedicated portfolio directory or delivery/retry demonstration. |
| Portfolio 5 directory/evidence | PARTIALLY IMPLEMENTED | Cloud SQL/App Hosting configuration and operations docs exist, but no dedicated directory and no verified worker/Scheduler deployment. |
| Private accessible GitHub and progressive commits | MISSING | `git log` reports no commits; remote is not configured. |
| 2–3 page LMS summary | MISSING | No compliant final submission document found. |
| Reflection, references, AI declaration | MISSING | Not found in submission-ready documentation. |

## Portfolio component assessment

| Component | Score | Examiner rationale |
|---|---:|---|
| Database Design and Modelling | **6/7** | Strong normalized Prisma schema, keys, constraints, ERD and actual migrations. Deduction for missing concise portfolio presentation/implementation screenshots. |
| Query Processing and Optimisation | **4/7** | Baseline SQL, candidate indexes and captured plans exist. Deduction because query results, repeated timings, median/p95 analysis and a clear before/after evidence table are incomplete. |
| Transactions and Concurrency | **6/7** | Serializable registration, row locks, rollback/concurrency benchmark and local tests are strong. Deduction for limited submission-ready screenshots/output narrative. |
| NoSQL and Advanced Data Models | **4/7** | Firestore rules, notification model and durable outbox are real; emulator rules tests passed. Deduction for no dedicated portfolio, no end-to-end worker retry/dead-letter proof, and limited NoSQL document examples. |
| Distributed and Cloud Database | **4/6** | Private Cloud SQL, regional availability, backups/PITR, Secret Manager and VPC configuration are evidenced. Deduction for no dedicated portfolio, replication/sharding/consistency discussion package and no completed restore/worker evidence. |
| Final Documentation | **1/6** | Technical documentation is substantial, but the required 2–3 page LMS summary, GitHub link, screenshots, reflection, references and AI declaration are missing. |
| **Portfolio total** | **25/40** | Strict submission-readiness score. |

## Official marking rubric

| Criterion | Score | Evidence and deduction |
|---|---:|---|
| Technical correctness | **7/8** | Prisma validation, production build, 15/15 isolated DB tests, 2/2 Firestore rules tests and 4/4 public E2E tests passed. Full role workflows/outbox delivery tests remain absent. |
| Database design quality | **6/6** | Strong normalized relationships, integrity constraints, migrations, audits and published-result protection. |
| Practical implementation | **6/8** | Working registration, grades, uploads, review/publication, transcript and tested security. Deduction for incomplete administrator workflows and authenticated E2E proof. |
| Query and performance analysis | **3/5** | Real plan files and candidate indexing exist; repeated measured analysis is not yet submission-ready. |
| Advanced database concepts | **4/5** | Serializable transactions, locking, audit history, outbox and Firestore projection are credible. End-to-end outbox proof is incomplete. |
| Documentation and GitHub organisation | **1/5** | Good internal docs, but required five portfolio layout, GitHub remote/commits and final LMS document are absent. |
| Technical reflection and individual understanding | **0/3** | No personal reflection or AI declaration found. |
| **Official rubric total** | **27/40** | Strict current-submission estimate. |

## Technical correctness

Verified locally: Prisma schema validation; Next.js production build; 15/15
isolated PostgreSQL tests; 2/2 Firestore emulator rules tests; 4/4 public
Playwright security tests. These results demonstrate real implementation, but
they do not prove authenticated student, lecturer and administrator journeys,
or outbox delivery/retry behaviour.

## Evidence traceability

- Schema/migrations: `prisma/schema.prisma`, `prisma/migrations/`.
- SQL: `portfolios/portfolio-2-sql-optimisation/baseline.sql`,
  `optimisations.sql`, `explain-results/`.
- Concurrency: `src/server/registration/registration-service.ts`,
  `portfolios/portfolio-3-transactions-concurrency/run.ts`.
- NoSQL: `firestore.rules`, `src/server/notifications/academic-event-service.ts`,
  `tests/firestore/notifications.rules.test.ts`.
- Cloud: `apphosting.yaml`, `docs/deployment/cloud-operations-evidence.md`.

## Top 10 mark-losing issues

1. No final 2–3 page LMS summary. **Critical, 3–5 marks at risk.**
2. No Git commits/remote or accessible private GitHub evidence. **Critical.**
3. No individual reflection, references or AI-use declaration. **3 marks at risk.**
4. No dedicated Portfolio 4 directory. **High.**
5. No dedicated Portfolio 5 directory. **High.**
6. SQL plans lack repeated median/p95 comparison and concise analysis. **High.**
7. No authenticated role E2E tests. **Medium.**
8. No end-to-end outbox delivery/retry/dead-letter demonstration. **Medium.**
9. Missing submission-ready screenshots/outputs per portfolio. **Medium.**
10. Cloud restore/worker/Scheduler evidence is incomplete. **Medium.**

## Essential actions before submission

1. Create the official five-directory portfolio submission package and map
   existing NoSQL/cloud evidence into portfolios 4 and 5.
2. Create the required 2–3 page LMS summary with case study, GitHub link,
   screenshots, reflection, references and AI-use declaration.
3. Initialise/push the approved private GitHub repository with progressive
   commits before the deadline.
4. Complete a concise repeated SQL benchmark table with plans and timings.
5. Add/record end-to-end Firestore outbox and role workflow evidence.

## Answers to examiner questions

The case study meets the assignment; all five conceptual areas are represented,
but all five portfolio submission packages are not complete. The database design
meets postgraduate expectations. SQL optimisation, NoSQL and cloud work are
technically promising but insufficiently packaged and demonstrated for full
marks. GitHub and LMS submission readiness are not evidenced. AI declaration
and personal reflection are missing.

## Confidence and limitations

Confidence is high for source/test observations and high for official PDF
requirements. It is low for GitHub accessibility/LMS status because neither is
configured or accessible from this workspace. Production deployment claims were
not used to award marks unless supported by read-only evidence.

**OFFICIAL RUBRIC SCORE: 27/40**

**PORTFOLIO COMPONENT SCORE: 25/40**

**OVERALL ESTIMATED GRADE: 26/40**

**SUBMISSION READINESS: NOT READY**
