/**
 * AutoPromo SDK — the entire "code integration" a host app needs.
 *
 *   AutoPromo.init({ appId, apiUrl });
 *   AutoPromo.trackLaunch();
 *   AutoPromo.trackMilestone({ label: "1000 downloads" });
 *
 * See plan.md §9.
 */

import { getJson, postJson, type HttpOptions } from "./http.js";
import { buildShareUrl, openShare, platformLabel, toShareTarget, type ShareTarget } from "./share.js";
import type {
  AutoPromoConfig,
  EventPayload,
  EventType,
  GetPostsOptions,
  LaunchPayload,
  MilestonePayload,
  RankedPost,
  ReviewPayload,
  TrackResult,
  VersionPayload,
} from "./types.js";

let config: AutoPromoConfig | null = null;

/** Strips a trailing slash so `${apiUrl}/event` never doubles up. */
function normaliseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function requireConfig(): AutoPromoConfig {
  if (!config) {
    throw new Error("AutoPromo.init() must be called before tracking events or fetching posts.");
  }
  return config;
}

function httpOpts(cfg: AutoPromoConfig): HttpOptions {
  return { strict: cfg.strict, debug: cfg.debug };
}

/** Configure the SDK once, at app startup. */
export function init(cfg: AutoPromoConfig): void {
  if (!cfg.appId) throw new Error("AutoPromo.init(): appId is required.");
  if (!cfg.apiUrl) throw new Error("AutoPromo.init(): apiUrl is required.");

  config = { ...cfg, apiUrl: normaliseUrl(cfg.apiUrl) };

  if (cfg.debug) {
    console.log("[AutoPromo] initialised for app", cfg.appName ?? cfg.appId);
  }
}

/** True once `init()` has run. */
export function isInitialised(): boolean {
  return config !== null;
}

/** Current config, or null. Useful in tests. */
export function getConfig(): Readonly<AutoPromoConfig> | null {
  return config;
}

/** Clears config. Primarily for tests. */
export function reset(): void {
  config = null;
}

/**
 * Sends a product event to the backend, which generates and ranks the
 * platform-tailored post variants.
 */
export async function track(type: EventType, payload: EventPayload = {}): Promise<TrackResult> {
  const cfg = requireConfig();

  const result = await postJson<TrackResult>(
    `${cfg.apiUrl}/event`,
    { appId: cfg.appId, type, payload },
    httpOpts(cfg),
  );

  // `null` means the request failed and was swallowed (non-strict mode).
  return result ?? { ok: false, error: "Request failed" };
}

/** App launched for the first time on a fresh install. */
export function trackLaunch(payload: LaunchPayload = {}): Promise<TrackResult> {
  return track("launch", payload);
}

/** Any product milestone worth celebrating. */
export function trackMilestone(payload: MilestonePayload): Promise<TrackResult> {
  return track("milestone", payload);
}

/** A new build shipped. */
export function trackVersion(payload: VersionPayload): Promise<TrackResult> {
  return track("new_version", payload);
}

/** A store review landed. Also returns a suggested reply draft. */
export function trackReview(payload: ReviewPayload): Promise<TrackResult> {
  return track("new_review", payload);
}

/**
 * Fetches generated posts for this app, already sorted by the Strategy
 * Engine's rank_score (highest first).
 */
export async function getRankedPosts(options: GetPostsOptions = {}): Promise<RankedPost[]> {
  const cfg = requireConfig();

  const params = new URLSearchParams({ appId: cfg.appId });
  if (options.platform) params.set("platform", options.platform);
  if (options.tone) params.set("tone", options.tone);
  if (options.eventId) params.set("eventId", options.eventId);
  if (options.limit) params.set("limit", String(options.limit));

  const posts = await getJson<RankedPost[]>(
    `${cfg.apiUrl}/posts?${params.toString()}`,
    httpOpts(cfg),
  );

  return posts ?? [];
}

/**
 * Opens the platform's own compose screen with the post pre-filled, then
 * records the choice so the Strategy Engine learns from it.
 *
 * In React Native, pass `Linking.openURL` so the share opens natively:
 *   await AutoPromo.share(post, Linking.openURL);
 */
export async function share(
  post: RankedPost,
  openURL?: (url: string) => void | Promise<unknown>,
): Promise<string> {
  const cfg = requireConfig();

  const url = openShare(toShareTarget(post, cfg.appUrl), openURL);

  // Fire-and-forget: the human already has their compose screen open, so a
  // stats failure must never surface as an error in the host app.
  void markChosen(post);

  return url;
}

/**
 * Records that a human chose to publish this post. Increments
 * `platform_stats.times_chosen`, which feeds the ranking formula.
 * Called automatically by `share()`.
 */
export async function markChosen(post: RankedPost): Promise<boolean> {
  const cfg = requireConfig();

  const result = await postJson<{ ok: boolean }>(
    `${cfg.apiUrl}/mark-chosen`,
    {
      postId: post.id,
      appId: cfg.appId,
      platform: post.platform,
      tone: post.tone,
    },
    httpOpts(cfg),
  );

  return result?.ok ?? false;
}

const AutoPromo = {
  init,
  isInitialised,
  getConfig,
  reset,
  track,
  trackLaunch,
  trackMilestone,
  trackVersion,
  trackReview,
  getRankedPosts,
  share,
  markChosen,
  buildShareUrl,
  platformLabel,
};

export default AutoPromo;

export { buildShareUrl, openShare, platformLabel, toShareTarget };
export type { ShareTarget };
export type {
  AutoPromoConfig,
  EventPayload,
  EventType,
  GetPostsOptions,
  LaunchPayload,
  MilestonePayload,
  Platform,
  RankedPost,
  ReviewPayload,
  Tone,
  TrackResult,
  VersionPayload,
} from "./types.js";
