/**
 * Typed client for the AutoPromo backend (server/).
 *
 * The dashboard is live-first: every screen reads from these endpoints. When
 * the backend is unreachable, callers fall back to the seed data in
 * `mockData.ts` and the UI says so explicitly — see `dataSource.ts`.
 */

import type {
  ApiApp,
  ApiEvent,
  ApiPlatformStat,
  ApiPost,
  ApiEventType,
  ApiPlatform,
  ApiTone,
} from "@/lib/apiTypes";

/**
 * Base URL of the API. Configured at build time via VITE_API_URL, falling back
 * to the local Express server from `server/`.
 */
const rawApiUrl = (import.meta.env?.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "http://localhost:3001";
export const API_BASE_URL: string = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const DEFAULT_TIMEOUT_MS = 8_000;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let message = `${res.status} ${res.statusText}`;
      try {
        const parsed = JSON.parse(body) as { error?: string };
        if (parsed.error) message = parsed.error;
      } catch {
        if (body) message = body;
      }
      throw new ApiError(message, res.status);
    }

    const text = await res.text();
    return (text ? JSON.parse(text) : null) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("Request timed out", 408);
    }
    throw new ApiError(err instanceof Error ? err.message : "Network error");
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ health */

/** Cheap reachability probe used to decide live vs. fallback mode. */
export async function checkHealth(): Promise<boolean> {
  try {
    // /health sits at the server root, outside the /api prefix.
    const root = API_BASE_URL.replace(/\/api$/, "");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3_000);
    try {
      const res = await fetch(`${root}/health`, { signal: controller.signal });
      return res.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------- apps */

export function listApps(): Promise<ApiApp[]> {
  return request<ApiApp[]>("/apps");
}

export function getAppById(appId: string): Promise<ApiApp> {
  return request<ApiApp>(`/apps/${encodeURIComponent(appId)}`);
}

export function createApp(body: { name: string; description: string }): Promise<ApiApp> {
  return request<ApiApp>("/apps", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/* ------------------------------------------------------------------- posts */

export interface ListPostsParams {
  appId: string;
  platform?: ApiPlatform;
  tone?: ApiTone;
  eventId?: string;
  chosen?: boolean;
  limit?: number;
}

export function listPosts(params: ListPostsParams): Promise<ApiPost[]> {
  const q = new URLSearchParams({ appId: params.appId });
  if (params.platform) q.set("platform", params.platform);
  if (params.tone) q.set("tone", params.tone);
  if (params.eventId) q.set("eventId", params.eventId);
  if (params.chosen !== undefined) q.set("chosen", String(params.chosen));
  if (params.limit) q.set("limit", String(params.limit));

  return request<ApiPost[]>(`/posts?${q.toString()}`);
}

export function getPostById(postId: string): Promise<ApiPost> {
  return request<ApiPost>(`/posts/${encodeURIComponent(postId)}`);
}

/* ------------------------------------------------------------------ events */

export interface TrackEventResult {
  ok: boolean;
  eventId?: string;
  generated?: number;
  replyDraft?: string;
}

export function trackEvent(body: {
  appId: string;
  type: ApiEventType;
  payload: Record<string, unknown>;
}): Promise<TrackEventResult> {
  return request<TrackEventResult>("/event", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/* --------------------------------------------------------------------- ad */

export type AdFormatName = "square" | "landscape" | "story";

export interface AdBrief {
  headline: string;
  subhead: string;
  cta: string;
  badge?: string;
  vibe: string;
  rationale: string;
  imagery: string;
}

export interface AdPalette {
  art: string;
  palette: string;
  ink: { heading: string; body: string; accent: string; scrim: string };
  type: "playful" | "editorial" | "technical" | "bold";
}

export interface GenerateAdResult {
  ok: boolean;
  brief: AdBrief;
  palette: AdPalette;
  format: { name: AdFormatName; width: number; height: number };
  image: { dataUri: string | null; provider: string; error?: string };
  app: { name: string; description: string };
}

export function generateAd(body: {
  appId: string;
  input?: string;
  format?: AdFormatName;
  geminiApiKey?: string;
}): Promise<GenerateAdResult> {
  return request<GenerateAdResult>("/ad", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Direct browser client for Google Gemini image generation endpoint. */
export async function generateGeminiImageClient(
  prompt: string,
  apiKey: string,
  aspectRatio: "1:1" | "16:9" | "9:16" = "1:1"
): Promise<string> {
  // Try Imagen 3 first
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: "image/jpeg",
            aspectRatio: aspectRatio,
          },
        }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const bytes = data.generatedImages?.[0]?.image?.imageBytes;
      if (bytes) {
        return `data:image/jpeg;base64,${bytes}`;
      }
    }
  } catch {
    // Ignore & try next
  }

  // Fallback to Gemini 2.0/2.5 Flash generateContent
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate a high quality promo poster background for: ${prompt}` }] }],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API Error (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();
  for (const candidate of data.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("Gemini returned text response but no inline image data. Ensure your API key has image generation scope.");
}

/* ----------------------------------------------------------- integrations */

export interface IntegrationStatus {
  discord: { configured: boolean; routing: string };
  adImages: { provider: string; configured: boolean };
}

export function getIntegrations(): Promise<IntegrationStatus> {
  return request<IntegrationStatus>("/integrations");
}

export function testDiscord(): Promise<{ ok: boolean; message: string }> {
  return request<{ ok: boolean; message: string }>("/integrations/discord/test", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/* ------------------------------------------------------------- mark chosen */

export function markChosen(body: {
  postId: string;
  appId: string;
  platform: ApiPlatform;
  tone: ApiTone;
}): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/mark-chosen", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type { ApiApp, ApiEvent, ApiPlatformStat, ApiPost };
