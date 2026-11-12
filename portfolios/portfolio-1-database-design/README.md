# MIT 8103 Portfolio 1 — Database Design

## Requirements and entity identification

The approved scope is academic-result management only: identity, academic hierarchy, course delivery, registration, assessment, result workflow and upload validation. Finance, admissions and payroll are excluded. Entities are listed in `docs/database/schema-reference.md`; their attributes are the actual Prisma fields in `prisma/schema.prisma`.

## Keys and cardinality

Every table has a primary key. Foreign keys model the cardinalities diagrammed in `docs/database/relationships.md`. Composite primary keys identify a programme course requirement and a course prerequisite. Composite unique keys prevent duplicate registration, assignment and offering combinations.

## Normalisation analysis

**1NF:** every field is scalar or an intentionally atomic JSON configuration/audit detail; repeating schedules, scores and grade entries are separate rows.  
**2NF:** bridge-table non-key attributes depend on their full composite identity; for example requirement attributes depend on programme plus course.  
**3NF:** faculty/department/programme, course/offering, registration/result and policy/scale concepts are separated. Names and academic attributes are stored at their own determinants rather than repeated in registration or score rows.

## Constraints and trade-offs

Foreign keys and unique/check constraints are generated in the initial migration. PostgreSQL triggers implement cross-table assertions: semester dates must be within their session, an assessment score must target a component of the registered offering and not exceed its maximum, result publication requires all scores and total component weights of 100, and a published result is immutable. Audit rows are maintained by future transactional result-write services because an actor identity is not yet available.

## Indexes

See `docs/database/indexing-strategy.md`. Indexes are based on the existing student, lecturer and administrator read repositories.

## Evidence

On 2026-11-10, PostgreSQL 16.8 ran locally in Docker; migration `20261110063915_init` applied to development and test databases. Two seed executions left development with 3 students, 4 offerings, 2 results and 12 components. `npm run test:db` passed 7 tests: seed identities, duplicate registration, FK enforcement, two score-trigger validations, published-result immutability and stable registered-course ordering. No execution time claims are made.

## Artefacts

- Schema: `prisma/schema.prisma`
- Migration: `prisma/migrations/20261110063915_init/migration.sql`
- DBML: `schema.dbml`
- Mermaid ERD: `docs/database/relationships.md`
- Verification tests: `tests/database/database.test.ts`
