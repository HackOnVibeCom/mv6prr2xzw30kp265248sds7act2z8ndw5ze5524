/**
 * Advertisement generation — the hidden prompt layer.
 *
 * The user supplies only what they want to promote. Everything that decides
 * how the ad *looks* — palette, art direction, mood, typography weight, the
 * audience it should appeal to — is inferred here and never shown to them.
 *
 * Two stages, because they have different failure modes:
 *
 *   1. An LLM reads the app and returns a structured creative brief
 *      (headline, CTA, and a visual direction inferred from the product's
 *      category and audience).
 *   2. That brief is expanded into an image-model prompt for the *background
 *      artwork only*.
 *
 * Stage 2 deliberately asks for artwork with no text in it. Diffusion models
 * render lettering unreliably, and an advert whose headline is misspelled is
 * worthless. The real headline is composited over the artwork as vector text
 * by the client, so it is always sharp and always says what we intended.
 */

import type { AppRow, EventType } from "./types";

/** Aspect ratios an ad can be produced at. */
export type AdFormat = "square" | "landscape" | "story";

export const AD_FORMATS: Record<AdFormat, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: "Square · Instagram, LinkedIn" },
  landscape: { w: 1200, h: 630, label: "Landscape · Twitter, Facebook, OG" },
  story: { w: 1080, h: 1920, label: "Story · Instagram, TikTok" },
};

/**
 * Visual directions the model may choose from.
 *
 * A closed set rather than free text: it keeps output on-brand, makes results
 * reproducible, and gives the client a known palette to compose text against.
 * Each entry carries the contrast-safe ink colours for its own background.
 */
export interface VibeSpec {
  /** Art-direction language handed to the image model. */
  art: string;
  /** Palette description, also handed to the image model. */
  palette: string;
  /** Hex colours the client uses for the text overlay. */
  ink: { heading: string; body: string; accent: string; scrim: string };
  /** Typographic weight the overlay should use. */
  type: "playful" | "editorial" | "technical" | "bold";
}

export const VIBES: Record<string, VibeSpec> = {
  playful: {
    art: "soft rounded organic shapes, gentle bouncy composition, friendly and warm, illustrative, generous negative space, subtle paper grain",
    palette:
      "warm pastels — soft coral, buttery yellow, mint, sky blue on a cream base",
    ink: { heading: "#2d2438", body: "#4a3f57", accent: "#e8637c", scrim: "#fffaf2" },
    type: "playful",
  },
  calm: {
    art: "minimal serene composition, soft gradients, lots of breathing room, matte finish, understated",
    palette: "muted sage, warm sand, off-white, soft clay",
    ink: { heading: "#23302b", body: "#46564f", accent: "#4f8a6b", scrim: "#f6f4ee" },
    type: "editorial",
  },
  energetic: {
    art: "high-contrast dynamic composition, bold diagonal motion, punchy graphic shapes, confident and loud",
    palette: "electric orange, deep magenta, hot yellow on near-black",
    ink: { heading: "#ffffff", body: "#f0e6ea", accent: "#ff8a3d", scrim: "#160d14" },
    type: "bold",
  },
  premium: {
    art: "refined minimal composition, elegant restraint, subtle depth and soft shadow, luxurious materials, fine detail",
    palette: "deep charcoal, warm gold accent, ivory, muted bronze",
    ink: { heading: "#f7f3ea", body: "#d8d0c0", accent: "#c9a227", scrim: "#14120e" },
    type: "editorial",
  },
  technical: {
    art: "precise geometric composition, clean grid structure, schematic and engineered feel, crisp edges, data-inspired",
    palette: "deep indigo, cyan accent, slate grey, cool white",
    ink: { heading: "#eaf2ff", body: "#b9c6dd", accent: "#4dd0e1", scrim: "#0d1424" },
    type: "technical",
  },
  fresh: {
    art: "bright airy composition, natural light, crisp and clean, optimistic, light shadows",
    palette: "vivid green, sky blue, sunlit white, citrus accent",
    ink: { heading: "#12261a", body: "#38513f", accent: "#1f9d55", scrim: "#f3faf5" },
    type: "bold",
  },
};

export type VibeName = keyof typeof VIBES;

/** Structured creative brief returned by the LLM. */
export interface AdBrief {
  headline: string;
  subhead: string;
  cta: string;
  /** Short badge text, e.g. "New" or "1,000 users". */
  badge?: string;
  vibe: VibeName;
  /** One line explaining the visual choice — shown to the user for trust. */
  rationale: string;
  /** Subject matter for the background artwork. */
  imagery: string;
}

/**
 * Stage 1 — the hidden brief prompt.
 *
 * Asks the model to reason about audience and category first, because that is
 * what should drive the visual direction. A baby-products app and a trading
 * app must not come back with the same palette.
 */
export function buildAdBriefPrompt(
  app: AppRow,
  userInput: string,
  eventType?: EventType,
): string {
  return `You are a senior art director and copywriter at an advertising agency.

Produce a creative brief for a single promotional image for this mobile app.

App name: ${app.name}
App description: ${app.description}
${eventType ? `Occasion: ${eventType.replace("_", " ")}` : ""}
What the founder wants to promote: ${userInput || "general awareness of the app"}

STEP 1 — Reason about the product before choosing anything visual:
  - What category is this app in?
  - Who is the actual audience? Be specific about them.
  - What emotional register would make that audience stop scrolling?

STEP 2 — Choose exactly one "vibe" from this list, matched to that audience:
  - playful    — soft, warm, friendly. For kids, babies, family, casual games,
                 food, anything domestic or lighthearted.
  - calm       — serene, understated. For wellness, sleep, journaling,
                 meditation, health, mindfulness.
  - energetic  — loud, high-contrast, urgent. For fitness, sports, gaming,
                 social, youth culture, launches that need noise.
  - premium    — refined, elegant, restrained. For luxury, finance, premium
                 subscriptions, professional and executive tools.
  - technical  — precise, engineered, schematic. For developer tools, data,
                 security, infrastructure, B2B and API products.
  - fresh      — bright, natural, optimistic. For productivity, travel,
                 outdoors, education, sustainability.

Pick the one a professional would pick. A baby-products app must be "playful",
never "technical". A security tool must be "technical", never "playful".

STEP 3 — Write the ad copy. Constraints are strict, because this text is set in
a fixed layout and must not overflow:
  - headline: max 42 characters. The single strongest idea. No app name unless
              it genuinely is the hook.
  - subhead:  max 70 characters. One concrete supporting benefit.
  - cta:      max 22 characters. An action, e.g. "Download free".
  - badge:    max 18 characters, optional. A proof point, e.g. "4.8 rated".

STEP 4 — Describe the background artwork. Subject matter and mood only.
  - Describe a scene, texture or abstract composition — NOT text, NOT a UI
    mockup, NOT a phone frame, NOT a logo.
  - Leave the composition open in the centre-left so headline text can sit
    over it legibly.

Respond ONLY with valid JSON in exactly this shape, no commentary:
{
  "headline": "...",
  "subhead": "...",
  "cta": "...",
  "badge": "...",
  "vibe": "playful|calm|energetic|premium|technical|fresh",
  "rationale": "one sentence on why this vibe fits this audience",
  "imagery": "description of the background artwork subject and mood"
}`;
}

/**
 * Stage 2 — expands a brief into the image-model prompt.
 *
 * Text is explicitly forbidden in the artwork: the client composites the real
 * headline over it as vector text, so anything the model writes would be a
 * misspelled duplicate sitting underneath.
 */
export function buildImagePrompt(brief: AdBrief, format: AdFormat): string {
  const vibe = VIBES[brief.vibe] ?? VIBES.fresh!;
  const { w, h } = AD_FORMATS[format];

  return [
    `Professional advertising background artwork, ${w}x${h}.`,
    brief.imagery,
    `Art direction: ${vibe.art}.`,
    `Colour palette: ${vibe.palette}.`,
    "Composition: keep the left and centre area visually calm and uncluttered so text can be overlaid there; place detail and interest toward the edges and lower right.",
    "Style: modern commercial advertising photography or illustration, high production value, sharp focus, professionally lit.",
    "ABSOLUTELY NO text, no letters, no words, no numbers, no typography, no logos, no watermarks, no user-interface elements, no phone mockups, no device frames.",
  ].join(" ");
}

/** Negative prompt for models that accept one (Stable Diffusion et al.). */
export const IMAGE_NEGATIVE_PROMPT =
  "text, letters, words, numbers, typography, captions, watermark, signature, logo, ui, user interface, phone mockup, device frame, screenshot, blurry, low quality, distorted, extra limbs, deformed";

/**
 * Fallback brief used when the LLM is unavailable, so the feature degrades to
 * "a plainer ad" rather than to an error page.
 */
export function fallbackBrief(app: AppRow, userInput: string): AdBrief {
  return {
    headline: app.name,
    subhead: app.description.slice(0, 70),
    cta: "Try it free",
    badge: "",
    vibe: "fresh",
    rationale: "Default direction — AI brief unavailable.",
    imagery: userInput || `abstract composition evoking ${app.description}`,
  };
}
