/**
 * Share-intent layer (plan §13).
 *
 * AutoPromo deliberately does NOT auto-post. Every platform below is opened
 * via its own public compose URL with the content pre-filled, and a human
 * presses send. That keeps the whole product free, ToS-compliant, and
 * verifiable live by anyone watching.
 */

import type { Platform, RankedPost } from "./types.js";

export interface ShareTarget {
  platform: Platform;
  /** Post body. */
  content: string;
  /** Used as the Reddit title / OG title. */
  linkTitle?: string | null;
  /** Canonical URL of the app being promoted. */
  appUrl?: string;
}

/** Builds the public compose URL for a platform. Pure — safe to unit test. */
export function buildShareUrl(target: ShareTarget): string {
  const { platform, content, appUrl } = target;
  const text = encodeURIComponent(content);
  const url = encodeURIComponent(appUrl ?? "");

  // Reddit requires a title; fall back to a trimmed first line of the body.
  const title = encodeURIComponent(target.linkTitle?.trim() || firstLine(content, 90));

  switch (platform) {
    case "twitter":
      return url
        ? `https://twitter.com/intent/tweet?text=${text}&url=${url}`
        : `https://twitter.com/intent/tweet?text=${text}`;

    case "reddit":
      // selftext=true opens the text-post composer rather than a link post.
      return `https://www.reddit.com/submit?title=${title}&selftext=true&text=${text}`;

    case "whatsapp":
      return `https://wa.me/?text=${text}${url ? `%20${url}` : ""}`;

    case "telegram":
      return `https://t.me/share/url?url=${url}&text=${text}`;

    case "linkedin":
      // LinkedIn ignores arbitrary text and scrapes Open Graph tags from the
      // URL instead, so this must point at a per-event OG share page.
      return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;

    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
  }
}

function firstLine(s: string, max: number): string {
  const line = s.split("\n")[0] ?? s;
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/** Human-facing button label per platform. */
export const platformLabel: Record<Platform, string> = {
  twitter: "Tweet it",
  reddit: "Post to Reddit",
  whatsapp: "Send on WhatsApp",
  telegram: "Send on Telegram",
  linkedin: "Share on LinkedIn",
  facebook: "Share on Facebook",
};

/**
 * Opens the platform compose screen.
 *
 * Works in three environments:
 *  - React Native / Expo — uses the injected `openURL` (pass `Linking.openURL`)
 *  - Browser — `window.open`
 *  - Anything else — returns the URL for the caller to handle
 */
export function openShare(
  target: ShareTarget,
  openURL?: (url: string) => void | Promise<unknown>,
): string {
  const url = buildShareUrl(target);

  if (openURL) {
    void openURL(url);
  } else if (typeof window !== "undefined" && typeof window.open === "function") {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return url;
}

/** Convenience: turn a ranked post from the API into a share target. */
export function toShareTarget(post: RankedPost, appUrl?: string): ShareTarget {
  return {
    platform: post.platform,
    content: post.content,
    linkTitle: post.link_title,
    appUrl,
  };
}
