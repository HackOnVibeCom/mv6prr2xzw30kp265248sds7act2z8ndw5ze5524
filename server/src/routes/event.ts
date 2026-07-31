import { Router, Request, Response } from "express";
import Groq from "groq-sdk";
import { supabase } from "../db";
import { computeRankScore } from "../strategy";
import { buildGenerationPrompt } from "../prompts";
import { postToDiscord } from "../discord";
import type {
  TrackEventBody,
  AppRow,
  PlatformStatRow,
  GroqResponse,
  Platform,
  Tone,
} from "../types";

const router = Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * POST /api/event
 * Core pipeline: receive an SDK event → call Groq → rank variants → store → Discord.
 *
 * Source: plan.md §10.3
 */
router.post("/", async (req: Request, res: Response) => {
  const { appId, type, payload } = req.body as TrackEventBody;

  // ── Validate input ────────────────────────────────────────────────────────
  if (!appId || !type || !payload) {
    return res.status(400).json({ error: "appId, type, and payload are required" });
  }

  const validTypes = ["launch", "milestone", "new_version", "new_review"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: `type must be one of: ${validTypes.join(", ")}`,
    });
  }

  // ── 1. Fetch app context ──────────────────────────────────────────────────
  const { data: app, error: appErr } = await supabase
    .from("apps")
    .select("*")
    .eq("id", appId)
    .single<AppRow>();

  if (appErr || !app) {
    return res.status(404).json({ error: "App not found" });
  }

  // ── 2. Store the raw event ────────────────────────────────────────────────
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .insert({ app_id: appId, type, payload })
    .select()
    .single();

  if (eventErr || !eventRow) {
    console.error("[event] insert error:", eventErr);
    return res.status(500).json({ error: "Failed to store event" });
  }

  // ── 3. Call Groq for all variants in one structured JSON request ──────────
  let groqResult: GroqResponse;
  try {
    const prompt = buildGenerationPrompt(app, type, payload);
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    groqResult = JSON.parse(raw) as GroqResponse;
  } catch (err) {
    console.error("[event] Groq error:", err);
    return res.status(502).json({ error: "AI generation failed", detail: String(err) });
  }

  if (!groqResult.posts || !Array.isArray(groqResult.posts)) {
    return res.status(502).json({ error: "Unexpected LLM response shape" });
  }

  // ── 4. Fetch current platform_stats for ranking ───────────────────────────
  const { data: stats } = await supabase
    .from("platform_stats")
    .select("*")
    .eq("app_id", appId);

  const statsRows = (stats ?? []) as PlatformStatRow[];

  // ── 5. Score each variant and build insert rows ───────────────────────────
  const insertRows = groqResult.posts.map((v) => ({
    event_id: eventRow.id,
    app_id: appId,
    platform: v.platform as Platform,
    tone: v.tone as Tone,
    content: v.content,
    link_title: v.link_title ?? null,
    rank_score: computeRankScore(type, v.platform as Platform, v.tone as Tone, statsRows),
    chosen: false,
  }));

  const { error: insertErr } = await supabase.from("generated_posts").insert(insertRows);
  if (insertErr) {
    console.error("[event] generated_posts insert error:", insertErr);
    return res.status(500).json({ error: "Failed to store generated posts" });
  }

  // ── 6. Increment times_shown for each variant ─────────────────────────────
  // Use upsert so we don't need to pre-create platform_stats rows
  for (const row of insertRows) {
    await supabase.rpc("increment_times_shown", {
      p_app_id: appId,
      p_platform: row.platform,
      p_tone: row.tone,
    });
  }

  // ── 7. Store reply_draft if this was a new_review event ───────────────────
  let replyDraft: string | null = null;
  if (type === "new_review" && groqResult.reply_draft) {
    replyDraft = groqResult.reply_draft;
    // Optionally store the reply draft alongside the event row
    await supabase
      .from("events")
      .update({ payload: { ...payload, reply_draft: replyDraft } })
      .eq("id", eventRow.id);
  }

  // ── 8. Fire-and-forget Discord notification ───────────────────────────────
  postToDiscord(app.name, type, payload, insertRows.length).catch(() => {
    // Silently ignore Discord failures — never block the response for this
  });

  // ── 9. Return success ─────────────────────────────────────────────────────
  return res.status(200).json({
    ok: true,
    eventId: eventRow.id,
    generated: insertRows.length,
    ...(replyDraft ? { replyDraft } : {}),
  });
});

export default router;
