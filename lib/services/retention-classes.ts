import type { AuditAction, RetentionClass } from "@prisma/client"

// Retention class is DERIVED from the audit action (design R14). The value is
// stored denormalized on each row at write time. `ops` and `docs` have no
// writers yet (Phases 2-3) but exist in the enum.

function unreachable(value: never): never {
  throw new Error(`Unhandled AuditAction: ${String(value)}`)
}

export function retentionClassFor(action: AuditAction): RetentionClass {
  switch (action) {
    // Regulated: proposal workflow, agent secret/credential access, sandbox
    // lifecycle, and the audit evidence itself. Everything else defaults to
    // `audit`.
    case "proposal_create":
    case "proposal_approve":
    case "proposal_reject":
    case "proposal_execute":
    case "agent_proxy_call":
    case "secret_reveal":
    case "secret_export":
    case "secret_import":
    case "secret_version_create":
    case "audit_export":
    case "audit_key_rotate":
      return "regulated"

    // Phase 2 agent-action telemetry: agent tool calls and sandbox lifecycle.
    case "sandbox_create":
    case "sandbox_delete":
      return "regulated"

    case "tool_call":
      return "audit"

    // RESERVED — `tool_call_blocked` has no writer yet (the stop-guard for
    // denied tools is a Phase 3/4 change; nothing emits this action today).
    // Classified here so the retention mapping is complete when a writer
    // lands; audit class = reviewable-only, same as `tool_call`.
    case "tool_call_blocked":
      return "audit"

    case "organization_create":
    case "project_create":
    case "project_update":
    case "project_delete":
    case "environment_create":
    case "environment_update":
    case "environment_delete":
    case "secret_create":
    case "secret_update":
    case "secret_delete":
    case "document_create":
    case "document_update":
    case "document_delete":
    case "task_create":
    case "task_update":
    case "task_delete":
    case "integration_create":
    case "integration_delete":
    case "audit_log_read":
      return "audit"

    default:
      // Exhaustiveness check: adding a new AuditAction without classifying it
      // here is a compile-time error.
      return unreachable(action)
  }
}
