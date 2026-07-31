import { Router, Request, Response } from "express";
import { supabase } from "../db";
import type { MarkChosenBody } from "../types";

const router = Router();

/**
 * POST /api/mark-chosen
 * Mark a post as chosen and increment platform_stats.times_chosen.
 * Called from the dashboard whenever a user clicks a share button.
 *
 * Source: plan.md §10.4 + §13.3
 *
 * Body: { postId, appId, platform, tone }
 */
router.post("/", async (req: Request, res: Response) => {
  const { postId, appId, platform, tone } = req.body as MarkChosenBody;

  if (!postId || !appId || !platform || !tone) {
    return res.status(400).json({ error: "postId, appId, platform, and tone are required" });
  }

  // Mark the specific post as chosen
  const { error: updateErr } = await supabase
    .from("generated_posts")
    .update({ chosen: true })
    .eq("id", postId)
    .eq("app_id", appId); // extra guard — only update posts belonging to this app

  if (updateErr) {
    console.error("[mark-chosen] update error:", updateErr);
    return res.status(500).json({ error: "Failed to mark post as chosen" });
  }

  // Increment times_chosen in platform_stats
  const { error: rpcErr } = await supabase.rpc("increment_times_chosen", {
    p_app_id: appId,
    p_platform: platform,
    p_tone: tone,
  });

  if (rpcErr) {
    // Non-fatal — the post is already marked chosen, just log the stats failure
    console.warn("[mark-chosen] rpc increment_times_chosen error:", rpcErr);
  }

  return res.status(200).json({ ok: true });
});

export default router;
