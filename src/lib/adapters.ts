/**
 * Translation layer between the backend's wire vocabulary and the dashboard's
 * display vocabulary.
 *
 *   wire:    "twitter"  "new_version"  { rank_score, link_title }
 *   display: "Twitter"  "New version"  { score, linkTitle }
 *
 * Keeping this in one file means adding a platform or event type touches
 * exactly one place.
 */

import type { ApiApp, ApiEventType, ApiPlatform, ApiPost, ApiTone } from "@/lib/apiTypes";
import type { App, EventType, Platform, Post, Tone } from "@/lib/mockData";

/* ------------------------------------------------------------- platform */

const PLATFORM_TO_DISPLAY: Record<ApiPlatform, Platform> = {
  twitter: "Twitter",
  reddit: "Reddit",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
};

const PLATFORM_TO_WIRE: Record<Platform, ApiPlatform> = {
  Twitter: "twitter",
  Reddit: "reddit",
  WhatsApp: "whatsapp",
  Telegram: "telegram",
  LinkedIn: "linkedin",
  Facebook: "facebook",
};

export const toDisplayPlatform = (p: ApiPlatform): Platform => PLATFORM_TO_DISPLAY[p] ?? "Twitter";

export const toWirePlatform = (p: Platform): ApiPlatform => PLATFORM_TO_WIRE[p];

/* ----------------------------------------------------------- event type */

const EVENT_TO_DISPLAY: Record<ApiEventType, EventType> = {
  launch: "Launch",
  milestone: "Milestone",
  new_version: "New version",
  new_review: "New review",
};

const EVENT_TO_WIRE: Record<EventType, ApiEventType> = {
  Launch: "launch",
  Milestone: "milestone",
  "New version": "new_version",
  "New review": "new_review",
};

export const toDisplayEvent = (e: ApiEventType): EventType => EVENT_TO_DISPLAY[e] ?? "Launch";

export const toWireEvent = (e: EventType): ApiEventType => EVENT_TO_WIRE[e];

/* ------------------------------------------------------------------ tone */

/**
 * The backend constrains tone to casual|professional (the DB has a CHECK
 * constraint). The UI additionally displays "hype" and "technical" for seed
 * data, so widen on the way in and narrow on the way out.
 */
export const toDisplayTone = (t: ApiTone): Tone => t;

export function toWireTone(t: Tone): ApiTone {
  if (t === "casual" || t === "professional") return t;
  // hype reads as an amplified casual; technical as an amplified professional.
  return t === "hype" ? "casual" : "professional";
}

/* ------------------------------------------------------------------ post */

/** Pulls trailing #hashtags out of the body so the UI can style them separately. */
export function extractHashtags(content: string): {
  body: string;
  hashtags: string[];
} {
  const matches = content.match(/#[\w]+/g) ?? [];
  if (matches.length === 0) return { body: content, hashtags: [] };

  // Only strip hashtags that sit at the very end — inline ones are part of the
  // sentence and removing them would mangle the copy.
  const trailing = content.match(/(\s*#[\w]+)+\s*$/);
  if (!trailing) return { body: content, hashtags: [] };

  return {
    body: content.slice(0, trailing.index).trim(),
    hashtags: trailing[0].trim().split(/\s+/),
  };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** Wire post → display post. */
export function toDisplayPost(post: ApiPost, event?: ApiEventType): Post {
  const { body, hashtags } = extractHashtags(post.content);

  return {
    id: post.id,
    appId: post.app_id,
    platform: toDisplayPlatform(post.platform),
    tone: toDisplayTone(post.tone),
    event: toDisplayEvent(event ?? "launch"),
    content: body,
    score: post.rank_score,
    hashtags,
    createdAt: formatTime(post.created_at),
    // Live-only fields the seed data doesn't carry.
    eventId: post.event_id,
    linkTitle: post.link_title,
    chosen: post.chosen,
  };
}

/* ------------------------------------------------------------------- app */

/**
 * Wire app → display app.
 *
 * The backend's `apps` table intentionally stores only id/name/description
 * (plan §8). Everything else the dashboard shows — installs, ratings, SDK
 * version — is presentation metadata, so it gets sensible derived defaults
 * rather than being faked as real telemetry.
 */
/**
 * Pulls a short tagline out of a description.
 *
 * Returns "" when the description is already a single short sentence —
 * otherwise the card renders the identical string twice, once as the tagline
 * and once as the body.
 */
function deriveTagline(description: string): string {
  const first = description.split(/[.!?]/)[0]?.trim() ?? "";
  if (!first) return "";
  const rest = description.slice(first.length).replace(/^[.!?\s]+/, "");
  // A "tagline" that is the whole description isn't a tagline.
  return rest.length > 0 && first.length <= 60 ? first : "";
}

export function toDisplayApp(app: ApiApp, counts?: { generated: number; published: number }): App {
  return {
    id: app.id,
    name: app.name,
    // Only derive a tagline when the first sentence is genuinely shorter than
    // the description — otherwise the card renders the same line twice.
    tagline: deriveTagline(app.description),
    description: app.description,
    url: "",
    status: "active",
    sdkVersion: "0.4.1",
    platform: "Connected via SDK",
    apiKey: `ap_live_${app.id.replace(/-/g, "").slice(0, 12)}`,
    installs: 0,
    rating: 0,
    postsGenerated: counts?.generated ?? 0,
    postsPublished: counts?.published ?? 0,
    connectedAt: new Date(app.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
}
