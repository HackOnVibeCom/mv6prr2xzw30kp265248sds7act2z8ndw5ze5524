/**
 * Environment loading and validation.
 *
 * Every secret the backend needs is read here, once, at boot. A missing or
 * placeholder value fails immediately with a message that says exactly which
 * variable is wrong and where to get it — rather than surfacing as a confusing
 * 500 from Supabase or Groq on the first request.
 *
 * SECURITY: everything in this file is server-only. None of it may ever be
 * imported by the dashboard or sent to a browser.
 */

import "dotenv/config";

/** Values copied straight from .env.example — present but not filled in. */
const PLACEHOLDERS = [
  "your_groq_key_here",
  "your_anon_key_here",
  "your_service_role_key_here",
  "https://your-project.supabase.co",
  "https://discord.com/api/webhooks/xxxx/yyyy",
];

interface VarSpec {
  name: string;
  required: boolean;
  where: string;
  /** Extra shape check beyond "is non-empty". */
  validate?: (v: string) => string | null;
}

const SPECS: VarSpec[] = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    where: "Supabase dashboard → Settings → API → Project URL",
    validate: (v) =>
      /^https:\/\/.+\.supabase\.(co|in)$/.test(v)
        ? null
        : "should look like https://<project-ref>.supabase.co",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    where: "Supabase dashboard → Settings → API → service_role secret",
    validate: (v) => (v.length > 40 ? null : "looks too short to be a service-role key"),
  },
  {
    name: "OPENAI_API_KEY",
    required: false,
    where: "platform.openai.com → API Keys",
    validate: (v) => (v.startsWith("sk-") ? null : "OpenAI keys start with 'sk-'"),
  },
  {
    name: "GROQ_API_KEY",
    required: false,
    where: "console.groq.com → API Keys",
    validate: (v) => (v.startsWith("gsk_") ? null : "Groq keys start with 'gsk_'"),
  },
  {
    name: "AGENTROUTER_API_KEY",
    required: false,
    where: "agentrouter.org/console/topup → API Keys",
  },
  {
    name: "DISCORD_WEBHOOK_URL",
    required: false,
    where: "Discord → channel settings → Integrations → Webhooks",
    validate: (v) =>
      v.startsWith("https://discord.com/api/webhooks/") ||
      v.startsWith("https://discordapp.com/api/webhooks/")
        ? null
        : "should start with https://discord.com/api/webhooks/",
  },
];

export type ImageProviderName = "openai" | "gemini" | "stability" | "none";

const IMAGE_PROVIDERS: ImageProviderName[] = ["openai", "gemini", "stability", "none"];

export interface Env {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  openAiApiKey: string | null;
  groqApiKey: string | null;
  agentRouterApiKey: string | null;
  agentRouterBaseUrl: string;
  llmModel: string | null;
  discordWebhookUrl: string | null;
  port: number;
  frontendUrl: string;
  /** Extra origins allowed through CORS, comma-separated in ALLOWED_ORIGINS. */
  allowedOrigins: string[];
  isProduction: boolean;
  /**
   * Which service generates advertisement artwork. "none" disables image
   * generation — ads still render, using a palette gradient background.
   */
  imageProvider: ImageProviderName;
  imageApiKey: string | null;
  /** Optional model override for the chosen image provider. */
  imageModel: string | null;
}

function read(name: string): string | null {
  const raw = process.env[name];
  if (!raw) return null;
  const value = raw.trim();
  if (!value || PLACEHOLDERS.includes(value)) return null;
  return value;
}

/**
 * Validates the environment and returns it typed.
 * Throws a single aggregated, human-readable error listing every problem.
 */
export function loadEnv(): Env {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const spec of SPECS) {
    const value = read(spec.name);

    if (!value) {
      const msg = `  ${spec.name} — missing or still set to the placeholder\n      get it from: ${spec.where}`;
      if (spec.required) errors.push(msg);
      else
        warnings.push(
          `  ${spec.name} not set — ${spec.name === "DISCORD_WEBHOOK_URL" ? "Discord auto-post disabled" : "optional feature disabled"}`,
        );
      continue;
    }

    const problem = spec.validate?.(value);
    if (problem) {
      const msg = `  ${spec.name} — ${problem}\n      get it from: ${spec.where}`;
      if (spec.required) errors.push(msg);
      else warnings.push(msg);
    }
  }

  const openAiApiKey = read("OPENAI_API_KEY");
  const groqApiKey = read("GROQ_API_KEY");
  const agentRouterApiKey = read("AGENTROUTER_API_KEY");

  if (!openAiApiKey && !groqApiKey && !agentRouterApiKey) {
    warnings.push(
      "Neither OPENAI_API_KEY, AGENTROUTER_API_KEY nor GROQ_API_KEY is set in server/.env — text post generation will use rich fallback copy generation.",
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `\n\n❌ AutoPromo server can't start — ${errors.length} environment problem${
        errors.length === 1 ? "" : "s"
      }:\n\n${errors.join("\n\n")}\n\n` +
        `Fix: copy server/.env.example to server/.env and fill in the values above.\n` +
        `     cd server && cp .env.example .env\n`,
    );
  }

  for (const w of warnings) console.warn(`⚠️  ${w}`);

  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a valid port number, got "${process.env.PORT}"`);
  }

  const frontendUrl = process.env.FRONTEND_URL?.trim() || "http://localhost:8080";

  // Image generation is optional. Supports GEMINI_API_KEY or IMAGE_API_KEY in server/.env.
  const imageApiKey = read("IMAGE_API_KEY") || read("GEMINI_API_KEY") || read("OPENAI_API_KEY");
  let rawProvider = (process.env.IMAGE_PROVIDER ?? "").trim().toLowerCase();
  
  if (!rawProvider && imageApiKey) {
    rawProvider = "gemini";
  } else if (!rawProvider) {
    rawProvider = "none";
  }

  let imageProvider = IMAGE_PROVIDERS.includes(rawProvider as ImageProviderName)
    ? (rawProvider as ImageProviderName)
    : "none";

  if (!IMAGE_PROVIDERS.includes(rawProvider as ImageProviderName)) {
    console.warn(
      `⚠️    IMAGE_PROVIDER "${rawProvider}" is not recognised — expected one of ${IMAGE_PROVIDERS.join(", ")}. Image generation disabled.`,
    );
  }

  if (imageProvider !== "none" && !imageApiKey) {
    console.warn(
      `⚠️    IMAGE_PROVIDER is "${imageProvider}" but IMAGE_API_KEY or GEMINI_API_KEY is not set in server/.env — ads will use styled canvas layouts.`,
    );
    imageProvider = "none";
  }

  return {
    supabaseUrl: read("NEXT_PUBLIC_SUPABASE_URL")!,
    supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY")!,
    openAiApiKey,
    groqApiKey,
    agentRouterApiKey,
    agentRouterBaseUrl: read("AGENTROUTER_BASE_URL") || "https://agentrouter.org/v1",
    llmModel: read("LLM_MODEL") || read("AGENTROUTER_MODEL"),
    discordWebhookUrl: read("DISCORD_WEBHOOK_URL"),
    port,
    frontendUrl,
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    isProduction: process.env.NODE_ENV === "production",
    imageProvider,
    imageApiKey,
    imageModel: read("IMAGE_MODEL"),
  };
}

/** Validated environment, loaded once at import time. */
export const env: Env = loadEnv();

/** Safe-to-log summary. Never prints secret values. */
export function describeEnv(e: Env): string {
  const mask = (v: string | null) => (v ? `${v.slice(0, 6)}${"•".repeat(6)} (${v.length} chars)` : "not set");
  const llmProvider = e.openAiApiKey
    ? `OpenAI (${e.llmModel || "gpt-4o-mini"})`
    : e.agentRouterApiKey
    ? `AgentRouter (${e.llmModel || "default model"})`
    : e.groqApiKey
    ? `Groq (${e.llmModel || "llama-3.3-70b-versatile"})`
    : "fallback copy generator";

  return [
    `  Supabase URL:  ${e.supabaseUrl}`,
    `  Service key:   ${mask(e.supabaseServiceRoleKey)}`,
    `  LLM Provider:  ${llmProvider}`,
    `  OpenAI key:    ${mask(e.openAiApiKey)}`,
    `  AgentRouter:   ${mask(e.agentRouterApiKey)}`,
    `  Groq key:      ${mask(e.groqApiKey)}`,
    `  Discord:       ${e.discordWebhookUrl ? "configured" : "not configured (optional)"}`,
    `  Ad images:     ${
      e.imageProvider === "none"
        ? "disabled — ads use gradient backgrounds"
        : `${e.imageProvider}${e.imageModel ? ` (${e.imageModel})` : ""}`
    }`,
    `  Frontend URL:  ${e.frontendUrl}`,
  ].join("\n");
}
