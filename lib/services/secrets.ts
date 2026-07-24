import type { Prisma, SecretType } from "@/generated/prisma/client"
import { decryptString, encryptString } from "@/lib/crypto"
import { prisma } from "@/lib/db"
import { conflict, notFound } from "@/lib/api/errors"
import type { AuthContext } from "@/lib/api/auth"
import { writeAuditLog } from "@/lib/services/audit"
import { getOrganizationDek } from "@/lib/services/encryption-keys"

export function toSecretDto(
  secret: {
    id: string
    projectId: string
    environmentId: string
    name: string
    description: string | null
    type: SecretType
    metadata: Prisma.JsonValue | null
    currentVersion: number
    createdAt: Date
    updatedAt: Date
  }
) {
  return {
    id: secret.id,
    projectId: secret.projectId,
    environmentId: secret.environmentId,
    name: secret.name,
    description: secret.description,
    type: secret.type,
    metadata: secret.metadata,
    currentVersion: secret.currentVersion,
    createdAt: secret.createdAt.toISOString(),
    updatedAt: secret.updatedAt.toISOString(),
  }
}

export async function getProjectInOrg(projectId: string, organizationId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
  })
  if (!project) throw notFound("Project not found")
  return project
}

export async function getEnvironmentInProject(
  environmentId: string,
  projectId: string
) {
  const environment = await prisma.environment.findFirst({
    where: { id: environmentId, projectId },
  })
  if (!environment) throw notFound("Environment not found")
  return environment
}

export async function createSecret(input: {
  ctx: AuthContext
  organizationId: string
  projectId: string
  environmentId: string
  name: string
  value: string
  description?: string
  type?: SecretType
  metadata?: Record<string, unknown>
}) {
  const {
    ctx,
    organizationId,
    projectId,
    environmentId,
    name,
    value,
    description,
    type,
    metadata,
  } = input

  await getProjectInOrg(projectId, organizationId)
  await getEnvironmentInProject(environmentId, projectId)

  const existing = await prisma.secret.findUnique({
    where: {
      environmentId_name: { environmentId, name },
    },
  })
  if (existing) throw conflict(`Secret already exists: ${name}`)

  const dek = await getOrganizationDek(organizationId)
  const encrypted = encryptString(value, dek)

  const secret = await prisma.$transaction(async (tx) => {
    const created = await tx.secret.create({
      data: {
        projectId,
        environmentId,
        name,
        description,
        type: type ?? "env_var",
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        currentVersion: 1,
      },
    })

    await tx.secretVersion.create({
      data: {
        secretId: created.id,
        version: 1,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        algorithm: encrypted.algorithm,
        keyVersion: 1,
        createdById: ctx.actorType === "user" ? ctx.userId : null,
      },
    })

    return created
  })

  await writeAuditLog({
    ctx,
    organizationId,
    action: "secret_create",
    resourceType: "secret",
    resourceId: secret.id,
    metadata: { name: secret.name, environmentId, projectId },
  })

  return toSecretDto(secret)
}

export async function listSecrets(environmentId: string) {
  const secrets = await prisma.secret.findMany({
    where: { environmentId },
    orderBy: { name: "asc" },
  })
  return secrets.map(toSecretDto)
}

export async function getSecretOrThrow(secretId: string, organizationId: string) {
  const secret = await prisma.secret.findFirst({
    where: {
      id: secretId,
      project: { organizationId },
    },
    include: {
      project: true,
      environment: true,
    },
  })
  if (!secret) throw notFound("Secret not found")
  return secret
}

export async function revealSecretValue(input: {
  ctx: AuthContext
  organizationId: string
  secretId: string
  version?: number
}) {
  const secret = await getSecretOrThrow(input.secretId, input.organizationId)
  const versionNumber = input.version ?? secret.currentVersion

  const version = await prisma.secretVersion.findUnique({
    where: {
      secretId_version: {
        secretId: secret.id,
        version: versionNumber,
      },
    },
  })
  if (!version) throw notFound("Secret version not found")

  const dek = await getOrganizationDek(input.organizationId)
  const value = decryptString(
    {
      ciphertext: version.ciphertext,
      iv: version.iv,
      authTag: version.authTag,
      algorithm: "aes-256-gcm",
    },
    dek
  )

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.organizationId,
    action: "secret_reveal",
    resourceType: "secret",
    resourceId: secret.id,
    metadata: {
      name: secret.name,
      version: versionNumber,
    },
  })

  return {
    secret: toSecretDto(secret),
    version: versionNumber,
    value,
  }
}

export async function putSecretValue(input: {
  ctx: AuthContext
  organizationId: string
  secretId: string
  value: string
  contentType?: string
}) {
  const secret = await getSecretOrThrow(input.secretId, input.organizationId)
  const dek = await getOrganizationDek(input.organizationId)
  const encrypted = encryptString(input.value, dek)
  const nextVersion = secret.currentVersion + 1

  const updated = await prisma.$transaction(async (tx) => {
    await tx.secretVersion.create({
      data: {
        secretId: secret.id,
        version: nextVersion,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        algorithm: encrypted.algorithm,
        keyVersion: 1,
        contentType: input.contentType,
        createdById: input.ctx.actorType === "user" ? input.ctx.userId : null,
      },
    })

    return tx.secret.update({
      where: { id: secret.id },
      data: { currentVersion: nextVersion },
    })
  })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.organizationId,
    action: "secret_version_create",
    resourceType: "secret",
    resourceId: secret.id,
    metadata: { name: secret.name, version: nextVersion },
  })

  return toSecretDto(updated)
}

export async function deleteSecret(input: {
  ctx: AuthContext
  organizationId: string
  secretId: string
}) {
  const secret = await getSecretOrThrow(input.secretId, input.organizationId)
  await prisma.secret.delete({ where: { id: secret.id } })

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.organizationId,
    action: "secret_delete",
    resourceType: "secret",
    resourceId: secret.id,
    metadata: { name: secret.name },
  })
}

export async function listSecretVersions(secretId: string, organizationId: string) {
  await getSecretOrThrow(secretId, organizationId)
  const versions = await prisma.secretVersion.findMany({
    where: { secretId },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      algorithm: true,
      keyVersion: true,
      contentType: true,
      createdById: true,
      createdAt: true,
    },
  })

  return versions.map((v) => ({
    id: v.id,
    version: v.version,
    algorithm: v.algorithm,
    keyVersion: v.keyVersion,
    contentType: v.contentType,
    createdById: v.createdById,
    createdAt: v.createdAt.toISOString(),
  }))
}

export async function exportSecrets(input: {
  ctx: AuthContext
  organizationId: string
  projectId: string
  environmentId: string
  format: "json" | "dotenv"
}) {
  await getProjectInOrg(input.projectId, input.organizationId)
  await getEnvironmentInProject(input.environmentId, input.projectId)

  const secrets = await prisma.secret.findMany({
    where: { environmentId: input.environmentId },
    include: {
      versions: {
        where: {
          // join current via app logic below
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const dek = await getOrganizationDek(input.organizationId)
  const pairs: Record<string, string> = {}

  for (const secret of secrets) {
    const version = await prisma.secretVersion.findUnique({
      where: {
        secretId_version: {
          secretId: secret.id,
          version: secret.currentVersion,
        },
      },
    })
    if (!version) continue
    pairs[secret.name] = decryptString(
      {
        ciphertext: version.ciphertext,
        iv: version.iv,
        authTag: version.authTag,
        algorithm: "aes-256-gcm",
      },
      dek
    )
  }

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.organizationId,
    action: "secret_export",
    resourceType: "environment",
    resourceId: input.environmentId,
    metadata: {
      projectId: input.projectId,
      format: input.format,
      count: Object.keys(pairs).length,
    },
  })

  if (input.format === "dotenv") {
    const body = Object.entries(pairs)
      .map(([k, v]) => {
        const escaped = v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
        const needsQuotes = /[\s#"'`]/.test(v)
        return needsQuotes ? `${k}="${escaped}"` : `${k}=${v}`
      })
      .join("\n")
    return { format: "dotenv" as const, body, count: Object.keys(pairs).length }
  }

  return { format: "json" as const, body: pairs, count: Object.keys(pairs).length }
}

export function parseDotenv(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    value = value.replace(/\\n/g, "\n").replace(/\\"/g, '"')
    result[key] = value
  }
  return result
}

export async function importSecrets(input: {
  ctx: AuthContext
  organizationId: string
  projectId: string
  environmentId: string
  format: "json" | "dotenv"
  data: string
  overwrite: boolean
}) {
  await getProjectInOrg(input.projectId, input.organizationId)
  await getEnvironmentInProject(input.environmentId, input.projectId)

  let pairs: Record<string, string> = {}
  if (input.format === "dotenv") {
    pairs = parseDotenv(input.data)
  } else {
    const parsed = JSON.parse(input.data) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("JSON import must be an object of key/value pairs")
    }
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v !== "string") {
        throw new Error(`Value for ${k} must be a string`)
      }
      pairs[k] = v
    }
  }

  let created = 0
  let updated = 0
  let skipped = 0

  for (const [name, value] of Object.entries(pairs)) {
    const existing = await prisma.secret.findUnique({
      where: {
        environmentId_name: {
          environmentId: input.environmentId,
          name,
        },
      },
    })

    if (!existing) {
      await createSecret({
        ctx: input.ctx,
        organizationId: input.organizationId,
        projectId: input.projectId,
        environmentId: input.environmentId,
        name,
        value,
        type: "env_var",
      })
      created += 1
      continue
    }

    if (!input.overwrite) {
      skipped += 1
      continue
    }

    await putSecretValue({
      ctx: input.ctx,
      organizationId: input.organizationId,
      secretId: existing.id,
      value,
    })
    updated += 1
  }

  await writeAuditLog({
    ctx: input.ctx,
    organizationId: input.organizationId,
    action: "secret_import",
    resourceType: "environment",
    resourceId: input.environmentId,
    metadata: {
      projectId: input.projectId,
      format: input.format,
      created,
      updated,
      skipped,
    },
  })

  return { created, updated, skipped, total: Object.keys(pairs).length }
}
