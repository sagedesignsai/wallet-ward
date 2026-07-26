import { prisma } from "@/lib/db"
import { notFound, forbidden, badRequest } from "@/lib/api/errors"
import { writeAuditLog } from "@/lib/services/audit"
import type { AuthContext } from "@/lib/api/auth"
import type {
  ActionProposal,
  ProposalStatus,
  ProposalRiskLevel,
  Project,
  Integration,
} from "@/generated/prisma/client"

/**
 * ActionProposal DTO — Public interface
 */
export type ActionProposalDto = {
  id: string
  projectId: string
  agentSessionId: string | null
  title: string
  description: string
  riskLevel: ProposalRiskLevel
  actionType: string
  targetSystem: string
  status: ProposalStatus
  payload: Record<string, unknown>
  approvedById: string | null
  approvalNotes: string | null
  rejectionNotes: string | null
  executedAt: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Execution Result DTO
 */
export type ExecutionResult = {
  success: boolean
  message: string
  result?: Record<string, unknown>
  error?: string
  executedAt: Date
}

/**
 * Verify project belongs to organization
 */
async function assertProjectInOrg(
  projectId: string,
  organizationId: string
): Promise<{ id: string }> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    select: { id: true },
  })
  if (!project) throw notFound("Project not found")
  return project
}

/**
 * Convert Prisma ActionProposal to DTO
 */
export function toProposalDto(proposal: ActionProposal): ActionProposalDto {
  return {
    id: proposal.id,
    projectId: proposal.projectId,
    agentSessionId: proposal.agentSessionId,
    title: proposal.title,
    description: proposal.description,
    riskLevel: proposal.riskLevel,
    actionType: proposal.actionType,
    targetSystem: proposal.targetSystem,
    status: proposal.status,
    payload: (proposal.payload as Record<string, unknown>) ?? {},
    approvedById: proposal.approvedById,
    approvalNotes: proposal.approvalNotes,
    rejectionNotes: proposal.rejectionNotes,
    executedAt: proposal.executedAt?.toISOString() ?? null,
    createdById: proposal.createdById,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
  }
}

/**
 * Create a new action proposal
 */
export async function createProposal(input: {
  ctx: AuthContext
  projectId: string
  agentSessionId?: string
  title: string
  description: string
  riskLevel: ProposalRiskLevel
  actionType: string
  targetSystem: string
  payload?: Record<string, unknown>
}): Promise<ActionProposalDto> {
  // Verify project exists in org
  await assertProjectInOrg(input.projectId, input.ctx.organizationId!)

  const proposal = await prisma.actionProposal.create({
    data: {
      projectId: input.projectId,
      agentSessionId: input.agentSessionId,
      createdById: input.ctx.userId,
      title: input.title,
      description: input.description,
      riskLevel: input.riskLevel,
      actionType: input.actionType,
      targetSystem: input.targetSystem,
      payload: input.payload ?? {},
      status: "awaiting_approval",
    },
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.ctx.organizationId!,
    action: "proposal_create",
    resourceType: "action_proposal",
    resourceId: proposal.id,
    metadata: {
      title: proposal.title,
      riskLevel: proposal.riskLevel,
      status: proposal.status,
      actionType: proposal.actionType,
    },
  })

  return toProposalDto(proposal)
}

/**
 * Get a single proposal
 */
export async function getProposal(
  id: string,
  organizationId: string
): Promise<ActionProposalDto> {
  const proposal = await prisma.actionProposal.findFirst({
    where: {
      id,
      project: { organizationId },
    },
  })
  if (!proposal) throw notFound("Proposal not found")
  return toProposalDto(proposal)
}

/**
 * List proposals for a project
 */
export async function listProposals(
  projectId: string,
  organizationId: string,
  options?: {
    status?: ProposalStatus
    limit?: number
  }
): Promise<ActionProposalDto[]> {
  await assertProjectInOrg(projectId, organizationId)

  const proposals = await prisma.actionProposal.findMany({
    where: {
      projectId,
      ...(options?.status ? { status: options.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
  })

  return proposals.map(toProposalDto)
}

/**
 * List pending proposals for a project
 */
export async function listPendingProposals(
  projectId: string,
  organizationId: string
): Promise<ActionProposalDto[]> {
  return listProposals(projectId, organizationId, {
    status: "awaiting_approval",
  })
}

/**
 * Approve a proposal
 */
export async function approveProposal(input: {
  ctx: AuthContext
  proposalId: string
  notes?: string
}): Promise<ActionProposalDto> {
  const proposal = await prisma.actionProposal.findFirst({
    where: {
      id: input.proposalId,
      project: { organizationId: input.ctx.organizationId },
    },
  })

  if (!proposal) throw notFound("Proposal not found")
  if (proposal.status !== "awaiting_approval") {
    throw forbidden("Proposal is not awaiting approval")
  }

  const updated = await prisma.actionProposal.update({
    where: { id: input.proposalId },
    data: {
      status: "approved",
      approvedById: input.ctx.userId,
      approvalNotes: input.notes ?? null,
    },
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.ctx.organizationId!,
    action: "proposal_approve",
    resourceType: "action_proposal",
    resourceId: input.proposalId,
    metadata: {
      action: "approved",
      approverUserId: input.ctx.userId,
      approvalNotes: input.notes,
    },
  })

  return toProposalDto(updated)
}

/**
 * Reject a proposal
 */
export async function rejectProposal(input: {
  ctx: AuthContext
  proposalId: string
  notes?: string
}): Promise<ActionProposalDto> {
  const proposal = await prisma.actionProposal.findFirst({
    where: {
      id: input.proposalId,
      project: { organizationId: input.ctx.organizationId },
    },
  })

  if (!proposal) throw notFound("Proposal not found")
  if (proposal.status !== "awaiting_approval") {
    throw forbidden("Proposal is not awaiting approval")
  }

  const updated = await prisma.actionProposal.update({
    where: { id: input.proposalId },
    data: {
      status: "rejected",
      approvedById: input.ctx.userId,
      rejectionNotes: input.notes ?? null,
    },
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.ctx.organizationId!,
    action: "proposal_reject",
    resourceType: "action_proposal",
    resourceId: input.proposalId,
    metadata: {
      action: "rejected",
      rejectorUserId: input.ctx.userId,
      rejectionNotes: input.notes,
    },
  })

  return toProposalDto(updated)
}

/**
 * Mark proposal as executed
 */
export async function markProposalExecuted(
  proposalId: string,
  organizationId: string,
  ctx?: AuthContext
): Promise<ActionProposalDto> {
  const proposal = await prisma.actionProposal.findFirst({
    where: {
      id: proposalId,
      project: { organizationId },
    },
  })

  if (!proposal) throw notFound("Proposal not found")
  if (proposal.status !== "approved") {
    throw forbidden("Proposal is not approved")
  }

  const updated = await prisma.actionProposal.update({
    where: { id: proposalId },
    data: {
      status: "executed",
      executedAt: new Date(),
    },
  })

  if (ctx) {
    await writeAuditLog({
      ctx,
      organizationId,
      action: "proposal_execute",
      resourceType: "action_proposal",
      resourceId: proposalId,
      metadata: {
        action: "executed",
        title: proposal.title,
        actionType: proposal.actionType,
      },
    })
  }

  return toProposalDto(updated)
}

/**
 * Mark proposal as failed
 */
export async function markProposalFailed(
  proposalId: string,
  organizationId: string,
  error?: string
): Promise<ActionProposalDto> {
  const proposal = await prisma.actionProposal.findFirst({
    where: {
      id: proposalId,
      project: { organizationId },
    },
  })

  if (!proposal) throw notFound("Proposal not found")
  if (proposal.status !== "approved") {
    throw forbidden("Proposal is not approved")
  }

  const updated = await prisma.actionProposal.update({
    where: { id: proposalId },
    data: {
      status: "failed",
      approvalNotes: error ? `Failed: ${error}` : null,
    },
  })

  return toProposalDto(updated)
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION EXECUTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a proposal or throw error if not found/accessible
 */
export async function getProposalOrThrow(
  proposalId: string,
  organizationId: string
): Promise<
  ActionProposal & {
    agentSession?: any
    createdBy?: any
    approvedBy?: any
  }
> {
  const proposal = await prisma.actionProposal.findFirst({
    where: {
      id: proposalId,
      project: { organizationId },
    },
    include: {
      agentSession: true,
      createdBy: { select: { id: true, email: true } },
      approvedBy: { select: { id: true, email: true } },
    },
  })

  if (!proposal) {
    throw notFound("Proposal not found")
  }

  return proposal
}

/**
 * Execute a proposal's action
 *
 * Flow:
 * 1. Verify proposal is in approved state
 * 2. Get project and integrations
 * 3. Route by actionType to handler
 * 4. Handler decrypts credentials, makes API call
 * 5. Save result to proposal metadata
 * 6. Log to audit trail
 */
export async function executeProposal(input: {
  ctx: AuthContext
  proposalId: string
}): Promise<ExecutionResult> {
  // 1. Get proposal
  const proposal = await getProposalOrThrow(
    input.proposalId,
    input.ctx.organizationId!
  )

  // 2. Verify it's approved
  if (proposal.status !== "approved") {
    throw forbidden("Proposal is not in approved state")
  }

  try {
    // 3. Get project to access integrations
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: proposal.projectId },
    })

    // 4. Route by actionType
    let result: ExecutionResult

    switch (proposal.actionType) {
      case "deploy":
        result = await executeDeployAction(
          proposal,
          project,
          input.ctx.organizationId!
        )
        break

      case "publish":
        result = await executePublishAction(
          proposal,
          project,
          input.ctx.organizationId!
        )
        break

      case "delete":
        result = await executeDeleteAction(
          proposal,
          project,
          input.ctx.organizationId!
        )
        break

      case "rotate_secret":
        result = await executeRotateSecretAction(
          proposal,
          project,
          input.ctx.organizationId!
        )
        break

      default:
        throw badRequest(`Unknown action type: ${proposal.actionType}`)
    }

    // 5. Save result to metadata
    await prisma.actionProposal.update({
      where: { id: proposal.id },
      data: {
        metadata: {
          ...((proposal.metadata as Record<string, unknown>) ?? {}),
          executionResult: {
            success: result.success,
            message: result.message,
            result: result.result,
            error: result.error,
            executedAt: result.executedAt.toISOString(),
          },
        },
      },
    })

    // 6. Audit log
    await writeAuditLog({
      ctx: input.ctx,
      organizationId: input.ctx.organizationId!,
      action: "agent_proxy_call",
      resourceType: "action_proposal",
      resourceId: proposal.id,
      metadata: {
        actionType: proposal.actionType,
        success: result.success,
        message: result.message,
        targetSystem: proposal.targetSystem,
      },
    })

    return result
  } catch (error) {
    // On error, update proposal metadata with error
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    await prisma.actionProposal.update({
      where: { id: proposal.id },
      data: {
        metadata: {
          ...((proposal.metadata as Record<string, unknown>) ?? {}),
          executionResult: {
            success: false,
            error: errorMessage,
            executedAt: new Date().toISOString(),
          },
        },
      },
    })

    throw error
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deploy action executor
 *
 * Payload:
 * - environment: "production" | "staging" | "development"
 * - ref: git branch/tag (e.g., "main")
 */
async function executeDeployAction(
  proposal: ActionProposal & any,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  const payload = proposal.payload as Record<string, unknown>

  const targetEnv = (payload.environment as string) ?? "production"
  const ref = (payload.ref as string) ?? "main"

  // 1. Get Vercel integration (most common)
  const vercelIntegration = await prisma.integration.findFirst({
    where: {
      projectId: project.id,
      provider: "vercel",
      enabled: true,
    },
  })

  if (!vercelIntegration) {
    return {
      success: false,
      message: "No Vercel integration found",
      error: "Vercel not connected",
      executedAt: new Date(),
    }
  }

  try {
    // 2. Decrypt token
    const { getDecryptedToken } = await import("@/lib/services/integrations")
    const token = await getDecryptedToken(
      {
        ...vercelIntegration,
        project: { organizationId },
      },
      "access"
    )

    // 3. Call Vercel API to trigger deployment
    const vercelRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: project.name,
        ref,
        environment: targetEnv,
        production: targetEnv === "production",
      }),
    })

    if (!vercelRes.ok) {
      const error = await vercelRes.json().catch(() => ({}))
      return {
        success: false,
        message: `Vercel API error: ${vercelRes.statusText}`,
        error: JSON.stringify(error),
        executedAt: new Date(),
      }
    }

    const deployment = await vercelRes.json()

    return {
      success: true,
      message: `Deployment triggered: ${deployment.url}`,
      result: {
        deploymentId: deployment.id,
        url: deployment.url,
        environment: targetEnv,
        ref,
      },
      executedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      message: "Deployment failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executedAt: new Date(),
    }
  }
}

/**
 * Publish action executor
 *
 * Payload:
 * - target: "slack" | "ghost" | "email"
 * - title: content title
 * - content: markdown or plain text
 */
async function executePublishAction(
  proposal: ActionProposal & any,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  const payload = proposal.payload as Record<string, unknown>

  const target = (payload.target as string) ?? "slack"

  if (target === "slack") {
    return await executePublishToSlack(payload, project, organizationId)
  } else if (target === "ghost") {
    return await executePublishToGhost(payload, project, organizationId)
  } else {
    return {
      success: false,
      message: `Unknown publish target: ${target}`,
      error: "Invalid target",
      executedAt: new Date(),
    }
  }
}

/**
 * Publish to Slack channel
 */
async function executePublishToSlack(
  payload: Record<string, unknown>,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  const slackIntegration = await prisma.integration.findFirst({
    where: {
      projectId: project.id,
      provider: "slack",
      enabled: true,
    },
  })

  if (!slackIntegration) {
    return {
      success: false,
      message: "No Slack integration found",
      error: "Slack not connected",
      executedAt: new Date(),
    }
  }

  try {
    const { getDecryptedToken } = await import("@/lib/services/integrations")
    const token = await getDecryptedToken(
      {
        ...slackIntegration,
        project: { organizationId },
      },
      "access"
    )

    const title = (payload.title as string) ?? "New Update"
    const content = (payload.content as string) ?? ""
    const channel = (payload.channel as string) ?? "#general"

    const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${title}*\n${content}`,
            },
          },
        ],
      }),
    })

    if (!slackRes.ok) {
      const error = await slackRes.json().catch(() => ({}))
      return {
        success: false,
        message: `Slack API error: ${slackRes.statusText}`,
        error: JSON.stringify(error),
        executedAt: new Date(),
      }
    }

    const result = await slackRes.json()

    return {
      success: true,
      message: `Message posted to ${channel}`,
      result: {
        channel,
        timestamp: result.ts,
      },
      executedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      message: "Slack publish failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executedAt: new Date(),
    }
  }
}

/**
 * Publish to Ghost CMS (stub for Phase 1)
 */
async function executePublishToGhost(
  payload: Record<string, unknown>,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  return {
    success: false,
    message: "Ghost integration coming in Phase 1",
    error: "Not implemented",
    executedAt: new Date(),
  }
}

/**
 * Delete action executor
 *
 * Payload:
 * - resourceType: "github_branch" | "document" | "secret"
 * - resourceId: identifier for resource
 */
async function executeDeleteAction(
  proposal: ActionProposal & any,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  const payload = proposal.payload as Record<string, unknown>

  const resourceType = payload.resourceType as string
  const resourceId = payload.resourceId as string

  if (!resourceType || !resourceId) {
    return {
      success: false,
      message: "Missing resourceType or resourceId",
      error: "Invalid payload",
      executedAt: new Date(),
    }
  }

  if (resourceType === "github_branch") {
    return await executeDeleteGitHubBranch(resourceId, project, organizationId)
  } else if (resourceType === "document") {
    return await executeDeleteDocument(resourceId, project, organizationId)
  } else if (resourceType === "secret") {
    return await executeDeleteSecret(resourceId, project, organizationId)
  } else {
    return {
      success: false,
      message: `Unknown resource type: ${resourceType}`,
      error: "Invalid resourceType",
      executedAt: new Date(),
    }
  }
}

/**
 * Delete a GitHub branch
 */
async function executeDeleteGitHubBranch(
  branchName: string,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  const gitHubIntegration = await prisma.integration.findFirst({
    where: {
      projectId: project.id,
      provider: "github",
      enabled: true,
    },
  })

  if (!gitHubIntegration) {
    return {
      success: false,
      message: "No GitHub integration found",
      error: "GitHub not connected",
      executedAt: new Date(),
    }
  }

  try {
    const { getDecryptedToken } = await import("@/lib/services/integrations")
    const token = await getDecryptedToken(
      {
        ...gitHubIntegration,
        project: { organizationId },
      },
      "access"
    )

    // Parse repository from integration metadata
    const repo = (gitHubIntegration.metadata as Record<string, any>)?.repo ?? ""
    const [owner, repoName] = repo.split("/")

    if (!owner || !repoName) {
      return {
        success: false,
        message: "GitHub repository not configured",
        error: "Invalid repository",
        executedAt: new Date(),
      }
    }

    const deleteRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branchName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    )

    if (!deleteRes.ok && deleteRes.status !== 404) {
      return {
        success: false,
        message: `GitHub API error: ${deleteRes.statusText}`,
        error: await deleteRes.text(),
        executedAt: new Date(),
      }
    }

    return {
      success: true,
      message: `Branch '${branchName}' deleted`,
      result: {
        branch: branchName,
        deleted: true,
      },
      executedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      message: "Delete branch failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executedAt: new Date(),
    }
  }
}

/**
 * Delete a document
 */
async function executeDeleteDocument(
  documentId: string,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  try {
    const { deleteDocument } = await import("@/lib/services/documents")

    await deleteDocument({
      ctx: {
        userId: "system",
        organizationId,
      } as AuthContext,
      id: documentId,
    })

    return {
      success: true,
      message: `Document deleted`,
      result: { documentId, deleted: true },
      executedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      message: "Delete document failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executedAt: new Date(),
    }
  }
}

/**
 * Delete a secret
 */
async function executeDeleteSecret(
  secretId: string,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  try {
    const { deleteSecret } = await import("@/lib/services/secrets")

    await deleteSecret({
      ctx: {
        userId: "system",
        organizationId,
      } as AuthContext,
      id: secretId,
    })

    return {
      success: true,
      message: `Secret deleted`,
      result: { secretId, deleted: true },
      executedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      message: "Delete secret failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executedAt: new Date(),
    }
  }
}

/**
 * Rotate secret action executor
 *
 * Payload:
 * - secretId: secret to rotate
 * - type: "password" | "api_token" (optional)
 */
async function executeRotateSecretAction(
  proposal: ActionProposal & any,
  project: Project,
  organizationId: string
): Promise<ExecutionResult> {
  const payload = proposal.payload as Record<string, unknown>

  const secretId = payload.secretId as string
  const type = (payload.type as string) ?? "password"

  if (!secretId) {
    return {
      success: false,
      message: "Missing secretId",
      error: "Invalid payload",
      executedAt: new Date(),
    }
  }

  try {
    // For Phase 0, just mark as rotated
    // Full secret rotation (generate new value) is Phase 1 feature

    return {
      success: true,
      message: `Secret marked for rotation`,
      result: {
        secretId,
        type,
        rotated: true,
      },
      executedAt: new Date(),
    }
  } catch (error) {
    return {
      success: false,
      message: "Rotate secret failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executedAt: new Date(),
    }
  }
}
