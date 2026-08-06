import { randomUUID } from "crypto";
import {
  createSandbox,
  deleteSandbox,
  getSandboxPreviewUrl,
  getSignedPreviewUrl,
  requireClient,
} from "@/lib/daytona";
import { prisma as db } from "@/lib/db";
import {
  agentActorCtx,
  bestEffortAuditWrite,
} from "@/lib/ai/telemetry";
import type { AgentSession } from "@prisma/client";

// ---------------------------------------------------------------------------
// OpenCode Service
//
// Lifecycle management for an OpenCode server running INSIDE a Daytona
// sandbox. The sandbox's preview URL IS the backend: the frontend talks to
// the OpenCode HTTP/SSE API directly at that URL (see the Daytona guides
// "opencode-sdk-agent" / "opencode-web-agent").
//
// Flow: provision sandbox → install pinned opencode-ai CLI → inject the
// Daytona agent config via OPENCODE_CONFIG_CONTENT → start `opencode serve`
// as a background process session → wait for the "listening" marker → return
// the preview URLs.
// ---------------------------------------------------------------------------

/** Pin the OpenCode CLI version — the v1 event contract matches the guides. */
export const OPENCODE_VERSION = "1.1.1";
export const OPENCODE_PORT = 4096;
export const OPENCODE_HOSTNAME = "0.0.0.0";
export const OPENCODE_READY_MARKER = "opencode server listening";
export const OPENCODE_SIGNED_URL_TTL_S = 3600;

/** `npm i -g opencode-ai` can take minutes on a fresh sandbox. */
const INSTALL_TIMEOUT_S = 600;
/** Give the server up to 3 minutes to reach the "listening" marker. */
const START_TIMEOUT_S = 180;

/**
 * Env vars allowed through from the caller. The free default provider works
 * with none of these; known model keys are passed as sandbox env vars.
 */
const ALLOWED_ENV_KEYS = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "OPENROUTER_API_KEY",
] as const;

/**
 * Daytona-aware agent config injected into the sandbox. Base64-embedded in
 * the start command via OPENCODE_CONFIG_CONTENT (OpenCode's supported env-var
 * config transport).
 */
const DAYTONA_AGENT_CONFIG = {
  $schema: "https://opencode.ai/config.json",
  default_agent: "daytona",
  agent: {
    daytona: {
      description: "Daytona sandbox-aware coding agent",
      mode: "primary",
      prompt:
        "You are running inside a Daytona Cloud Sandbox as a coding agent. " +
        "Use the bash tool for shell commands, the read/write tools for files, " +
        "and work in /home/daytona. When you start a dev server, prefer port 3000.",
    },
  },
};

export interface StartOpencodeInput {
  organizationId: string;
  projectId: string;
  sessionName?: string;
  prompt?: string;
  envVars?: Record<string, string>;
}

export interface OpencodeSessionResult {
  session: AgentSession;
  sandboxId: string;
  /** Daytona process-session ID running `opencode serve` inside the sandbox. */
  processSessionId: string;
  port: number;
  /** Plain preview URL — for server-side `@opencode-ai/sdk` clients. */
  opencodeUrl: string;
  /** Signed preview URL — for iframe embedding (token in URL). */
  signedUrl: string;
  token: string;
  expiresIn: number;
}

export class OpencodeService {
  /**
   * Provision a sandbox and start an OpenCode server inside it.
   * Destroys the sandbox if any step fails so a paid sandbox never leaks.
   */
  static async start(input: StartOpencodeInput): Promise<OpencodeSessionResult> {
    // 1. Resolve project (org-scoped) for the sandbox name.
    const project = await db.project.findFirst({
      where: { id: input.projectId, organizationId: input.organizationId },
      select: { name: true, slug: true },
    });
    if (!project) {
      throw new Error(`Project '${input.projectId}' not found`);
    }

    // 2. Provision the sandbox with only allow-listed model API keys.
    const envVars: Record<string, string> = {};
    if (input.envVars) {
      for (const key of ALLOWED_ENV_KEYS) {
        if (input.envVars[key]) envVars[key] = input.envVars[key];
      }
    }

    const sandboxName = `opencode-${project.slug}-${Date.now().toString(36)}`;
    const sandboxInfo = await createSandbox(sandboxName, "typescript", envVars);

    // Best-effort audit log — never fail provisioning, and never swallow
    // failures silently (audit evidence must not vanish without trace).
    bestEffortAuditWrite({
      ctx: agentActorCtx,
      organizationId: input.organizationId,
      action: "sandbox_create",
      resourceType: "sandbox",
      resourceId: sandboxInfo.id,
      metadata: {
        sandboxName: sandboxInfo.name,
        language: "typescript",
        source: "opencode-service",
      },
    });

    try {
      const client = requireClient();
      const sandbox = await client.get(sandboxInfo.id);

      // 3. Install the pinned OpenCode CLI inside the sandbox.
      await sandbox.process.executeCommand(
        `npm i -g opencode-ai@${OPENCODE_VERSION}`,
        undefined,
        undefined,
        INSTALL_TIMEOUT_S,
      );

      // 4. Start `opencode serve` as a long-running background process session.
      const processSessionId = `opencode-${randomUUID()}`;
      await sandbox.process.createSession(processSessionId);

      const configB64 = Buffer.from(JSON.stringify(DAYTONA_AGENT_CONFIG)).toString("base64");
      const corsOrigin = process.env.NEXT_PUBLIC_APP_URL;
      const corsFlag = corsOrigin ? ` --cors "${corsOrigin}"` : "";
      const command =
        `export OPENCODE_CONFIG_CONTENT="${configB64}" && ` +
        `opencode serve --port ${OPENCODE_PORT} --hostname ${OPENCODE_HOSTNAME}${corsFlag}`;

      const res = await sandbox.process.executeSessionCommand(
        processSessionId,
        { command, runAsync: true },
      );
      if (!res.cmdId) {
        throw new Error("Failed to start OpenCode server: no command id returned");
      }

      // 5. Wait for the server's "listening" stdout marker.
      await OpencodeService.waitForReady(sandbox, processSessionId, res.cmdId);

      // 6. Resolve preview URLs (plain for API clients, signed for iframes).
      const opencodeUrl = await getSandboxPreviewUrl(sandboxInfo.id, OPENCODE_PORT);
      const signed = await getSignedPreviewUrl(
        sandboxInfo.id,
        OPENCODE_PORT,
        OPENCODE_SIGNED_URL_TTL_S,
      );

      // 7. Persist an AgentSession (type "coding" — the AgentType enum has no
      // dedicated value; OpenCode details live in metadata).
      const session = await db.agentSession.create({
        data: {
          projectId: input.projectId,
          name: input.sessionName || `OpenCode: ${(input.prompt ?? "workspace").slice(0, 40)}`,
          type: "coding",
          status: "running",
          prompt: input.prompt ?? null,
          daytonaSandboxId: sandboxInfo.id,
          sandboxUrl: opencodeUrl,
          currentTask: input.prompt ?? null,
          metadata: {
            opencodePort: OPENCODE_PORT,
            processSessionId,
            signedUrl: signed.url,
            expiresIn: OPENCODE_SIGNED_URL_TTL_S,
          },
        },
      });

      return {
        session,
        sandboxId: sandboxInfo.id,
        processSessionId,
        port: OPENCODE_PORT,
        opencodeUrl,
        signedUrl: signed.url,
        token: signed.token,
        expiresIn: OPENCODE_SIGNED_URL_TTL_S,
      };
    } catch (error) {
      // Never leak a paid sandbox from partial provisioning.
      try {
        if (sandboxInfo) {
          await deleteSandbox(sandboxInfo.id);
          // Best-effort audit log for the cleanup deletion.
          bestEffortAuditWrite({
            ctx: agentActorCtx,
            organizationId: input.organizationId,
            action: "sandbox_delete",
            resourceType: "sandbox",
            resourceId: sandboxInfo.id,
            metadata: {
              reason: "cleanup",
              source: "opencode-service",
            },
          });
        }
      } catch {
        // ignore cleanup failure; the original error is more useful
      }
      throw error;
    }
  }

  /**
   * Stop an OpenCode session by destroying its sandbox (kills the server).
   * Returns the updated AgentSession or null when the session row is missing.
   */
  static async stop(sandboxId: string): Promise<AgentSession | null> {
    const session = await db.agentSession.findFirst({
      where: { daytonaSandboxId: sandboxId },
      include: { project: { select: { organizationId: true } } },
    });

    try {
      await deleteSandbox(sandboxId);
      // Best-effort audit log — only when the delete succeeded; the org comes
      // from the owning session's project (never swallow failures silently).
      if (session) {
        bestEffortAuditWrite({
          ctx: agentActorCtx,
          organizationId: session.project.organizationId,
          action: "sandbox_delete",
          resourceType: "sandbox",
          resourceId: sandboxId,
          metadata: {
            reason: "stop",
            source: "opencode-service",
          },
        });
      }
    } catch (error) {
      console.error("[OpencodeService] Failed to delete sandbox:", error);
    }

    if (!session) return null;
    return db.agentSession.update({
      where: { id: session.id },
      data: { status: "completed", updatedAt: new Date() },
    });
  }

  /** List OpenCode (coding) sessions for a project, org-scoped. */
  static async listSessions(
    projectId: string,
    organizationId: string,
  ): Promise<AgentSession[]> {
    return db.agentSession.findMany({
      where: {
        projectId,
        type: "coding",
        project: { organizationId },
      },
      orderBy: { createdAt: "desc" },
      include: { proposals: true },
    });
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private static async waitForReady(
    sandbox: Awaited<ReturnType<ReturnType<typeof requireClient>["get"]>>,
    processSessionId: string,
    commandId: string,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      let output = "";

      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve();
      };

      const timer = setTimeout(() => {
        finish(
          new Error(
            `OpenCode server did not become ready within ${START_TIMEOUT_S}s. ` +
              `Last output: ${output.slice(-300)}`,
          ),
        );
      }, START_TIMEOUT_S * 1000);

      void sandbox.process
        .getSessionCommandLogs(
          processSessionId,
          commandId,
          (chunk) => {
            output += chunk;
            if (output.includes(OPENCODE_READY_MARKER)) finish();
          },
          (chunk) => {
            output += chunk;
          },
        )
        .catch(() => finish(new Error("OpenCode server process ended before ready")));
    });
  }
}
