import { Router, Request, Response } from "express";
import { supabase } from "../db";

const router = Router();

/** In-memory fallback post store for demo apps & rapid updates */
export const memoryPostsStore: Record<string, any[]> = {};

/**
 * GET /api/posts?appId=<uuid>&limit=50&platform=twitter&tone=casual
 * Fetch generated posts for a given app, sorted by rank_score descending.
 */
router.get("/", async (req: Request, res: Response) => {
  const { appId, limit, platform, tone, eventId, chosen } = req.query;

  if (!appId || typeof appId !== "string") {
    return res.status(400).json({ error: "appId query param is required" });
  }

  let query = supabase
    .from("generated_posts")
    .select("*")
    .eq("app_id", appId)
    .order("rank_score", { ascending: false });

  if (platform && typeof platform === "string") {
    query = query.eq("platform", platform);
  }
  if (tone && typeof tone === "string") {
    query = query.eq("tone", tone);
  }
  if (eventId && typeof eventId === "string") {
    query = query.eq("event_id", eventId);
  }
  if (chosen !== undefined) {
    query = query.eq("chosen", chosen === "true");
  }

  const maxRows = typeof limit === "string" ? Math.min(parseInt(limit, 10) || 50, 200) : 50;
  query = query.limit(maxRows);

  const { data } = await query;

  const memPosts = (memoryPostsStore[appId] || []).filter((p) => {
    if (platform && typeof platform === "string" && p.platform !== platform) return false;
    if (tone && typeof tone === "string" && p.tone !== tone) return false;
    if (eventId && typeof eventId === "string" && p.event_id !== eventId) return false;
    if (chosen !== undefined && p.chosen !== (chosen === "true")) return false;
    return true;
  });

  const combined = [...memPosts, ...(data ?? [])];
  const unique = Array.from(new Map(combined.map((item) => [item.id || item.content, item])).values());
  unique.sort((a, b) => (b.rank_score ?? b.score ?? 0) - (a.rank_score ?? a.score ?? 0));

  return res.json(unique.slice(0, maxRows));
});

/**
 * GET /api/posts/:postId
 * Fetch a single post by ID.
 */
router.get("/:postId", async (req: Request, res: Response) => {
  const { postId } = req.params;

  const { data, error } = await supabase
    .from("generated_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Post not found" });
  }

  return res.json(data);
});

export default router;
