import { Router, Request, Response } from "express";
import { env } from "../env";
import { supabase } from "../db";
import {
  AD_FORMATS,
  VIBES,
  buildAdBriefPrompt,
  buildImagePrompt,
  fallbackBrief,
  type AdBrief,
  type AdFormat,
} from "../adPrompts";
import { generateLlmJsonCompletion } from "../llmProvider";
import { generateImage } from "../imageProvider";
import type { AppRow, EventType } from "../types";

const router = Router();

interface GenerateAdBody {
  appId: string;
  /** What the founder wants to promote, in their own words. Optional. */
  input?: string;
  format?: AdFormat;
  eventType?: EventType;
}

/**
 * POST /api/ad
 *
 * Turns a one-line request into a finished advert.
 *
 * The response deliberately separates artwork from copy: the client draws the
 * headline as real vector text over the returned background. Diffusion models
 * cannot spell reliably, and an advert with a misspelled headline is worse
 * than no advert at all.
 */
router.post("/", async (req: Request, res: Response) => {
  const { appId, input = "", format = "square", eventType } = req.body as GenerateAdBody;

  if (!appId) {
    return res.status(400).json({ error: "appId is required" });
  }
  if (!AD_FORMATS[format]) {
    return res.status(400).json({
      error: `format must be one of: ${Object.keys(AD_FORMATS).join(", ")}`,
    });
  }
  if (input.length > 500) {
    return res.status(400).json({ error: "input must be 500 characters or fewer" });
  }

  // ── 1. App context ────────────────────────────────────────────────────────
  const { data: app, error: appErr } = await supabase
    .from("apps")
    .select("*")
    .eq("id", appId)
    .single<AppRow>();

  if (appErr || !app) {
    return res.status(404).json({ error: "App not found" });
  }

  // ── 2. Creative brief (hidden prompt) ─────────────────────────────────────
  let brief: AdBrief;
  try {
    const promptText = buildAdBriefPrompt(app, input, eventType);
    const parsed = await generateLlmJsonCompletion<Partial<AdBrief>>({
      systemPrompt: "You are an expert advertising creative director. Output valid JSON only.",
      userPrompt: promptText,
      temperature: 0.85,
    });

    if (parsed) {
      const vibe = parsed.vibe && VIBES[parsed.vibe] ? parsed.vibe : "fresh";
      brief = {
        headline: (parsed.headline ?? app.name).slice(0, 60),
        subhead: (parsed.subhead ?? app.description).slice(0, 100),
        cta: (parsed.cta ?? "Try it free").slice(0, 30),
        badge: (parsed.badge ?? "").slice(0, 24),
        vibe,
        rationale: parsed.rationale ?? "",
        imagery: parsed.imagery ?? app.description,
      };
    } else {
      brief = fallbackBrief(app, input);
    }
  } catch (err) {
    console.warn("[ad] brief generation failed, using fallback:", err);
    brief = fallbackBrief(app, input);
  }

  // ── 3. Background artwork ─────────────────────────────────────────────────
  const { w, h } = AD_FORMATS[format];
  const imagePrompt = buildImagePrompt(brief, format);
  const image = await generateImage(imagePrompt, w, h);

  // ── 4. Everything the client needs to compose the final image ─────────────
  return res.json({
    ok: true,
    brief,
    palette: VIBES[brief.vibe],
    format: { name: format, width: w, height: h },
    image: {
      dataUri: image.dataUri,
      provider: image.provider,
      ...(image.error ? { error: image.error } : {}),
    },
    app: { name: app.name, description: app.description },
  });
});

/** GET /api/ad/formats — sizes and vibes the UI can offer. */
router.get("/formats", (_req: Request, res: Response) => {
  res.json({
    formats: Object.entries(AD_FORMATS).map(([name, f]) => ({ name, ...f })),
    vibes: Object.keys(VIBES),
    imageProvider: env.imageProvider,
  });
});

export default router;
