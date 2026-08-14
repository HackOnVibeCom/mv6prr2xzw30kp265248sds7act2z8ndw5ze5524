/**
 * Wire types — the exact row shapes the backend returns.
 *
 * These use the backend's lowercase vocabulary ("twitter", "new_version").
 * The dashboard renders capitalised display types ("Twitter", "New version"),
 * so everything crossing this boundary goes through `adapters.ts`.
 */

export type ApiEventType = "launch" | "milestone" | "new_version" | "new_review";

export type ApiPlatform = "twitter" | "reddit" | "whatsapp" | "telegram" | "linkedin" | "facebook";

export type ApiTone = "casual" | "professional";

export interface ApiApp {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface ApiEvent {
  id: string;
  app_id: string;
  type: ApiEventType;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ApiPost {
  id: string;
  event_id: string;
  app_id: string;
  platform: ApiPlatform;
  tone: ApiTone;
  content: string;
  link_title: string | null;
  rank_score: number;
  chosen: boolean;
  created_at: string;
}

export interface ApiPlatformStat {
  app_id: string;
  platform: ApiPlatform;
  tone: ApiTone;
  times_shown: number;
  times_chosen: number;
}
