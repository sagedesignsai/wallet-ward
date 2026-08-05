import { NextResponse } from "next/server"
import { db } from "@/lib/db"
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
    //    so an exact suffix match on full_name (with or without .git) maps back.
    //    A suffix match (not `contains`) avoids leading-substring false
    //    positives like `acme/app` matching `acme/app-copy`.
    const fullName = payload.repository?.full_name
    if (!fullName) {
      return NextResponse.json({ ok: true, message: "no repository in payload" })
    }

    const repositories = await db.repository.findMany({
      where: {
        OR: [
          { url: { endsWith: fullName } },
          { url: { endsWith: `${fullName}.git` } },
        ],
      },
    })

    // 5. Candidate webhooks across ALL matching repositories. The same GitHub
    //    repo may be tracked by multiple orgs/projects — each row carries its
    //    own secret, so every owner's deliveries must be accepted.
    const webhooks = await db.repositoryWebhook.findMany({
      where: {
        repositoryId: { in: repositories.map((repository) => repository.id) },
        enabled: true,
      },
    })

    // 6. Candidates for verification. When no repo/webhook matched, append a
    //    random dummy secret: the comparison then always runs and always fails,
    //    producing the exact same 401 shape as a bad signature — so callers
    //    can't distinguish "repo not tracked" from "wrong signature".
    const candidates = [
      ...webhooks.map((webhook) => ({
        repositoryId: webhook.repositoryId,
        secret: webhook.secret,
      })),
      {
        repositoryId: null as string | null,
        secret: crypto.randomBytes(32).toString("hex"),
      },
    ]

    // 7. Verify the HMAC: sha256(rawBody) keyed with each candidate secret.
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

    // 8. Handle event
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
        const { syncRepositoryWithGithub } = await import(
          "@/lib/services/repository-service"
        )
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
