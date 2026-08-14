import { env } from "./env";
import type { EventType, EventPayload, PostVariant } from "./types";

/**
 * Discord webhook integration.
 *
 * This is the one fully automatic channel — no human click required. It fires
 * every time an SDK event is processed, and posts the generated copy itself
 * rather than a bare "something happened" ping, so the channel is usable as a
 * review queue: the team reads the top variants and picks one to publish.
 *
 * Routing: a single DISCORD_WEBHOOK_URL sends every app to one channel. To
 * separate apps, give an app its own webhook via DISCORD_WEBHOOK_URL_<slug>
 * (see `webhookFor`).
 *
 * Source: plan.md §14
 */

/** Discord hard-limits embed descriptions; keep well under it. */
const MAX_FIELD = 900;
const MAX_VARIANTS_SHOWN = 4;

/** Brand colours per platform, so the channel is scannable at a glance. */
const PLATFORM_COLOR: Record<string, number> = {
  twitter: 0x1d9bf0,
  reddit: 0xff4500,
  whatsapp: 0x25d366,
  telegram: 0x229ed9,
  linkedin: 0x0a66c2,
  facebook: 0x1877f2,
};

/**
 * Resolves the webhook for an app.
 *
 * Per-app override: DISCORD_WEBHOOK_URL_POCKETRECIPE=https://...
 * The app name is upper-cased with non-alphanumerics stripped.
 */
export function webhookFor(appName: string): string | null {
  const slug = appName.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const perApp = process.env[`DISCORD_WEBHOOK_URL_${slug}`]?.trim();
  return perApp || env.discordWebhookUrl;
}

function truncate(s: string, max = MAX_FIELD): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/**
 * Posts an event and its generated copy to Discord.
 *
 * Never throws — a webhook failure must not affect the API response the SDK
 * is waiting on.
 */
export async function postToDiscord(
  appName: string,
  eventType: EventType,
  payload: EventPayload,
  generatedCount: number,
  variants: PostVariant[] = [],
  dashboardUrl?: string,
): Promise<void> {
  const webhookUrl = webhookFor(appName);
  if (!webhookUrl) return; // optional integration — skip when not configured

  const eventLabel = eventType.replace(/_/g, " ");

  // Best-ranked variants first: the channel should lead with what the team is
  // most likely to actually publish.
  const top = [...variants]
    .sort((a, b) => (b.rank_score ?? 0) - (a.rank_score ?? 0))
    .slice(0, MAX_VARIANTS_SHOWN);

  const embeds = top.map((v) => ({
    title: `${v.platform} · ${v.tone}${
      typeof v.rank_score === "number" ? ` · ${v.rank_score.toFixed(2)}` : ""
    }`,
    description: truncate(v.link_title ? `**${v.link_title}**\n\n${v.content}` : v.content),
    color: PLATFORM_COLOR[v.platform] ?? 0x4fae72,
  }));

  const detail = Object.entries(payload ?? {})
    .map(([k, val]) => `${k}=${JSON.stringify(val)}`)
    .join(" ");

  const message = {
    username: "AutoPromo",
    content:
      `📣 **${appName}** — ${eventLabel}${detail ? ` · \`${detail}\`` : ""}\n` +
      `Generated **${generatedCount}** variants` +
      (top.length < generatedCount ? `, showing the top ${top.length}` : "") +
      (dashboardUrl ? `\n${dashboardUrl}` : ""),
    ...(embeds.length > 0 ? { embeds } : {}),
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    throw new Error(`Discord webhook ${res.status}: ${await res.text().catch(() => "")}`);
  }
}

/** Sends a test message. Used by the Settings page to verify configuration. */
export async function testDiscordWebhook(appName?: string): Promise<void> {
  const webhookUrl = appName ? webhookFor(appName) : env.discordWebhookUrl;
  if (!webhookUrl) throw new Error("No Discord webhook configured");

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "AutoPromo",
      content:
        "✅ AutoPromo test message — your webhook is working. Generated posts will appear here automatically.",
    }),
  });

  if (!res.ok) {
    throw new Error(`Discord webhook ${res.status}: ${await res.text().catch(() => "")}`);
  }
}
