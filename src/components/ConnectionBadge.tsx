import { useDataSource } from "@/lib/dataSource";

/**
 * Header pill showing whether the dashboard is reading live backend data or
 * the seed dataset. A judge should never have to guess which one they're
 * looking at.
 */
export function ConnectionBadge() {
  const { status, retry, apiBaseUrl } = useDataSource();

  if (status === "checking") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] text-muted-fg">
        <span className="h-1.5 w-1.5 rounded-full bg-olive-200" />
        <span className="hidden sm:inline">Connecting…</span>
      </span>
    );
  }

  if (status === "live") {
    return (
      <span
        title={`Live data from ${apiBaseUrl}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-[11px] font-medium text-green-500 dark:border-green-300/30 dark:bg-olive-500 dark:text-mint-200"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="ap-pulse-dot absolute inline-flex h-1.5 w-1.5 rounded-full bg-green-300" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-300" />
        </span>
        <span className="hidden sm:inline">Live</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={retry}
      title={`Backend unreachable at ${apiBaseUrl} — showing sample data. Click to retry.`}
      className="ap-press inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-300"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-200" />
      <span className="hidden sm:inline">Sample data</span>
    </button>
  );
}

/**
 * Inline banner for pages whose content came from the seed dataset.
 * Deliberately explicit — the fallback must never read as real telemetry.
 */
export function FallbackNotice({ className = "" }: { className?: string }) {
  const { status, retry, apiBaseUrl } = useDataSource();

  if (status !== "offline") return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-300 ${className}`}
    >
      <span className="font-semibold">Showing sample data.</span>
      <span className="text-muted-fg">
        The API at <code className="font-mono">{apiBaseUrl}</code> isn't reachable — start the
        server in <code className="font-mono">server/</code> to see live results.
      </span>
      <button type="button" onClick={retry} className="font-semibold underline">
        Retry
      </button>
    </div>
  );
}
