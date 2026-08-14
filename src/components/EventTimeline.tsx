import { Link } from "@tanstack/react-router";
import { Rocket, Trophy, Package, Star, type LucideIcon } from "lucide-react";
import type { EventType } from "@/lib/mockData";

export interface TimelineItem {
  id: string;
  event: EventType;
  /** Display time, e.g. "14:32". */
  time: string;
  /** How many variants this event produced. */
  variants: number;
  /** How many of those a human published. */
  published: number;
  summary?: string;
}

const EVENT_ICON: Record<EventType, LucideIcon> = {
  Launch: Rocket,
  Milestone: Trophy,
  "New version": Package,
  "New review": Star,
};

/**
 * Vertical event history (plan §29 names this component but it was never
 * built). Shows the causal chain judges care about: an event happened →
 * variants were generated → some were published.
 */
export function EventTimeline({ items, appId }: { items: TimelineItem[]; appId: string }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-fg">
        No events yet. Trigger one above and it'll appear here.
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-mint-200 pl-6 dark:border-olive-400">
      {items.map((item) => {
        const Icon = EVENT_ICON[item.event] ?? Rocket;
        const rate = item.variants > 0 ? Math.round((item.published / item.variants) * 100) : 0;

        return (
          <li key={item.id} className="relative">
            <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border bg-surface text-green-400 dark:text-mint-300">
              <Icon className="h-2.5 w-2.5" />
            </span>

            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <Link
                to="/apps/$appId/events/$eventId"
                params={{ appId, eventId: item.id }}
                className="font-display text-sm font-semibold hover:underline"
              >
                {item.event}
              </Link>
              <span className="font-mono text-[11px] text-olive-300 dark:text-olive-200">
                {item.time}
              </span>
            </div>

            {item.summary && <p className="mt-0.5 text-xs text-muted-fg">{item.summary}</p>}

            <p className="mt-1 font-mono text-[11px] text-muted-fg">
              {item.variants} variants · {item.published} published
              {item.variants > 0 && ` · ${rate}%`}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
