import { Router, Request, Response } from "express";
import { env } from "../env";
import { supabase } from "../db";
import { computeRankScore } from "../strategy";
import { buildGenerationPrompt } from "../prompts";
import { postToDiscord } from "../discord";
import { generateLlmJsonCompletion } from "../llmProvider";
import { memoryPostsStore } from "./posts";
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

const router = Router();

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

  // ── 1. Fetch app context (with seed app & dynamic fallbacks) ──────────────
  let app: AppRow;
  const { data: dbApp } = await supabase
    .from("apps")
    .select("*")
    .eq("id", appId)
    .single<AppRow>();

  const rawPayload = (payload || {}) as Record<string, unknown>;

  if (dbApp) {
    app = dbApp;
  } else {
    // Fallback for seed apps & dynamic apps
    const seedApps: Record<string, { name: string; tagline: string; description: string }> = {
      "pocket-recipe": {
        name: "PocketRecipe",
        tagline: "Your AI sous-chef in your pocket.",
        description: "Turn whatever's in your fridge into dinner step-by-step with zero waste.",
      },
      "focus-timer": {
        name: "FocusTimer",
        tagline: "A timer that mutes your loudest apps.",
        description: "A pomodoro timer that quietly blocks the apps you doomscroll while it runs.",
      },
      "habit-tracker": {
        name: "HabitTracker",
        tagline: "Build habits that stick, beautifully.",
        description: "Minimalist streak tracker with widget support and privacy-first sync.",
      },
    };

    const foundSeed = seedApps[appId];
    app = {
      id: appId,
      name: foundSeed?.name || (rawPayload.appName as string) || appId,
      description: foundSeed?.description || (rawPayload.prompt as string) || (rawPayload.details as string) || "Modern software app.",
      created_at: new Date().toISOString(),
    };
  }

  // ── 2. Store the raw event (graceful if DB offline) ───────────────────────
  let eventId = `evt-${Date.now()}`;
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .insert({ app_id: appId, type, payload })
    .select()
    .single();

  if (eventRow?.id) {
    eventId = eventRow.id;
  } else if (eventErr) {
    console.warn("[event] Supabase insert event warning (using memory ID):", eventErr.message);
  }

  // ── 3. Call LLM for all variants in one structured JSON request ─────────
  const promptText = buildGenerationPrompt(app, type, payload);
  const llmResult = await generateLlmJsonCompletion<GroqResponse>({
    systemPrompt: "You are an expert social media copywriter for software apps. Output valid JSON only containing a 'posts' array.",
    userPrompt: promptText,
    temperature: 0.8,
  });

  const groqResult = llmResult || generateFallbackPosts(app, type, payload as Record<string, unknown>);

  if (!groqResult.posts || !Array.isArray(groqResult.posts)) {
    groqResult.posts = generateFallbackPosts(app, type, payload as Record<string, unknown>).posts;
  }

  // ── 4. Fetch current platform_stats for ranking ───────────────────────────
  const { data: stats } = await supabase.from("platform_stats").select("*").eq("app_id", appId);
  const statsRows = (stats ?? []) as PlatformStatRow[];

  // ── 5. Score each variant and build insert rows ───────────────────────────
  const insertRows = groqResult.posts.map((v, idx) => ({
    id: `post-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    event_id: eventId,
    app_id: appId,
    platform: v.platform as Platform,
    tone: v.tone as Tone,
    content: v.content,
    link_title: v.link_title ?? null,
    rank_score: computeRankScore(type, v.platform as Platform, v.tone as Tone, statsRows),
    chosen: false,
    created_at: new Date().toISOString(),
  }));

  // Store in memory for instant retrieval & seed apps
  memoryPostsStore[appId] = [...insertRows, ...(memoryPostsStore[appId] || [])];

  const { error: insertErr } = await supabase.from("generated_posts").insert(insertRows);
  if (insertErr) {
    console.warn("[event] generated_posts insert warning:", insertErr.message);
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
      .eq("id", eventId);
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
    eventId: eventId,
    generated: insertRows.length,
    posts: insertRows,
    ...(replyDraft ? { replyDraft } : {}),
  });
});

export default router;
