import { tool } from "ai";
import { z } from "zod";

/**
 * Clone Repository Tool
 *
 * Clones a connected Git repository into a Daytona sandbox for code access.
 * The agent can then use executeCommand to browse and modify the cloned code.
 * RESTRICTED: Only coding agents can clone repositories.
 *
 * Private repositories are cloned using the project's GitHub integration
 * token, injected into the clone URL. The token is scrubbed from the stored
 * remote URL and never logged or returned to the agent.
 */

/**
 * Extract owner/repo from a GitHub URL. Supports the HTTPS forms
 * (https://github.com/owner/repo.git or https://github.com/owner/repo) and the
 * SSH form (git@github.com:owner/repo.git). Returns null for non-GitHub hosts
 * or unrecognized URL shapes.
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // HTTPS: https://github.com/owner/repo(.git) — negative lookbehind rejects
  // lookalike hosts like evil.github.com
  const httpsMatch = url.match(
    /(?<![a-zA-Z0-9-])github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/,
  );
  if (httpsMatch) return { owner: httpsMatch[1], repo: httpsMatch[2] };

  // SSH: git@github.com:owner/repo(.git)
  const sshMatch = url.match(/git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (sshMatch) return { owner: sshMatch[1], repo: sshMatch[2] };

  return null;
}

/**
 * Quote a value for safe interpolation into a POSIX shell command. Wraps the
 * value in single quotes and escapes embedded single quotes with the standard
 * '\'' pattern, so user-controlled values can never break out of the command
 * string or inject additional commands.
 */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * Remove any embedded token or credential-bearing URL from command output
 * before it is returned to the agent.
 */
function scrubTokenFromOutput(
  output: string | undefined,
  token: string | undefined,
): string {
  let scrubbed = output ?? "";
  if (token) {
    scrubbed = scrubbed.split(token).join("[REDACTED]");
  }
  // Defense-in-depth: redact any https URL carrying inline credentials.
  return scrubbed.replace(/https:\/\/[^@\s]+@github\.com\//g, "https://github.com/");
}

export const cloneRepositoryTool = tool({
  description: "Clone a connected Git repository into a running Daytona sandbox. After cloning, use executeCommand to browse and modify files. Requires an existing sandbox.",
  inputSchema: z.object({
    projectId: z.string().optional().describe("The project ID. Defaults to the active project if omitted"),
    repositoryId: z.string().describe("The repository ID from getRepositories"),
    sandboxId: z.string().describe("The sandbox ID to clone into"),
  }),
  contextSchema: z.object({
    organizationId: z.string(),
    projectId: z.string().optional(),
  }),
  execute: async ({ projectId, repositoryId, sandboxId }, { context }) => {
    try {
      const resolvedProjectId = projectId ?? context.projectId
      const { prisma } = await import("@/lib/db");

      // Verify repository exists and belongs to project
      const repository = await prisma.repository.findFirst({
        where: {
          id: repositoryId,
          projectId: resolvedProjectId,
          project: { organizationId: context.organizationId },
        },
      });

      if (!repository) {
        throw new Error("Repository not found or access denied.");
      }

      // Validate the repository name before any command runs (fail closed).
      // Defense-in-depth on top of shell quoting: reject anything that does
      // not match conservative git hosting rules.
      if (!/^[A-Za-z0-9._-]{1,100}$/.test(repository.name)) {
        return {
          success: false,
          message: "Repository name is invalid and cannot be cloned",
        };
      }

      // Get the Daytona client
      const { getDaytonaClient } = await import("@/lib/daytona");
      const client = getDaytonaClient();
      if (!client) {
        throw new Error("Daytona is not configured. Add DAYTONA_API_KEY to your environment.");
      }

      // Clone the repository into the sandbox
      const sandbox = await client.get(sandboxId);

      // Resolve the project the repository actually belongs to. Falls back to
      // the verified repository's project when no projectId was provided, so
      // credential lookups are always scoped to the correct project.
      const effectiveProjectId = resolvedProjectId ?? repository.projectId;

      // Look up the project's enabled GitHub integration so private
      // repositories can be cloned with the stored token.
      const integration = effectiveProjectId
        ? await prisma.integration.findFirst({
            where: {
              projectId: effectiveProjectId,
              provider: "github",
              enabled: true,
              project: { organizationId: context.organizationId },
            },
            include: { project: true },
          })
        : null;

      // Decrypt the token whenever a matching integration exists and the URL
      // is a GitHub URL. The token is never returned to the agent or logged;
      // it is injected into the sandbox environment for the session and
      // scrubbed from the clone's git config after cloning.
      let token: string | undefined;
      const parsedUrl = integration ? parseGitHubUrl(repository.url) : null;
      if (integration && parsedUrl) {
        try {
          const { getDecryptedToken } = await import("@/lib/services/integrations");
          token = await getDecryptedToken(integration, "access");
        } catch (error) {
          return {
            success: false,
            repository: {
              id: repository.id,
              name: repository.name,
              url: repository.url,
              branch: repository.branch,
            },
            error:
              error instanceof Error
                ? error.message
                : "Failed to decrypt the GitHub token",
            message: `Failed to decrypt the GitHub token for repository ${repository.name}.`,
          };
        }
      }

      // A private repository cannot be cloned anonymously — require a
      // connected GitHub integration before attempting the clone.
      if (repository.accessType === "private" && !integration) {
        return {
          success: false,
          repository: {
            id: repository.id,
            name: repository.name,
            url: repository.url,
            branch: repository.branch,
          },
          error: "No GitHub integration token available",
          message: `Repository ${repository.name} is private and no GitHub integration is connected to this project.`,
        };
      }

      // Build the clone URL. GitHub URLs get the token injected via the
      // standard x-access-token PAT form; all other URLs fall back to the
      // plain URL (public repos / non-GitHub providers / custom URLs).
      const cloneUrl =
        token && parsedUrl
          ? `https://x-access-token:${token}@github.com/${parsedUrl.owner}/${parsedUrl.repo}.git`
          : repository.url;

      const cloneCmd = `git clone ${shellQuote(cloneUrl)} ${shellQuote(repository.name)}`;
      const result = await sandbox.process.executeCommand(cloneCmd, undefined, {}, 120);

      if (result.exitCode !== 0) {
        return {
          success: false,
          repository: {
            id: repository.id,
            name: repository.name,
            url: repository.url,
            branch: repository.branch,
          },
          error: scrubTokenFromOutput(
            result.artifacts?.stdout || result.result || "Clone failed",
            token,
          ),
          message: `Failed to clone ${repository.name}. The repository may require authentication.`,
        };
      }

      // Remove the token from the stored remote URL so it never persists in
      // the sandbox's git config. The clone is reported as failed if this
      // reset cannot be done, to avoid leaving the token behind.
      if (token && cloneUrl !== repository.url) {
        const resetCmd = `git -C ${shellQuote(repository.name)} remote set-url origin ${shellQuote(repository.url)}`;
        let resetResult = await sandbox.process.executeCommand(resetCmd, undefined, {}, 30);

        // A failed reset would leave the tokenized URL in the clone's git
        // config, so retry once before falling back to active cleanup.
        if (resetResult.exitCode !== 0) {
          resetResult = await sandbox.process.executeCommand(resetCmd, undefined, {}, 30);
        }

        if (resetResult.exitCode !== 0) {
          // The token may still be in <dir>/.git/config. Clean up best-effort:
          // scrub the token from the config file, then remove the clone as a
          // last resort if scrubbing also fails.
          const scrubCmd = `sed -i 's|https://x-access-token:[^@]*@|https://|g' ${shellQuote(`${repository.name}/.git/config`)}`;
          let scrubOk = false;
          try {
            const scrubResult = await sandbox.process.executeCommand(scrubCmd, undefined, {}, 30);
            scrubOk = scrubResult.exitCode === 0;
          } catch (error) {
            console.warn("[clone-repository] token scrub command failed:", error);
          }

          let removed = false;
          if (!scrubOk) {
            const rmCmd = `rm -rf ${shellQuote(repository.name)}`;
            try {
              const rmResult = await sandbox.process.executeCommand(rmCmd, undefined, {}, 30);
              removed = rmResult.exitCode === 0;
            } catch (error) {
              console.warn("[clone-repository] clone removal command failed:", error);
            }
          }

          if (scrubOk) {
            console.warn("[clone-repository] remote URL reset failed; scrubbed token from git config");
          } else if (removed) {
            console.warn("[clone-repository] remote URL reset and config scrub failed; removed clone");
          } else {
            console.warn("[clone-repository] remote URL reset, config scrub, and clone removal all failed; token may persist in the sandbox");
          }

          return {
            success: false,
            repository: {
              id: repository.id,
              name: repository.name,
              url: repository.url,
              branch: repository.branch,
            },
            error: scrubTokenFromOutput(
              resetResult.artifacts?.stdout || resetResult.result || "Failed to reset remote URL",
              token,
            ),
            message: `Repository ${repository.name} was cloned but the remote URL could not be sanitized. Please delete the clone and retry.`,
          };
        }
      }

      // Checkout the correct branch if not main
      if (repository.branch !== "main") {
        const branchCmd = `cd ${shellQuote(repository.name)} && git checkout ${shellQuote(repository.branch)}`;
        await sandbox.process.executeCommand(branchCmd, undefined, {}, 30);
      }

      // Inject the integration credentials into the sandbox session so
      // subsequent agent commands (API calls, future git operations) can use
      // them. Injection failures are warnings, never tool failures.
      let injected: string[] = [];
      let injectErrors: string[] = [];
      if (effectiveProjectId) {
        try {
          const { injectIntegrationCredentials } = await import("@/lib/services/integrations");
          const injectResult = await injectIntegrationCredentials(
            sandboxId,
            effectiveProjectId,
            context.organizationId,
          );
          injected = injectResult.injected;
          injectErrors = injectResult.errors;
        } catch (error) {
          console.error("[clone-repository] credential injection failed:", error);
          injectErrors = ["Credential injection failed"];
        }
      }

      return {
        success: true,
        repository: {
          id: repository.id,
          name: repository.name,
          url: repository.url,
          branch: repository.branch,
          provider: repository.provider,
        },
        sandbox: {
          id: sandboxId,
        },
        path: `/home/user/${repository.name}`,
        credentials: {
          injected,
          errors: injectErrors,
        },
        message:
          injectErrors.length > 0
            ? `Repository "${repository.name}" cloned successfully into sandbox. Working directory: /home/user/${repository.name}. Note: some integration credentials could not be injected: ${injectErrors.join("; ")}.`
            : `Repository "${repository.name}" cloned successfully into sandbox. Working directory: /home/user/${repository.name}`,
      };
    } catch (error) {
      console.error("[clone-repository error]", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to clone repository. Please try again.",
      );
    }
  },
});
