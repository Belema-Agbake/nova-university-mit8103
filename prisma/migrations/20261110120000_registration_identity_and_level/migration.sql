-- Link a verified Firebase identity to at most one local user. The nullable
-- column permits registrar-led account linking for existing student records.
ALTER TABLE "users" ADD COLUMN "firebaseUid" TEXT;

-- The default is deliberately the lowest academic level. Registrars must set
-- the authoritative level before a student can register higher-level courses.
ALTER TABLE "students" ADD COLUMN "officialLevel" INTEGER NOT NULL DEFAULT 100;

CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");
