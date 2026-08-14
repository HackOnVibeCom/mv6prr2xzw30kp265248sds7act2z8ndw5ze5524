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

export function getLlmConfig(): LlmConfig | null {
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey && !openAiKey.includes("your_openai_key_here")) {
    return {
      provider: "openai",
      apiKey: openAiKey,
      baseUrl: process.env.OPENAI_BASE_URL?.trim().replace(/\/$/, "") || "https://api.openai.com/v1",
      defaultModel: env.llmModel || "gpt-4o-mini",
    };
  }

  if (env.agentRouterApiKey) {
    return {
      provider: "agentrouter",
      apiKey: env.agentRouterApiKey,
      baseUrl: env.agentRouterBaseUrl.replace(/\/$/, ""),
      defaultModel: env.llmModel || "gpt-4o-mini",
    };
  }

  if (env.groqApiKey) {
    return {
      provider: "groq",
      apiKey: env.groqApiKey,
      baseUrl: "https://api.groq.com/openai/v1",
      defaultModel: env.llmModel || "llama-3.3-70b-versatile",
    };
  }

  return null;
}

/**
 * Executes a JSON completion request against AgentRouter, Groq, or OpenAI.
 * Automatically parses JSON response and handles fallbacks gracefully.
 */
export async function generateLlmJsonCompletion<T>(params: LlmCompletionParams): Promise<T | null> {
  const config = getLlmConfig();
  if (!config) {
    console.warn("⚠️  No LLM API keys set (AGENTROUTER_API_KEY or GROQ_API_KEY). Using fallback copy generator.");
    return null;
  }

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
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error(`❌ Empty response from LLM provider (${config.provider})`);
      return null;
    }

    // Clean JSON content (strip markdown backticks if present)
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error(`❌ Failed to call LLM provider (${config.provider}):`, err);
    return null;
  }
}
