import { requireClient } from "./client";

// ---------------------------------------------------------------------------
// Computer use (VNC / desktop) lifecycle
// ---------------------------------------------------------------------------

export async function startComputerUse(
  id: string,
): Promise<{ message: string }> {
  const client = requireClient();
  const sandbox = await client.get(id);
  const result = await sandbox.computerUse.start() as { message: string };
  return result;
}

export async function stopComputerUse(
  id: string,
): Promise<{ message: string }> {
  const client = requireClient();
  const sandbox = await client.get(id);
  const result = await sandbox.computerUse.stop() as { message: string };
  return result;
}

export async function getComputerUseStatus(
  id: string,
): Promise<{ status: string; processes?: Record<string, string> }> {
  const client = requireClient();
  const sandbox = await client.get(id);
  const result = (await sandbox.computerUse.getStatus()) as {
    status: string;
    processes?: Record<string, string>;
  };
  return result;
}
