import { env } from "./env";

export interface LlmCompletionParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  model?: string;
}

export interface LlmConfig {
  provider: "agentrouter" | "groq" | "openai" | "none";
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
}

export function getLlmConfigs(): LlmConfig[] {
  const configs: LlmConfig[] = [];

  if (env.openAiApiKey) {
    configs.push({
      provider: "openai",
      apiKey: env.openAiApiKey,
      baseUrl: process.env.OPENAI_BASE_URL?.trim().replace(/\/$/, "") || "https://api.openai.com/v1",
      defaultModel: env.llmModel || "gpt-4o-mini",
    });
  }

  if (env.agentRouterApiKey) {
    configs.push({
      provider: "agentrouter",
      apiKey: env.agentRouterApiKey,
      baseUrl: env.agentRouterBaseUrl.replace(/\/$/, ""),
      defaultModel: env.llmModel || "gpt-4o-mini",
    });
  }

  if (env.groqApiKey) {
    configs.push({
      provider: "groq",
      apiKey: env.groqApiKey,
      baseUrl: "https://api.groq.com/openai/v1",
      defaultModel: env.llmModel || "llama-3.3-70b-versatile",
    });
  }

  return configs;
}

export function getLlmConfig(): LlmConfig | null {
  const configs = getLlmConfigs();
  return configs[0] ?? null;
}

/**
 * Executes a JSON completion request against OpenAI, AgentRouter, or Groq.
 * Automatically tries next provider if a provider returns an error (e.g. 401 or network failure).
 */
export async function generateLlmJsonCompletion<T>(params: LlmCompletionParams): Promise<T | null> {
  const configs = getLlmConfigs();
  if (configs.length === 0) {
    console.warn("⚠️  No LLM API keys set. Using fallback copy generator.");
    return null;
  }

  for (const config of configs) {
    const model = params.model || config.defaultModel;
    const endpoint = `${config.baseUrl}/chat/completions`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: params.temperature ?? 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ LLM API Error (${config.provider} / ${model}): ${response.status} ${response.statusText}\n${errorText}`);
        continue; // Try next configured provider
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        console.error(`❌ Empty response from LLM provider (${config.provider})`);
        continue;
      }

      // Clean JSON content (strip markdown backticks if present)
      const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      return JSON.parse(cleaned) as T;
    } catch (err) {
      console.error(`❌ Failed to call LLM provider (${config.provider}):`, err);
    }
  }

  return null;
}
