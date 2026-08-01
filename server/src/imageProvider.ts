/**
 * Image generation provider.
 *
 * Groq has no image endpoint, so background artwork comes from a separate
 * service. Which one is chosen by `IMAGE_PROVIDER` in server/.env, so the
 * feature works with whichever key you already have — and degrades to a
 * generated gradient when you have none, rather than breaking the page.
 *
 * Adding a provider means adding one case to `generateImage`.
 */

import { env } from "./env";
import { IMAGE_NEGATIVE_PROMPT } from "./adPrompts";

export type ImageProviderName = "openai" | "gemini" | "stability" | "none";

export interface GeneratedImage {
  /** data: URI of the artwork, or null when no provider is configured. */
  dataUri: string | null;
  provider: ImageProviderName;
  /** Present when generation was attempted and failed. */
  error?: string;
}

const TIMEOUT_MS = 60_000;

async function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Image generation timed out after ${ms}ms`)), ms),
    ),
  ]);
}

/* ----------------------------------------------------------------- OpenAI */

async function generateOpenAI(prompt: string, size: string): Promise<string> {
  const res = await withTimeout(
    fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.imageApiKey}`,
      },
      body: JSON.stringify({
        model: env.imageModel || "gpt-image-1",
        prompt,
        size,
        n: 1,
      }),
    }),
  );

  if (!res.ok) {
    throw new Error(`OpenAI images ${res.status}: ${await res.text().catch(() => "")}`);
  }

  const json = (await res.json()) as {
    data?: { b64_json?: string; url?: string }[];
  };
  const first = json.data?.[0];

  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first?.url) return await fetchAsDataUri(first.url);
  throw new Error("OpenAI returned no image data");
}

/* ----------------------------------------------------------------- Gemini */

async function generateGemini(prompt: string): Promise<string> {
  const apiKey = env.imageApiKey ?? "";
  if (!apiKey) throw new Error("Gemini API key not configured in server/.env");

  // 1. Try Imagen 3 (Google's flagship image generation model)
  try {
    const res = await withTimeout(
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: "image/jpeg",
            },
          }),
        },
      ),
    );

    if (res.ok) {
      const json = (await res.json()) as {
        generatedImages?: Array<{ image?: { imageBytes?: string } }>;
      };
      const bytes = json.generatedImages?.[0]?.image?.imageBytes;
      if (bytes) {
        return `data:image/jpeg;base64,${bytes}`;
      }
    }
  } catch (err) {
    console.warn("[ad] Imagen 3 failed, trying Gemini 2.0 Flash:", err);
  }

  // 2. Fallback to Gemini 2.0 Flash
  const model = env.imageModel || "gemini-2.0-flash";
  const res = await withTimeout(
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate an image for: ${prompt}` }] }],
        }),
      },
    ),
  );

  if (!res.ok) {
    throw new Error(`Gemini images ${res.status}: ${await res.text().catch(() => "")}`);
  }

  const json = (await res.json()) as {
    candidates?: {
      content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] };
    }[];
  };

  for (const part of json.candidates?.[0]?.content?.parts ?? []) {
    const inline = part.inlineData;
    if (inline?.data) {
      return `data:${inline.mimeType ?? "image/png"};base64,${inline.data}`;
    }
  }
  throw new Error("Gemini returned no image data");
}

/* -------------------------------------------------------------- Stability */

async function generateStability(prompt: string, aspect: string): Promise<string> {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("negative_prompt", IMAGE_NEGATIVE_PROMPT);
  form.append("aspect_ratio", aspect);
  form.append("output_format", "png");

  const res = await withTimeout(
    fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.imageApiKey}`,
        Accept: "image/*",
      },
      body: form,
    }),
  );

  if (!res.ok) {
    throw new Error(`Stability ${res.status}: ${await res.text().catch(() => "")}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

/* ------------------------------------------------------------------ utils */

async function fetchAsDataUri(url: string): Promise<string> {
  const res = await withTimeout(fetch(url));
  if (!res.ok) throw new Error(`Failed to download generated image: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type") ?? "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

/** Maps pixel dimensions onto each provider's own size vocabulary. */
function sizeFor(provider: ImageProviderName, w: number, h: number) {
  const ratio = w / h;
  if (provider === "openai") {
    if (ratio > 1.2) return "1536x1024";
    if (ratio < 0.8) return "1024x1536";
    return "1024x1024";
  }
  // Stability uses aspect-ratio strings.
  if (ratio > 1.2) return "16:9";
  if (ratio < 0.8) return "9:16";
  return "1:1";
}

/**
 * Generates background artwork.
 *
 * Never throws: a failure returns `dataUri: null` with an error message, and
 * the client falls back to a palette gradient. A missing image key degrades
 * the ad's richness; it must not take the endpoint down.
 */
export async function generateImage(
  prompt: string,
  width: number,
  height: number,
): Promise<GeneratedImage> {
  const provider = env.imageProvider;

  if (provider === "none" || !env.imageApiKey) {
    return { dataUri: null, provider: "none" };
  }

  try {
    const size = sizeFor(provider, width, height);
    let dataUri: string;

    switch (provider) {
      case "openai":
        dataUri = await generateOpenAI(prompt, size);
        break;
      case "gemini":
        dataUri = await generateGemini(prompt);
        break;
      case "stability":
        dataUri = await generateStability(prompt, size);
        break;
      default:
        return { dataUri: null, provider: "none" };
    }

    return { dataUri, provider };
  } catch (err) {
    console.warn("[ad] image generation failed:", err);
    return {
      dataUri: null,
      provider,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
