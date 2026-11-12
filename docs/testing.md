# Testing

Run `npm run test:db`, `npx prisma validate`, `npm run lint`, `npx tsc --noEmit`
and `npm run build`. Database tests use `TEST_DATABASE_URL`, which must point
to the isolated PostgreSQL test database. Firebase emulator tests must use
fictional accounts and must never seed production Firebase.

Authentication coverage must include sign-up, duplicate email, login,
incorrect password, reset email, logout, session restoration, token refresh,
UID mapping, role boundaries and unlinked academic identity restrictions.
