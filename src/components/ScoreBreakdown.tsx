import type { EventType, Platform, PlatformStat } from "@/lib/mockData";

/**
 * Base weights — mirrors `server/src/strategy.ts` so the dashboard can explain
 * a score without a round trip. If you change the weights server-side, change
 * them here too.
 *
 * Source: plan.md §12.2
 */
export const BASE_WEIGHTS: Record<EventType, Record<Platform, number>> = {
  Launch: {
    Twitter: 0.8,
    Reddit: 0.7,
    WhatsApp: 0.5,
    LinkedIn: 0.6,
    Telegram: 0.45,
    Facebook: 0.4,
  },
  Milestone: {
    Twitter: 0.9,
    Reddit: 0.6,
    WhatsApp: 0.5,
    LinkedIn: 0.7,
    Telegram: 0.45,
    Facebook: 0.4,
  },
  "New version": {
    Twitter: 0.6,
    Reddit: 0.5,
    WhatsApp: 0.4,
    LinkedIn: 0.7,
    Telegram: 0.45,
    Facebook: 0.35,
  },
  "New review": {
    Twitter: 0.3,
    Reddit: 0.2,
    WhatsApp: 0.2,
    LinkedIn: 0.3,
    Telegram: 0.15,
    Facebook: 0.15,
  },
};

export const ADJUSTMENT_FACTOR = 0.5;

export interface Breakdown {
  base: number;
  chosen: number;
  shown: number;
  ratio: number;
  adjustment: number;
  total: number;
}

export function computeBreakdown(
  event: EventType,
  platform: Platform,
  stats: PlatformStat[],
): Breakdown {
  const base = BASE_WEIGHTS[event]?.[platform] ?? 0.4;
  const row = stats.find((s) => s.platform === platform);
  const shown = row?.shown ?? 0;
  const chosen = row?.chosen ?? 0;
  const ratio = shown > 0 ? chosen / shown : 0;
  const adjustment = ADJUSTMENT_FACTOR * ratio;

  return { base, chosen, shown, ratio, adjustment, total: base + adjustment };
}

/**
 * Popover contents explaining exactly how one post's score was produced.
 * "Meaningful AI" in the rubric means the ranking must be inspectable, not a
 * number the UI asserts.
 */
export function ScoreBreakdown({
  event,
  platform,
  stats,
  displayScore,
}: {
  event: EventType;
  platform: Platform;
  stats: PlatformStat[];
  displayScore: number;
}) {
  const b = computeBreakdown(event, platform, stats);

  return (
    <div className="w-64 space-y-2 text-xs">
      <p className="font-display text-sm font-semibold">Why this rank?</p>

      <dl className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-fg">
            Base weight
            <span className="block text-[10px] opacity-70">
              {event} × {platform}
            </span>
          </dt>
          <dd className="font-mono">{b.base.toFixed(2)}</dd>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-fg">
            Learned adjustment
            <span className="block text-[10px] opacity-70">
              0.5 × ({b.chosen}/{b.shown || 1} published)
            </span>
          </dt>
          <dd className="font-mono">+{b.adjustment.toFixed(3)}</dd>
        </div>

        <div className="flex items-baseline justify-between gap-2 border-t pt-1.5">
          <dt className="font-medium">Score</dt>
          <dd className="font-mono font-semibold">{b.total.toFixed(3)}</dd>
        </div>
      </dl>

      {Math.abs(b.total - displayScore) > 0.02 && (
        <p className="text-[10px] leading-snug text-muted-fg">
          Stored score is {displayScore.toFixed(2)} — it was computed when the post was generated,
          before the most recent publishes.
        </p>
      )}

      <p className="border-t pt-1.5 font-mono text-[10px] leading-snug text-muted-fg">
        score = base_weight(event, platform)
        <br />
        &nbsp;&nbsp;+ 0.5 × (chosen / shown)
      </p>
    </div>
  );
}
