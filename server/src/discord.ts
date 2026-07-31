import type { EventType, EventPayload } from "./types";

/**
 * Fire-and-forget Discord webhook post.
 * This is the one fully automatic integration — no human click required.
 * It fires every time an SDK event is processed.
 *
 * Source: plan.md §14
 */
export async function postToDiscord(
  appName: string,
  eventType: EventType,
  payload: EventPayload,
  generatedCount: number
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return; // silently skip if not configured

  const eventLabel = eventType.replace("_", " ");
  const payloadStr = JSON.stringify(payload);

  const message = {
    content:
      `📣 **${appName}** just triggered a **${eventLabel}** event: \`${payloadStr}\`\n` +
      `AutoPromo generated **${generatedCount} post variants** — check the dashboard.`,
    username: "AutoPromo",
    avatar_url: "https://autopromo.app/favicon.ico",
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
}
