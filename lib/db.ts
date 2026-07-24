import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { withAccelerate } from "@prisma/extension-accelerate"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pgPool: Pool | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not set")
  }

  // Prisma Accelerate connection string
  if (url.startsWith("prisma://") || url.startsWith("prisma+postgres://")) {
    const client = new PrismaClient({
      accelerateUrl: url,
    }).$extends(withAccelerate())
    // Cast: Accelerate extension changes the client type; app code uses base PrismaClient APIs.
    return client as unknown as PrismaClient
  }

  // Direct Postgres (local / Prisma Postgres / any hosted PG)
  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString: url,
      // Prisma Postgres / managed PG often need SSL
      ssl: url.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
    })

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool
  }

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export type DbClient = PrismaClient
