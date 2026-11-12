# Authentication

Firebase Authentication is the exclusive password and session provider.
Clients create/sign in with Firebase email/password, obtain an ID token, and
send it as `Authorization: Bearer <token>`. The Next.js server verifies the
token with Firebase Admin SDK, then resolves the Firebase UID and role from
PostgreSQL. A Firebase account alone does not grant academic permissions.

Student and lecturer onboarding creates an immediate non-sensitive profile.
Existing official identities cannot be claimed using only a matriculation or
staff number; trusted linking remains a separate workflow. Administrators are
pre-provisioned and public administrator registration is disabled.

Local development can opt into the Firebase Auth Emulator with
`NEXT_PUBLIC_USE_FIREBASE_AUTH_EMULATOR=true` and `FIREBASE_AUTH_EMULATOR_HOST`.
