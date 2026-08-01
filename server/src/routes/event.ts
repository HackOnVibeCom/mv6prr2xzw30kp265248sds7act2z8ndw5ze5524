import { Router, Request, Response } from "express";
import { env } from "../env";
import { supabase } from "../db";
import { computeRankScore } from "../strategy";
import { buildGenerationPrompt } from "../prompts";
import { postToDiscord } from "../discord";
import { generateLlmJsonCompletion } from "../llmProvider";
import type {
  TrackEventBody,
  AppRow,
  PlatformStatRow,
  GroqResponse,
  Platform,
  Tone,
} from "../types";

function generateFallbackPosts(app: AppRow, type: string, payload: Record<string, unknown>): GroqResponse {
  const customDetail = (payload.prompt || payload.details || payload.version || app.description || "").toString();
  const detailStr = customDetail ? `: ${customDetail}` : "";

  return {
    posts: [
      {
        platform: "twitter",
        tone: "casual",
        content: `🚀 Big news for ${app.name}! We've just dropped our latest update${detailStr}. Check it out & let us know what you think! 👇 #buildinpublic #indiedev`,
      },
      {
        platform: "twitter",
        tone: "professional",
        content: `We are excited to share an update for ${app.name}${detailStr}. Learn more about how we're improving app performance and user productivity.`,
      },
      {
        platform: "linkedin",
        tone: "casual",
        content: `💡 Building ${app.name} has been an incredible journey. Today, we're releasing our newest ${type.replace("_", " ")} update${detailStr}!\n\nHere's what we learned building this feature for our users...`,
        link_title: `${app.name} - ${type.replace("_", " ")} Update`,
      },
      {
        platform: "linkedin",
        tone: "professional",
        content: `We are pleased to announce the release of ${app.name}'s latest update${detailStr}.\n\nKey highlights:\n- Optimized performance & user experience\n- Enhanced feature capabilities\n- Resolved user-reported issues\n\nTry it today.`,
        link_title: `Announcing ${app.name} Update`,
      },
      {
        platform: "reddit",
        tone: "casual",
        content: `Hey r/SideProject! I've been working on ${app.name} (${app.description}) and just shipped a new update${detailStr}.\n\nI'd love your honest feedback on the UI and workflow!`,
        link_title: `I built ${app.name} and just added a major update - would love your feedback!`,
      },
      {
        platform: "reddit",
        tone: "professional",
        content: `Show Reddit: ${app.name} - ${app.description}.\n\nWe recently deployed our ${type.replace("_", " ")} build${detailStr}. Here is a breakdown of our architecture and feature set.`,
        link_title: `Show Reddit: ${app.name}`,
      },
      {
        platform: "whatsapp",
        tone: "casual",
        content: `Hey! 👋 Quick update on ${app.name} — we just released something new${detailStr}! Check it out here: [LINK]`,
      },
      {
        platform: "whatsapp",
        tone: "professional",
        content: `Hello! Here is the latest update regarding ${app.name}${detailStr}. You can access the new version here: [LINK]`,
      },
      {
        platform: "telegram",
        tone: "casual",
        content: `🔥 NEW UPDATE DROPPED for ${app.name}!\n\n${customDetail || app.description}\n\nGet it now: [LINK]`,
      },
      {
        platform: "telegram",
        tone: "professional",
        content: `📢 ${app.name} Announcement\n\nWe have deployed version improvements${detailStr}. Access the updated release here: [LINK]`,
      },
      {
        platform: "facebook",
        tone: "casual",
        content: `Exciting update for everyone using ${app.name}! 🎉 We just launched a brand new feature${detailStr}. Click below to try it out! [LINK]`,
      },
      {
        platform: "facebook",
        tone: "professional",
        content: `We are pleased to present the latest version of ${app.name}${detailStr}. Designed to enhance your daily workflow. [LINK]`,
      },
    ],
  };
}

/**
 * POST /api/event
 * Core pipeline: receive an SDK event → call LLM (AgentRouter / Groq / OpenAI) → rank variants → store → Discord.
 *
 * Source: plan.md §10.3
 */
router.post("/", async (req: Request, res: Response) => {
  const body = req.body as Partial<TrackEventBody>;
  const { appId, type, payload = {} } = body;

  // ── Validate input ────────────────────────────────────────────────────────
  if (!appId || !type) {
    return res.status(400).json({ error: "Missing required fields: appId, type" });
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

  // ── 3. Call LLM for all variants in one structured JSON request ─────────
  const promptText = buildGenerationPrompt(app, type, payload);
  const llmResult = await generateLlmJsonCompletion<GroqResponse>({
    systemPrompt: "You are an expert social media copywriter for software apps. Output valid JSON only.",
    userPrompt: promptText,
    temperature: 0.8,
  });

  const groqResult = llmResult || generateFallbackPosts(app, type, payload);

  if (!groqResult.posts || !Array.isArray(groqResult.posts)) {
    return res.status(502).json({ error: "Unexpected LLM response shape" });
  }

  // ── 4. Fetch current platform_stats for ranking ───────────────────────────
  const { data: stats } = await supabase.from("platform_stats").select("*").eq("app_id", appId);

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
  // Pass the generated copy so the channel shows the actual posts, not just a
  // notification that something happened.
  postToDiscord(
    app.name,
    type,
    payload,
    insertRows.length,
    insertRows.map((r) => ({
      platform: r.platform,
      tone: r.tone,
      content: r.content,
      link_title: r.link_title,
      rank_score: r.rank_score,
    })),
    `${env.frontendUrl}/apps/${appId}`,
  ).catch((err) => {
    // Never block the SDK's response on a webhook failure.
    console.warn("[event] Discord post failed:", err);
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
