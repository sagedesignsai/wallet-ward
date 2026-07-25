import { z } from "zod"
import { SecretType } from "@/generated/prisma/client"

const secretTypeValues = [
  SecretType.password,
  SecretType.env_var,
  SecretType.ssh_keypair,
  SecretType.api_token,
  SecretType.certificate,
  SecretType.json,
  SecretType.file,
  SecretType.note,
] as const

export const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug")

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  slug: slugSchema.optional(),
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logo: z.string().max(500).nullable().optional(),
})

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
  organizationId: z.string().optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
})

export const createEnvironmentSchema = z.object({
  name: z.string().min(1).max(100),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
})

export const secretTypeSchema = z.enum(secretTypeValues)

export const createSecretSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[A-Za-z0-9._/-]+$/, "Secret name contains invalid characters"),
  value: z.string().min(1),
  description: z.string().max(1000).optional(),
  type: secretTypeSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const updateSecretMetaSchema = z.object({
  description: z.string().max(1000).nullable().optional(),
  type: secretTypeSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const putSecretValueSchema = z.object({
  value: z.string().min(1),
  contentType: z.string().max(100).optional(),
})

export const importSecretsSchema = z.object({
  format: z.enum(["json", "dotenv"]).default("json"),
  data: z.string().min(1),
  overwrite: z.boolean().default(false),
})

export const exportQuerySchema = z.object({
  format: z.enum(["json", "dotenv"]).default("json"),
})
