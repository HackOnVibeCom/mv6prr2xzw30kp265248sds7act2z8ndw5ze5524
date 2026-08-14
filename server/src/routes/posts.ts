import { Router, Request, Response } from "express";
import { supabase } from "../db";

const router = Router();

/**
 * GET /api/posts?appId=<uuid>&limit=50&platform=twitter&tone=casual
 * Fetch generated posts for a given app, sorted by rank_score descending.
 *
 * Query params:
 *   appId    — required
 *   limit    — optional, default 50
 *   platform — optional filter
 *   tone     — optional filter
 *   eventId  — optional filter (posts for a specific event)
 *   chosen   — optional boolean filter ("true" | "false")
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

  const { data, error } = await query;

  if (error) {
    console.error("[posts] select error:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.json(data ?? []);
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
