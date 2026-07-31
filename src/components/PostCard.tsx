import { useState } from "react";
import { PlatformIcon } from "@/components/PlatformIcon";
import type { Post } from "@/lib/mockData";

export function PostCard({ post, topPick }: { post: Post; topPick?: boolean }) {
  const [posted, setPosted] = useState(false);

  return (
    <article
      className={`ap-enter relative flex flex-col gap-3 rounded-xl border bg-surface p-4 ${
        topPick ? "border-l-2 border-l-amber-200" : ""
      } ${posted ? "opacity-70" : ""}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-green-400 dark:text-mint-300">
            <PlatformIcon platform={post.platform} />
          </span>
          <span className="truncate font-display text-sm font-semibold">{post.platform}</span>
          <span className="shrink-0 rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-medium text-green-500 dark:bg-olive-500 dark:text-mint-200">
            {post.tone}
          </span>
          {topPick && (
            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
              Top pick
            </span>
          )}
        </div>
        <span className="shrink-0 font-mono text-[11px] text-olive-300 dark:text-olive-200">
          {post.score.toFixed(2)}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-muted-fg">{post.content}</p>

      <div className="mt-auto pt-1">
        {posted ? (
          <span className="inline-flex items-center gap-2 rounded-lg border border-mint-200 bg-mint-50 px-3 py-2 text-sm font-medium text-green-500 dark:border-olive-400 dark:bg-olive-500 dark:text-mint-200">
            Posted ✓
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setPosted(true)}
            className="ap-press inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Post to {post.platform}
          </button>
        )}
      </div>
    </article>
  );
}
