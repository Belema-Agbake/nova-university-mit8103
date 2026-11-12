# Security boundaries

Firebase Authentication is deferred. Client-side role switching is explicitly a visual preview and cannot grant any record access.

`GET /api/v1/academic` calls `requireAuthenticatedUser()` and returns `401 AUTHENTICATION_REQUIRED`. It never accepts arbitrary user IDs, role headers or browser claims. Server-only services/repositories will be connected only after verified Firebase sessions and role-scoped authorization are approved.

No credential uses a `NEXT_PUBLIC_` prefix; `.env` and `.env.local` are Git-ignored.
