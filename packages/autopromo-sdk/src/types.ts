/**
 * Public types for the AutoPromo SDK.
 * Kept structurally identical to the backend's `server/src/types.ts` so the
 * wire format never drifts between the two.
 */

export type EventType = "launch" | "milestone" | "new_version" | "new_review";

export type Platform = "twitter" | "reddit" | "whatsapp" | "telegram" | "linkedin" | "facebook";

export type Tone = "casual" | "professional";

export interface AutoPromoConfig {
  /** UUID of the app record created via POST /api/apps. */
  appId: string;
  /** Base URL of the AutoPromo API, e.g. "https://autopromo.vercel.app/api". */
  apiUrl: string;
  /** Display name of the host app. Used only for logging. */
  appName?: string;
  /** Canonical URL shared alongside generated posts. */
  appUrl?: string;
  /**
   * When true, network failures throw instead of being swallowed.
   * Leave false in production so a hiccup never crashes the host app.
   */
  strict?: boolean;
  /** Emit verbose console logs. */
  debug?: boolean;
}

export interface MilestonePayload {
  /** Human-readable milestone, e.g. "1000 downloads". */
  label: string;
  count?: number;
}

export interface VersionPayload {
  /** Changelog text. */
  notes: string;
  build?: string;
}

export interface ReviewPayload {
  text: string;
  /** 1–5 */
  rating: number;
}

export interface LaunchPayload {
  stores?: string[];
}

export type EventPayload =
  MilestonePayload | VersionPayload | ReviewPayload | LaunchPayload | Record<string, unknown>;

/** A single AI-generated, strategy-engine-ranked post variant. */
export interface RankedPost {
  id: string;
  event_id: string;
  app_id: string;
  platform: Platform;
  tone: Tone;
  content: string;
  link_title: string | null;
  rank_score: number;
  chosen: boolean;
  created_at: string;
}

export interface TrackResult {
  ok: boolean;
  eventId?: string;
  generated?: number;
  /** Present only for `new_review` events. */
  replyDraft?: string;
  error?: string;
}

export interface GetPostsOptions {
  platform?: Platform;
  tone?: Tone;
  eventId?: string;
  limit?: number;
}
