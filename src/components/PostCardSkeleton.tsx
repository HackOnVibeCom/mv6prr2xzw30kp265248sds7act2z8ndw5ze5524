/** Loading placeholder matching PostCard's shape, so the grid doesn't jump. */
export function PostCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse flex-col gap-3 rounded-xl border bg-surface p-4"
    >
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 rounded bg-mint-200 dark:bg-olive-400" />
        <span className="h-3 w-16 rounded bg-mint-200 dark:bg-olive-400" />
        <span className="h-3 w-12 rounded-full bg-mint-200 dark:bg-olive-400" />
        <span className="ml-auto h-3 w-8 rounded bg-mint-200 dark:bg-olive-400" />
      </div>
      <div className="space-y-2">
        <span className="block h-3 w-full rounded bg-mint-200 dark:bg-olive-400" />
        <span className="block h-3 w-11/12 rounded bg-mint-200 dark:bg-olive-400" />
        <span className="block h-3 w-4/5 rounded bg-mint-200 dark:bg-olive-400" />
      </div>
      <div className="mt-1 flex gap-2">
        <span className="h-9 w-28 rounded-lg bg-mint-200 dark:bg-olive-400" />
        <span className="h-9 w-20 rounded-lg bg-mint-200 dark:bg-olive-400" />
      </div>
    </div>
  );
}

/** N skeletons, for a grid that's still loading. */
export function PostCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
