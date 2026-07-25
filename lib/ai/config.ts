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
    "X-Title": "Nimbus",
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
  secretsManager: `You are Nimbus AI, an expert workspace assistant.
Help users with their projects, documents, tasks, and secrets.
Prioritize security and best practices.
Never expose secret values.`,

  general: `You are Nimbus AI, a helpful assistant for the Nimbus workspace platform.
Help users with their work across projects, documents, and tasks.`,
} as const;

export type SystemPromptKey = keyof typeof SYSTEM_PROMPTS;
