// ─── SDK event types ──────────────────────────────────────────────────────────

export type EventType = "launch" | "milestone" | "new_version" | "new_review";
export type Platform = "twitter" | "reddit" | "whatsapp" | "telegram" | "linkedin" | "facebook";
export type Tone = "casual" | "professional";

export interface MilestonePayload {
  label: string; // e.g. "1000 downloads"
}

export interface VersionPayload {
  notes: string; // changelog text
  build?: string; // e.g. "2.0.0"
}

export interface ReviewPayload {
  text: string;
  rating: number; // 1–5
}

export type EventPayload =
  MilestonePayload | VersionPayload | ReviewPayload | Record<string, unknown>;

// ─── Database row shapes ──────────────────────────────────────────────────────

export interface AppRow {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface EventRow {
  id: string;
  app_id: string;
  type: EventType;
  payload: EventPayload;
  created_at: string;
}

export interface GeneratedPost {
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

export interface PlatformStatRow {
  app_id: string;
  platform: Platform;
  tone: Tone;
  times_shown: number;
  times_chosen: number;
}

// ─── LLM response shape ───────────────────────────────────────────────────────

export interface PostVariant {
  platform: Platform;
  tone: Tone;
  content: string;
  link_title?: string | null;
  /** Present once the Strategy Engine has scored the variant. */
  rank_score?: number;
}

export interface GroqResponse {
  posts: PostVariant[];
  reply_draft?: string; // only present for new_review events
}

// ─── API request/response bodies ─────────────────────────────────────────────

export interface TrackEventBody {
  appId: string;
  type: EventType;
  payload: EventPayload;
}

export interface CreateAppBody {
  name: string;
  description: string;
}

export interface MarkChosenBody {
  postId: string;
  appId: string;
  platform: Platform;
  tone: Tone;
}
