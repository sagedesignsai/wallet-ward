-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'proposal_create';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'proposal_approve';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'proposal_reject';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'proposal_execute';
