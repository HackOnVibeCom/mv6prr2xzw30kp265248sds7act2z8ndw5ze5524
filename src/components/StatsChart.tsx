import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Table2, BarChart3 } from "lucide-react";
import type { PlatformStat } from "@/lib/mockData";

/**
 * Strategy Engine learning signal (plan §28 stretch goal).
 *
 * Plots times_shown against times_chosen per platform — the two numbers that
 * drive the ranking formula. The gap between the pair is the whole story: a
 * platform shown often but rarely chosen gets demoted over time.
 *
 * Palette validated with the dataviz validator against both surfaces:
 *   light #278a52 / #e8a13b — CVD ΔE 14.3 (protan), all checks pass
 *   dark  #6fc79c / #e8a13b — CVD ΔE 11.1 (deutan), chroma + contrast pass
 */

const SERIES = {
  shown: { label: "Shown", light: "#278a52", dark: "#6fc79c" },
  chosen: { label: "Published", light: "#e8a13b", dark: "#e8a13b" },
} as const;

interface Row {
  platform: string;
  shown: number;
  chosen: number;
  rate: number;
}

function TooltipContent({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]!.payload;

  return (
    <div className="rounded-lg border bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-display font-semibold">{row.platform}</p>
      <p className="mt-1 text-muted-fg">
        {row.chosen} published of {row.shown} shown
      </p>
      <p className="font-mono text-[11px] text-muted-fg">
        ratio {row.rate}% · +{((row.chosen / Math.max(row.shown, 1)) * 0.5).toFixed(3)} to score
      </p>
    </div>
  );
}

export function StatsChart({ stats, dark = false }: { stats: PlatformStat[]; dark?: boolean }) {
  const [view, setView] = useState<"chart" | "table">("chart");

  const rows: Row[] = stats.map((s) => ({
    platform: s.platform,
    shown: s.shown,
    chosen: s.chosen,
    rate: s.shown > 0 ? Math.round((s.chosen / s.shown) * 100) : 0,
  }));

  const shownColor = dark ? SERIES.shown.dark : SERIES.shown.light;
  const chosenColor = dark ? SERIES.chosen.dark : SERIES.chosen.light;

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-fg">
        No platform stats yet — publish a post and the engine starts learning.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {/* Legend — identity is never color-alone */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-fg">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: shownColor }}
            />
            {SERIES.shown.label}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: chosenColor }}
            />
            {SERIES.chosen.label}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setView((v) => (v === "chart" ? "table" : "chart"))}
          className="ap-press inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] text-muted-fg hover:bg-mint-100 dark:hover:bg-olive-500"
        >
          {view === "chart" ? (
            <>
              <Table2 className="h-3 w-3" /> Table
            </>
          ) : (
            <>
              <BarChart3 className="h-3 w-3" /> Chart
            </>
          )}
        </button>
      </div>

      {view === "chart" ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} barGap={2} barCategoryGap="24%">
              <CartesianGrid
                vertical={false}
                stroke="var(--color-surface-border)"
                strokeDasharray="2 4"
              />
              <XAxis
                dataKey="platform"
                tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
                axisLine={false}
                tickLine={false}
                // Recharts drops ticks it thinks won't fit, which silently hid
                // half the platforms in the narrow sidebar. Force every label
                // and angle them so they stay readable.
                interval={0}
                angle={-35}
                textAnchor="end"
                height={52}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: "var(--color-surface-border)", opacity: 0.25 }}
                content={<TooltipContent />}
              />
              <Bar dataKey="shown" name="Shown" radius={[4, 4, 0, 0]}>
                {rows.map((r) => (
                  <Cell key={r.platform} fill={shownColor} />
                ))}
              </Bar>
              <Bar dataKey="chosen" name="Published" radius={[4, 4, 0, 0]}>
                {rows.map((r) => (
                  <Cell key={r.platform} fill={chosenColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-fg">
              <tr className="border-b">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Platform
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Shown
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Published
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.platform} className="border-b last:border-0">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    {r.platform}
                  </th>
                  <td className="py-2 pr-3 text-right font-mono text-muted-fg">{r.shown}</td>
                  <td className="py-2 pr-3 text-right font-mono text-muted-fg">{r.chosen}</td>
                  <td className="py-2 text-right font-mono text-muted-fg">{r.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
