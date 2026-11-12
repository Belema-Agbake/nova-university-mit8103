CREATE TYPE "AccountVerificationStatus" AS ENUM ('UNCLAIMED', 'PENDING_VERIFICATION', 'ACTIVE', 'REJECTED');

ALTER TABLE "users" ADD COLUMN "accountStatus" "AccountVerificationStatus" NOT NULL DEFAULT 'UNCLAIMED';

CREATE TABLE "account_claims" (
  "id" TEXT NOT NULL,
  "firebaseUid" TEXT NOT NULL,
  "requestedRole" "UserRole" NOT NULL,
  "officialUserId" TEXT NOT NULL,
  "suppliedId" TEXT NOT NULL,
  "status" "AccountVerificationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "decisionReason" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "account_claims_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "account_claims_firebaseUid_key" ON "account_claims"("firebaseUid");
CREATE UNIQUE INDEX "account_claims_officialUserId_key" ON "account_claims"("officialUserId");
CREATE INDEX "account_claims_status_createdAt_idx" ON "account_claims"("status", "createdAt");
ALTER TABLE "account_claims" ADD CONSTRAINT "account_claims_officialUserId_fkey" FOREIGN KEY ("officialUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "account_claims" ADD CONSTRAINT "account_claims_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
