import type { Platform, Post } from "@/lib/mockData";

/**
 * Builds the real web/native share intent URL for a platform.
 * On mobile these deep-link straight into the app's compose screen.
 */
export function buildShareUrl(platform: Platform, post: Post, appUrl: string): string {
  const text = `${post.content}${post.hashtags.length ? `\n\n${post.hashtags.join(" ")}` : ""}`;
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(appUrl);

  switch (platform) {
    case "Twitter":
      return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    case "Reddit":
      return `https://www.reddit.com/submit?title=${encodeURIComponent(
        post.content.slice(0, 90),
      )}&text=${t}`;
    case "WhatsApp":
      return `https://wa.me/?text=${t}%20${u}`;
    case "LinkedIn":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "Telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
    case "Facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}`;
  }
}

export const platformLabel: Record<Platform, string> = {
  Twitter: "Tweet it",
  Reddit: "Post to Reddit",
  WhatsApp: "Send on WhatsApp",
  LinkedIn: "Share on LinkedIn",
  Telegram: "Send on Telegram",
  Facebook: "Share on Facebook",
};
