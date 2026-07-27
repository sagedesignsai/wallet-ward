import { Daytona } from "@daytona/sdk";

// ---------------------------------------------------------------------------
// Singleton Daytona client configured from env vars
// ---------------------------------------------------------------------------

export function getDaytonaClient() {
  const apiKey = process.env.DAYTONA_API_KEY;
  if (!apiKey) return null;

  return new Daytona({
    apiKey,
    apiUrl: process.env.DAYTONA_API_URL || "https://app.daytona.io/api",
    target: (process.env.DAYTONA_TARGET as "us" | "eu") || "us",
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SandboxInfo {
  id: string;
  name: string;
  state: string;
  cpu: number;
  memory: number;
  disk: number;
  createdAt: string;
  previewUrl?: string;
}

// ---------------------------------------------------------------------------
// Helpers — each returns null when DAYTONA_API_KEY is not configured
// ---------------------------------------------------------------------------

export function requireClient(): Daytona {
  const client = getDaytonaClient();
  if (!client) {
    throw new Error(
      "Daytona is not configured. Add DAYTONA_API_KEY to your environment variables.",
    );
  }
  return client;
}

export function extractSandboxInfo(s: Record<string, unknown>): SandboxInfo {
  return {
    id: String(s.id ?? ""),
    name: String(s.name ?? ""),
    state: String(s.state ?? "UNKNOWN"),
    cpu: Number(s.cpu ?? 0),
    memory: Number(s.memory ?? 0),
    disk: Number(s.disk ?? 0),
    createdAt: String(s.createdAt ?? ""),
    previewUrl: s.previewUrl ? String(s.previewUrl) : undefined,
  };
}
