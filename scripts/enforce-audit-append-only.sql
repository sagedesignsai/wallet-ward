-- Append-only enforcement for audit_log (design R5).
--
-- RUN ORDER (see docs/architecture/GOVERNED_OUTPUT_PIPELINE.md §12):
--   1. Apply prisma/migrations/<ts>_add_audit_chain (additive, nullable chain
--      columns). Schema stays nullable in prisma/schema.prisma so there is no
--      migration drift.
--   2. Run the chain backfill: pnpm tsx scripts/backfill-audit-chain.ts
--      (requires DATABASE_URL/DIRECT_DATABASE_URL + MASTER_KEY). The script
--      opens a maintenance path itself via
--      set_config('app.audit_append_only', 'off', true) inside each per-org
--      transaction, so the trigger below must NOT be in place before it.
--   3. Apply THIS file (idempotent — safe to re-run).
--
-- The trigger is the authoritative enforcement: REVOKE is defense-in-depth.
-- The backfill/maintenance path uses the app.audit_append_only setting, which
-- only code that can reach this database session can set.
--
-- ROLE SPLIT (recommended): run the app as a dedicated NON-OWNER role with
-- only INSERT, SELECT on audit_log. Append-only is then enforced by
-- privileges even if the app.audit_append_only GUC is set. Keep the owner
-- role (e.g. neondb_owner) for migrations/backfill only — the owner bypasses
-- REVOKE and must never serve app traffic.

CREATE OR REPLACE FUNCTION enforce_audit_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('app.audit_append_only', true) = 'off' THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'audit_log is append-only: UPDATE/DELETE forbidden (org_seq %)',
    COALESCE(OLD.org_seq, 0);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_log_append_only ON audit_log;
CREATE TRIGGER trg_audit_log_append_only
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION enforce_audit_append_only();

-- Defense-in-depth: strip default write privileges. If the deployed app role
-- holds explicit UPDATE/DELETE grants on audit_log, revoke from that role too
-- (the trigger above is the real guarantee either way).
REVOKE UPDATE, DELETE ON TABLE audit_log FROM PUBLIC;
-- TRUNCATE bypasses per-row triggers entirely, so it must be revoked too.
REVOKE TRUNCATE ON TABLE audit_log FROM PUBLIC;

-- Optional post-backfill hardening (design R4): SET NOT NULL on the chain
-- columns once backfill has populated every row. prev_hash is intentionally
-- excluded (the first row of each org chain has prev_hash = NULL).
-- Applying this makes prisma/schema.prisma (nullable columns) drift from the
-- database, so only do it together with a schema edit + follow-up migration.
--
-- ALTER TABLE "audit_log" ALTER COLUMN "org_seq" SET NOT NULL;
-- ALTER TABLE "audit_log" ALTER COLUMN "canonical" SET NOT NULL;
-- ALTER TABLE "audit_log" ALTER COLUMN "record_hash" SET NOT NULL;
-- ALTER TABLE "audit_log" ALTER COLUMN "signature" SET NOT NULL;
-- ALTER TABLE "audit_log" ALTER COLUMN "signing_key_id" SET NOT NULL;
