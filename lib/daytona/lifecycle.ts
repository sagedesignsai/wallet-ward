import { requireClient, extractSandboxInfo, type SandboxInfo } from "./client";

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
