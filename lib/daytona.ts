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

function requireClient(): Daytona {
  const client = getDaytonaClient();
  if (!client) {
    throw new Error(
      "Daytona is not configured. Add DAYTONA_API_KEY to your environment variables.",
    );
  }
  return client;
}

function extractSandboxInfo(s: Record<string, unknown>): SandboxInfo {
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

export async function createSandbox(
  name: string,
  language?: string,
  envVars?: Record<string, string>,
): Promise<SandboxInfo> {
  const client = requireClient();
  const sandbox = await client.create({
    name,
    language: (language as "javascript" | "python" | "typescript" | undefined) ?? "javascript",
    envVars,
  } as Parameters<typeof client.create>[0]);
  return extractSandboxInfo(sandbox as unknown as Record<string, unknown>);
}

export async function listSandboxes(): Promise<SandboxInfo[]> {
  const client = requireClient();
  const results: SandboxInfo[] = [];
  for await (const sandbox of client.list()) {
    results.push(extractSandboxInfo(sandbox as unknown as Record<string, unknown>));
  }
  return results;
}

export async function getSandbox(id: string): Promise<SandboxInfo> {
  const client = requireClient();
  const sandbox = await client.get(id);
  return extractSandboxInfo(sandbox as unknown as Record<string, unknown>);
}

export async function stopSandbox(id: string): Promise<void> {
  const client = requireClient();
  const sandbox = await client.get(id);
  await sandbox.stop();
}

export async function startSandbox(id: string): Promise<void> {
  const client = requireClient();
  const sandbox = await client.get(id);
  await sandbox.start();
}

export async function deleteSandbox(id: string): Promise<void> {
  const client = requireClient();
  const sandbox = await client.get(id);
  await sandbox.delete();
}

export async function getSandboxPreviewUrl(
  id: string,
  port: number = 3000,
): Promise<string> {
  const client = requireClient();
  const sandbox = await client.get(id);
  const link = await sandbox.getPreviewLink(port);
  return typeof link === "string" ? link : String(link);
}
