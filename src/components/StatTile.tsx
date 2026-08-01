import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * The dashboard's single stat tile.
 *
 * Replaces three near-identical local `Stat` components that had no icon, no
 * context and no hierarchy. A number on its own doesn't tell you whether it's
 * good — so a tile can carry a unit, a sublabel, and a trend.
 */

export type Trend = "up" | "down" | "flat";

export interface StatTileProps {
  label: string;
  value: string | number;
  /** Small suffix rendered next to the value, e.g. "%" or "posts". */
  unit?: string | undefined;
  /** One line of context under the label, e.g. "of 96 generated". */
  hint?: string | undefined;
  icon?: LucideIcon | undefined;
  trend?: Trend | undefined;
  /** Trend magnitude, e.g. "+12%". Shown beside the trend arrow. */
  trendValue?: string | undefined;
  /** Renders a muted placeholder while data loads. */
  loading?: boolean | undefined;
  /** Draws attention to the single most important tile in a row. */
  emphasis?: boolean | undefined;
}

const TREND_STYLE: Record<Trend, { icon: LucideIcon; className: string; label: string }> = {
  up: { icon: TrendingUp, className: "text-green-400 dark:text-mint-300", label: "up" },
  down: { icon: TrendingDown, className: "text-amber-300", label: "down" },
  flat: { icon: Minus, className: "text-muted-fg", label: "unchanged" },
};

export function StatTile({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  trend,
  trendValue,
  loading,
  emphasis,
}: StatTileProps) {
  if (loading) {
    return (
      <div aria-hidden="true" className="rounded-xl border bg-surface p-4">
        <div className="h-3 w-16 animate-pulse rounded bg-mint-200 dark:bg-olive-400" />
        <div className="mt-3 h-7 w-20 animate-pulse rounded bg-mint-200 dark:bg-olive-400" />
      </div>
    );
  }

  const t = trend ? TREND_STYLE[trend] : null;
  const TrendIcon = t?.icon;

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        emphasis
          ? "border-green-200 bg-green-50 dark:border-green-300/30 dark:bg-olive-500"
          : "bg-surface hover:border-mint-400 dark:hover:border-olive-300"
      }`}
    >
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-fg" aria-hidden="true" />}
        <p className="truncate text-xs font-medium text-muted-fg">{label}</p>
      </div>

      <p className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-2xl leading-none font-bold tabular-nums">{value}</span>
        {unit && <span className="text-xs font-medium text-muted-fg">{unit}</span>}
        {t && TrendIcon && (
          <span className={`ml-auto inline-flex items-center gap-0.5 text-xs ${t.className}`}>
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
            {trendValue && <span className="font-mono">{trendValue}</span>}
            <span className="sr-only">{t.label}</span>
          </span>
        )}
      </p>

      {hint && <p className="mt-1.5 truncate text-[11px] text-muted-fg">{hint}</p>}
    </div>
  );
}

/** Responsive row of stat tiles. Keeps spacing consistent across pages. */
export function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}
