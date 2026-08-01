import { Router, Request, Response } from "express";
import { supabase } from "../db";
import type { CreateAppBody } from "../types";

const router = Router();

/**
 * POST /api/apps
 * Create a new app record. Called once per onboarded app.
 *
 * Body: { name: string, description: string }
 * Returns: the created app row
 */
router.post("/", async (req: Request, res: Response) => {
  const { name, description } = req.body as CreateAppBody;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "name is required" });
  }
  if (!description || typeof description !== "string") {
    return res.status(400).json({ error: "description is required" });
  }

  const { data, error } = await supabase
    .from("apps")
    .insert({ name: name.trim(), description: description.trim() })
    .select()
    .single();

  if (error) {
    console.error("[apps] insert error:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
});

/**
 * GET /api/apps
 * List all apps (useful for the dashboard app-selector).
 */
router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("apps")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[apps] select error:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.json(data ?? []);
});

/**
 * GET /api/apps/:appId
 * Fetch a single app record.
 */
router.get("/:appId", async (req: Request, res: Response) => {
  const { appId } = req.params;

  const { data, error } = await supabase.from("apps").select("*").eq("id", appId).single();

  if (error || !data) {
    return res.status(404).json({ error: "App not found" });
  }

  return res.json(data);
});

export default router;
