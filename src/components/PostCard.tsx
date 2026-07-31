import { useState } from "react";
import { Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PlatformIcon } from "@/components/PlatformIcon";
import { buildShareUrl, platformLabel } from "@/lib/share";
import type { Post } from "@/lib/mockData";

export function PostCard({
  post,
  appUrl,
  topPick,
}: {
  post: Post;
  appUrl: string;
  topPick?: boolean;
}) {
  const [posted, setPosted] = useState(false);
  const [copied, setCopied] = useState(false);

  const text = `${post.content}${post.hashtags.length ? `\n\n${post.hashtags.join(" ")}` : ""}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — select the text instead");
    }
  }

  function share() {
    window.open(buildShareUrl(post.platform, post, appUrl), "_blank", "noopener,noreferrer");
    setPosted(true);
    toast.success(`Compose screen opened for ${post.platform}`);
  }

  return (
    <article
      className={`ap-enter flex flex-col gap-3 rounded-xl border bg-surface p-4 transition-opacity ${
        topPick ? "border-l-2 border-l-amber-200" : ""
      } ${posted ? "opacity-70" : ""}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="shrink-0 text-green-400 dark:text-mint-300">
            <PlatformIcon platform={post.platform} />
          </span>
          <span className="font-display text-sm font-semibold">{post.platform}</span>
          <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-medium text-green-500 dark:bg-olive-500 dark:text-mint-200">
            {post.tone}
          </span>
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-fg">
            {post.event}
          </span>
          {topPick && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
              Top pick
            </span>
          )}
        </div>
        <span
          className="shrink-0 font-mono text-[11px] text-olive-300 dark:text-olive-200"
          title="Strategy engine score"
        >
          {post.score.toFixed(2)}
        </span>
      </div>

      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-fg">{post.content}</p>

      {post.hashtags.length > 0 && (
        <p className="font-mono text-[11px] text-green-400 dark:text-mint-300">
          {post.hashtags.join(" ")}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {posted ? (
          <>
            <button
              type="button"
              onClick={share}
              className="ap-press inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-500 dark:border-green-300/30 dark:bg-olive-400 dark:text-mint-200"
            >
              ✓ Compose opened
            </button>
            <button
              type="button"
              onClick={() => setPosted(false)}
              className="text-xs text-muted-fg hover:underline"
            >
              reset
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={share}
            className="ap-press inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {platformLabel[post.platform]}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          aria-label="Copy post text"
          className="ap-press inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-mint-100 dark:hover:bg-olive-500"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={() => toast("Regenerating variant…", { description: "Mock SDK response" })}
          aria-label="Regenerate this post"
          className="ap-press inline-flex h-9 w-9 items-center justify-center rounded-lg border text-muted-fg hover:bg-mint-100 dark:hover:bg-olive-500"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
