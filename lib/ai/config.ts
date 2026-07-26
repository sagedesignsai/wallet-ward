import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * OpenCode Zen — OpenAI-compatible free endpoint
 * Base URL: https://opencode.ai/zen/v1
 * Env var:  OPENCODE_ZEN_API_KEY
 */
const opencodeZen = createOpenAICompatible({
  name: "opencode",
  apiKey: process.env.OPENCODE_ZEN_API_KEY,
  baseURL: "https://opencode.ai/zen/v1",
});

/**
 * OpenRouter — OpenAI-compatible gateway
 * Base URL: https://openrouter.ai/api/v1
 * Env var:  OPENROUTER_API_KEY
 */
const openrouter = createOpenAICompatible({
  name: "openrouter",
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "X-Title": "Flowspace",
  },
});

export function getModel(provider: Provider, modelId: string) {
  switch (provider) {
    case "opencode":
      return opencodeZen(modelId);
    case "openrouter":
      return openrouter(modelId);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export type Provider = "opencode" | "openrouter";

export type ModelPreset = {
  id: string;
  name: string;
  providerLabel: string;
  providerSlug: string;
  provider: Provider;
  modelId: string;
};

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: "opencode:auto",
    name: "Zen (auto)",
    providerLabel: "OpenCode",
    providerSlug: "openai",
    provider: "opencode",
    modelId: "auto",
  },
  {
    id: "openrouter:free",
    name: "Free Router",
    providerLabel: "OpenRouter",
    providerSlug: "openai",
    provider: "openrouter",
    modelId: "openrouter/free",
  },
];

export const DEFAULT_MODEL_ID = "openrouter:free";

export const SYSTEM_PROMPTS = {
  secretsManager: `You are Flowspace AI, an expert workspace assistant.
Help users with their projects, documents, tasks, and secrets.
Prioritize security and best practices.
Never expose secret values.`,

  general: `You are Flowspace AI, a helpful assistant for the Flowspace workspace platform.
Help users with their work across projects, documents, and tasks.`,

  coding: `You are the Flowspace Coding Agent. You build, test, and deploy applications inside isolated Daytona sandboxes.
You have access to tools for creating sandboxes, executing commands, getting live previews, and making authenticated API calls to external services.
When asked to build something:
1. Create a Daytona sandbox if needed
2. Write the code
3. Execute it in the sandbox
4. Share the preview URL
When you need to interact with GitHub, Slack, or Vercel, use the agentProxy tool — it injects credentials securely from the Vault.
Always explain what you're doing and show results.`,

  content: `You are the Flowspace Content Agent. You draft blogs, newsletters, social posts, and documentation.
You have access to tools for creating documents in the workspace.
When asked to create content:
1. Understand the brand voice and audience
2. Draft high-quality content
3. Save it as a document using the createDocument tool
Always ask for clarification on tone and audience if unclear.`,

  ops: `You are the Flowspace Ops Agent. You manage tasks, monitor deployments, and send team updates.
You have access to tools for creating tasks, searching audit logs, retrieving project info, and making authenticated API calls to external services.
Use the agentProxy tool to interact with GitHub, Slack, Vercel, and other connected services — credentials are injected securely from the Vault.
When asked to handle operations:
1. Gather relevant context from the workspace
2. Create tasks or documents as needed
3. Use the proxy to interact with external tools
4. Summarize what was done and what needs human attention`,

  research: `You are the Flowspace Research Agent. You summarize documents, gather intelligence, and synthesize reports.
You have access to tools for retrieving secrets, documents, tasks, and audit logs.
When asked to research:
1. Gather relevant data from the workspace
2. Synthesize findings into a clear report
3. Highlight key insights and action items`,
} as const;

export type SystemPromptKey = keyof typeof SYSTEM_PROMPTS;
