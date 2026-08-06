-- CreateEnum
CREATE TYPE "RetentionClass" AS ENUM ('ops', 'audit', 'regulated', 'docs');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'audit_export';
ALTER TYPE "AuditAction" ADD VALUE 'audit_key_rotate';
ALTER TYPE "AuditAction" ADD VALUE 'audit_log_read';

-- DropForeignKey
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_actor_user_id_fkey";

-- AlterTable
ALTER TABLE "audit_log" ADD COLUMN     "canonical" TEXT,
ADD COLUMN     "canonical_version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "org_seq" INTEGER,
ADD COLUMN     "prev_hash" TEXT,
ADD COLUMN     "record_hash" TEXT,
ADD COLUMN     "retention_class" "RetentionClass" NOT NULL DEFAULT 'audit',
ADD COLUMN     "signature" TEXT,
ADD COLUMN     "signing_key_id" TEXT;

-- CreateTable
CREATE TABLE "audit_signing_key" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "key_version" INTEGER NOT NULL,
    "public_key" TEXT NOT NULL,
    "private_key_encrypted" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "retired_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_signing_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_signing_key_organization_id_active_idx" ON "audit_signing_key"("organization_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "audit_signing_key_organization_id_key_version_key" ON "audit_signing_key"("organization_id", "key_version");

-- CreateIndex
CREATE UNIQUE INDEX "audit_log_organization_id_org_seq_key" ON "audit_log"("organization_id", "org_seq");

-- AddForeignKey
ALTER TABLE "audit_signing_key" ADD CONSTRAINT "audit_signing_key_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
