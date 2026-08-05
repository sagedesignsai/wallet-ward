import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { decryptString, type EncryptedPayload } from "@/lib/crypto"
import { getOrganizationDek } from "@/lib/services/encryption-keys"
import crypto from "crypto"

/**
 * POST /api/webhooks/github
 *
 * GitHub calls this endpoint for every registered repository webhook.
 * It is intentionally unauthenticated — authenticity is enforced via the
 * `X-Hub-Signature-256` HMAC signature computed over the exact raw body.
 *
 * This handler must never surface a 5xx to GitHub: GitHub retries failures
 * and may eventually disable the hook. Unknown repos/payloads are silently
 * accepted with 200, signature failures return 401.
 */
export async function POST(request: Request) {
  try {
    // 1. Raw body — the exact bytes are required for HMAC verification
    const rawBody = await request.text()

    // 2. GitHub delivery headers
    const eventType = request.headers.get("x-github-event")
    const signatureHeader = request.headers.get("x-hub-signature-256")

    // 3. Parse payload (never let a malformed body surface as a 5xx)
    let payload: {
      repository?: { full_name?: string }
    }
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ ok: false, message: "invalid payload" })
    }

    // 4. Map GitHub full_name (owner/repo) to local repository rows.
    //    repository.url stores the clone URL (https://github.com/owner/repo.git),
    //    so an exact canonical-form match maps back. A suffix fallback covers
    //    non-canonical hosts (GitHub Enterprise / custom).
    const fullName = payload.repository?.full_name
    if (!fullName) {
      return NextResponse.json({
        ok: true,
        message: "no repository in payload",
      })
    }

    // Validate before any DB query: full_name is attacker-controlled on this
    // unauthenticated endpoint, and `%`/`_` are LIKE metacharacters that would
    // turn the endsWith fallback below into a wildcard (cost amplification).
    // Invalid names get the SAME uniform 401 as a bad signature — no distinct
    // error body, no logging of the attacker-controlled value.
    const GITHUB_FULL_NAME_PATTERN = /^[A-Za-z0-9_.\-]+\/[A-Za-z0-9_.\-]+$/
    if (
      typeof fullName !== "string" ||
      fullName.length > 300 ||
      !GITHUB_FULL_NAME_PATTERN.test(fullName)
    ) {
      return NextResponse.json(
        { ok: false, message: "invalid signature" },
        { status: 401 }
      )
    }

    // 4a. Exact canonical-form lookup — exact `in:`, never LIKE, no wildcards.
    let repositories = await db.repository.findMany({
      where: {
        url: {
          in: [
            `https://github.com/${fullName}`,
            `https://github.com/${fullName}.git`,
            `https://github.com/${fullName}/`,
            `git@github.com:${fullName}`,
            `git@github.com:${fullName}.git`,
          ],
        },
      },
    })

    // 4b. Legacy-preserving fallback for non-canonical URLs (GitHub Enterprise /
    //     custom hosts). Safe because validation excludes `%` and the guard
    //     below also excludes `_` — with neither, endsWith has no LIKE
    //     metacharacters left to inject, so the pattern stays literal.
    if (repositories.length === 0 && !fullName.includes("_")) {
      const legacyMatches = await db.repository.findMany({
        where: { url: { endsWith: fullName } },
      })
      if (legacyMatches.length > 0) {
        const seen = new Set(repositories.map((repository) => repository.id))
        repositories = [
          ...repositories,
          ...legacyMatches.filter((repository) => !seen.has(repository.id)),
        ]
      }
    }

    // 5. Candidate webhooks across ALL matching repositories. The same GitHub
    //    repo may be tracked by multiple orgs/projects — each row carries its
    //    own secret, so every owner's deliveries must be accepted.
    const webhooks = await db.repositoryWebhook.findMany({
      where: {
        repositoryId: { in: repositories.map((repository) => repository.id) },
        enabled: true,
      },
    })

    // 6. Resolve each webhook's stored secret to plaintext before verifying.
    //    Secrets are persisted as encrypted envelopes keyed with the org DEK;
    //    legacy rows hold plaintext. Map repository → project → organization.
    const projects = await db.project.findMany({
      where: {
        id: { in: repositories.map((repository) => repository.projectId) },
      },
    })
    const organizationByProjectId = new Map<string, string>()
    for (const project of projects) {
      organizationByProjectId.set(project.id, project.organizationId)
    }
    const organizationByRepositoryId = new Map<string, string>()
    for (const repository of repositories) {
      const organizationId = organizationByProjectId.get(repository.projectId)
      if (organizationId) {
        organizationByRepositoryId.set(repository.id, organizationId)
      }
    }

    // Per-request DEK cache (getOrganizationDek also caches module-wide).
    const dekByOrganizationId = new Map<string, Buffer>()

    // 7. Candidates for verification. When no repo/webhook matched, append a
    //    random dummy secret: the comparison then always runs and always fails,
    //    producing the exact same 401 shape as a bad signature — so callers
    //    can't distinguish "repo not tracked" from "wrong signature".
    const candidates = [
      ...(await Promise.all(
        webhooks.map(async (webhook) => {
          const organizationId = organizationByRepositoryId.get(
            webhook.repositoryId
          )
          if (!organizationId) {
            return {
              repositoryId: webhook.repositoryId,
              secret: webhook.secret,
            }
          }
          let dek = dekByOrganizationId.get(organizationId)
          if (!dek) {
            dek = await getOrganizationDek(organizationId)
            dekByOrganizationId.set(organizationId, dek)
          }
          const payload = parseEncryptedSecret(webhook.secret)
          if (!payload) {
            // Legacy plaintext row — verify against the raw value
            return {
              repositoryId: webhook.repositoryId,
              secret: webhook.secret,
            }
          }
          try {
            return {
              repositoryId: webhook.repositoryId,
              secret: decryptString(payload, dek),
            }
          } catch {
            // Undecryptable value — treat as legacy plaintext
            return {
              repositoryId: webhook.repositoryId,
              secret: webhook.secret,
            }
          }
        })
      )),
      {
        repositoryId: null as string | null,
        secret: crypto.randomBytes(32).toString("hex"),
      },
    ]

    // 7a. Pad to a fixed candidate count so the verify loop's work is constant
    //     for small candidate sets — an unknown repo (1 dummy) must be
    //     indistinguishable by timing from a known repo (N real + 1 dummy).
    const MIN_CANDIDATES = 8
    while (candidates.length < MIN_CANDIDATES) {
      candidates.push({
        repositoryId: null as string | null,
        secret: crypto.randomBytes(32).toString("hex"),
      })
    }

    // 8. Verify the HMAC: sha256(rawBody) keyed with each candidate secret.
    //    A delivery is trusted if ANY enabled webhook produces a matching
    //    signature; the first match wins.
    const matchedRepositoryId = verifySignature(
      rawBody,
      signatureHeader,
      candidates
    )
    if (!matchedRepositoryId) {
      return NextResponse.json(
        { ok: false, message: "invalid signature" },
        { status: 401 }
      )
    }

    // 9. Handle event
    if (eventType === "ping") {
      return NextResponse.json({ ok: true, message: "pong" })
    }

    if (eventType === "push") {
      // Best-effort sync — never let errors surface to GitHub (it would retry).
      try {
        const repository = repositories.find(
          (repo) => repo.id === matchedRepositoryId
        )
        const project = await db.project.findUnique({
          where: { id: repository?.projectId ?? "" },
        })
        const { syncRepositoryWithGithub } =
          await import("@/lib/services/repository-service")
        await syncRepositoryWithGithub(
          matchedRepositoryId,
          project?.organizationId ?? ""
        )
      } catch (error) {
        console.error("Webhook push sync failed:", error)
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    // Never surface a 5xx to GitHub — it would retry and may disable the hook.
    console.error("GitHub webhook handler error:", error)
    return NextResponse.json({ ok: true })
  }
}

/**
 * Returns the id of the repository whose webhook secret produced a matching
 * HMAC, or null when the signature is missing/malformed or matches nothing.
 * Timing-safe: equal-length comparison via timingSafeEqual (length guarded).
 */
function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  candidates: { repositoryId: string | null; secret: string }[]
): string | null {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return null
  }
  const provided = Buffer.from(signatureHeader.slice("sha256=".length), "hex")
  for (const candidate of candidates) {
    const expected = crypto
      .createHmac("sha256", candidate.secret)
      .update(rawBody)
      .digest()
    // timingSafeEqual throws on length mismatch — guard first
    if (
      provided.length === expected.length &&
      crypto.timingSafeEqual(provided, expected)
    ) {
      return candidate.repositoryId
    }
  }
  return null
}

/**
 * Parse a stored webhook secret. New rows store an encrypted envelope JSON
 * string; legacy rows store the raw plaintext (whsec_...). Returns null when
 * the value is not an envelope.
 */
function parseEncryptedSecret(raw: string): EncryptedPayload | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (
      typeof parsed.ciphertext !== "string" ||
      typeof parsed.iv !== "string" ||
      typeof parsed.authTag !== "string" ||
      parsed.algorithm !== "aes-256-gcm"
    ) {
      return null
    }
    return {
      ciphertext: parsed.ciphertext,
      iv: parsed.iv,
      authTag: parsed.authTag,
      algorithm: "aes-256-gcm",
    }
  } catch {
    return null
  }
}
