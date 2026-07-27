import { requireClient } from "./client";

export async function getSandboxPreviewUrl(
  id: string,
  port: number = 3000,
): Promise<string> {
  const client = requireClient();
  const sandbox = await client.get(id);
  const link = await sandbox.getPreviewLink(port);
  return typeof link === "string" ? link : String(link);
}

// ---------------------------------------------------------------------------
// Signed preview URLs — token embedded in URL, no header auth needed.
// Critical for iframe embedding where custom HTTP headers are not possible.
// ---------------------------------------------------------------------------

export async function getSignedPreviewUrl(
  id: string,
  port: number,
  expiresIn: number = 3600,
): Promise<{ url: string; token: string; port: number }> {
  const client = requireClient();
  const sandbox = await client.get(id);
  const result = await sandbox.getSignedPreviewUrl(port, expiresIn) as {
    url: string;
    token: string;
    port: number;
  };
  return result;
}

// ---------------------------------------------------------------------------
// Convenience wrappers for common signed-preview endpoints
// ---------------------------------------------------------------------------

export async function getWebTerminalUrl(
  id: string,
): Promise<{ url: string; token: string }> {
  const { url, token } = await getSignedPreviewUrl(id, 22222, 3600);
  return { url, token };
}

export async function getDesktopUrl(
  id: string,
): Promise<{ url: string; token: string }> {
  const { url, token } = await getSignedPreviewUrl(id, 6080, 3600);
  return { url, token };
}
