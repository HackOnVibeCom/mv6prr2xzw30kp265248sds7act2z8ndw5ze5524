import { Router, Request, Response } from "express";
import { env } from "../env";
import { testDiscordWebhook } from "../discord";

const router = Router();

/**
 * GET /api/integrations
 * Reports which optional integrations are configured, without ever returning
 * the credentials themselves.
 */
router.get("/", (_req: Request, res: Response) => {
  res.json({
    discord: {
      configured: Boolean(env.discordWebhookUrl),
      // One webhook means every app posts to the same channel. Per-app
      // routing is available via DISCORD_WEBHOOK_URL_<APPNAME>.
      routing: "single-channel",
    },
    adImages: {
      provider: env.imageProvider,
      configured: env.imageProvider !== "none",
    },
  });
});

/**
 * POST /api/integrations/discord/test
 * Sends a real message so the user can confirm the webhook works.
 */
router.post("/discord/test", async (req: Request, res: Response) => {
  const { appName } = (req.body ?? {}) as { appName?: string };

  if (!env.discordWebhookUrl) {
    return res.status(400).json({
      error: "No Discord webhook configured",
      hint: "Set DISCORD_WEBHOOK_URL in server/.env and restart the server.",
    });
  }

  try {
    await testDiscordWebhook(appName);
    return res.json({ ok: true, message: "Test message sent to Discord" });
  } catch (err) {
    return res.status(502).json({
      error: err instanceof Error ? err.message : "Discord webhook failed",
    });
  }
});

export default router;
