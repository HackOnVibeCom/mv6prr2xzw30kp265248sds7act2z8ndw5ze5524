import type { AppRow, EventType, EventPayload } from "./types";

/**
 * Builds the single structured Groq prompt that generates all platform/tone
 * variants in one LLM call using JSON mode.
 *
 * Source: plan.md §10.3 + §11
 */
export function buildGenerationPrompt(
  app: AppRow,
  eventType: EventType,
  payload: EventPayload,
): string {
  const isReview = eventType === "new_review";

  return `You are a marketing copywriter. Generate promotional social posts for a mobile app.

App name: ${app.name}
App description: ${app.description}
Event type: ${eventType}
Event details: ${JSON.stringify(payload)}

Generate exactly one post for each combination of platform and tone listed below.
Platforms: twitter, reddit, whatsapp, linkedin, telegram, facebook
Tones: casual, professional

Platform-specific rules:
- twitter: under 280 characters total; may include up to 2 relevant hashtags in the content string itself
- reddit: needs both a short "link_title" (under 100 chars) AND a longer "content" body suitable for a text post; do NOT include a link_title for other platforms
- whatsapp: warm and personal, written as if sent to a close friend; include the placeholder [LINK] somewhere natural
- telegram: brief and punchy, like a channel post; may include one emoji; include [LINK]
- linkedin: needs a "link_title" and a short professional "content" summary (2–3 sentences); this will be used as Open Graph metadata
- facebook: conversational, 1–2 short paragraphs, include [LINK]${
    isReview
      ? `

Additionally, because this is a new_review event, include a "reply_draft" field at the top level:
a warm, appreciative reply to the reviewer. Acknowledge their feedback specifically.
If the review rating is 3 or below, be extra empathetic and offer a follow-up path (e.g. "please reach out at support@[appname].app").`
      : ""
  }

Respond ONLY with valid JSON in exactly this shape, no extra commentary or markdown fences:
{${
    isReview
      ? `
  "reply_draft": "...",`
      : ""
  }
  "posts": [
    { "platform": "twitter", "tone": "casual", "content": "..." },
    { "platform": "twitter", "tone": "professional", "content": "..." },
    { "platform": "reddit", "tone": "casual", "content": "...", "link_title": "..." },
    { "platform": "reddit", "tone": "professional", "content": "...", "link_title": "..." },
    { "platform": "whatsapp", "tone": "casual", "content": "..." },
    { "platform": "whatsapp", "tone": "professional", "content": "..." },
    { "platform": "linkedin", "tone": "casual", "content": "...", "link_title": "..." },
    { "platform": "linkedin", "tone": "professional", "content": "...", "link_title": "..." },
    { "platform": "telegram", "tone": "casual", "content": "..." },
    { "platform": "telegram", "tone": "professional", "content": "..." },
    { "platform": "facebook", "tone": "casual", "content": "..." },
    { "platform": "facebook", "tone": "professional", "content": "..." }
  ]
}`;
}
