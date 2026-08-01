import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BarChart3, Eye, Send, Percent, Trophy, Download, Sparkles, CreditCard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatsChart } from "@/components/StatsChart";
import { EmptyState } from "@/components/EmptyState";
import { StatTile, StatRow } from "@/components/StatTile";
import { FallbackNotice } from "@/components/ConnectionBadge";
import { PaymentSandboxModal } from "@/components/PaymentSandboxModal";
import { getStoredSandboxPlan, PLANS, type PlanTier } from "@/lib/sandboxPlan";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useApps } from "@/lib/queries";
import {
  PLATFORMS,
  platformStats,
  toneStats,
  type Platform,
  type PlatformStat,
} from "@/lib/mockData";

export const Route = createFileRoute("/analytics/")({
  head: () => ({
    meta: [
      { title: "Analytics — AutoPromo SDK" },
      {
        name: "description",
        content:
          "Cross-app view of what the Strategy Engine has learned: which platforms and tones each connected app actually publishes.",
      },
      { property: "og:title", content: "Analytics — AutoPromo SDK" },
      {
        property: "og:description",
        content: "Publish rates per platform and tone across every connected app.",
      },
    ],
  }),
  component: AnalyticsPage,
});

/** Sums per-platform stats across every app, for the portfolio-level view. */
function aggregateStats(appIds: string[]): PlatformStat[] {
  const totals = new Map<Platform, PlatformStat>();

  for (const appId of appIds) {
    for (const stat of platformStats[appId] ?? []) {
      const existing = totals.get(stat.platform);
      if (existing) {
        existing.shown += stat.shown;
        existing.chosen += stat.chosen;
      } else {
        totals.set(stat.platform, { ...stat });
      }
    }
  }

  return PLATFORMS.map((p) => totals.get(p)).filter((s): s is PlatformStat => Boolean(s));
}

function RateRow({
  label,
  chosen,
  shown,
  max,
}: {
  label: string;
  chosen: number;
  shown: number;
  max: number;
}) {
  const rate = shown > 0 ? chosen / shown : 0;
  const pct = Math.round(rate * 100);
  // Bar length is relative to the best performer, so differences stay legible
  // even when every rate sits in a narrow band.
  const width = max > 0 ? Math.round((rate / max) * 100) : 0;

  return (
    <li>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium capitalize">{label}</span>
        <span className="font-mono text-muted-fg">
          {pct}%
          <span className="ml-1.5 opacity-70">
            ({chosen}/{shown})
          </span>
        </span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-mint-200 dark:bg-olive-400">
        <div
          className="h-2 rounded-full bg-green-300 transition-all duration-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </li>
  );
}

function AnalyticsPage() {
  const dark = useDarkMode();
  const { data: appsResult, isLoading } = useApps();
  const apps = useMemo(() => appsResult?.data ?? [], [appsResult]);

  const [scope, setScope] = useState<string>("all");
  const [sandboxPlan, setSandboxPlan] = useState<PlanTier>("builder");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    setSandboxPlan(getStoredSandboxPlan());
  }, []);

  const handleExportReport = () => {
    if (sandboxPlan === "free") {
      toast.info("White-Label Analytics Export requires Builder or Agency Sandbox plan", {
        action: {
          label: "Upgrade Sandbox",
          onClick: () => setIsPaymentModalOpen(true),
        },
      });
      return;
    }

    const reportData = {
      title: "AutoPromo Analytics Strategy Report",
      plan: PLANS[sandboxPlan].name,
      generatedAt: new Date().toISOString(),
      scope,
      totals,
      topPlatform: bestPlatform?.platform ?? "N/A",
      platformBreakdown: stats,
      toneBreakdown: tones,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autopromo-analytics-report-${scope}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("White-Label Analytics Report downloaded!");
  };

  const appIds = useMemo(() => (scope === "all" ? apps.map((a) => a.id) : [scope]), [scope, apps]);

  const stats = useMemo(() => aggregateStats(appIds), [appIds]);

  const tones = useMemo(() => {
    const totals = new Map<string, { chosen: number; shown: number }>();
    for (const appId of appIds) {
      for (const t of toneStats[appId] ?? []) {
        const existing = totals.get(t.tone);
        if (existing) {
          existing.chosen += t.chosen;
          existing.shown += t.shown;
        } else {
          totals.set(t.tone, { chosen: t.chosen, shown: t.shown });
        }
      }
    }
    return [...totals.entries()]
      .map(([tone, v]) => ({ tone, ...v }))
      .sort((a, b) => b.chosen / Math.max(b.shown, 1) - a.chosen / Math.max(a.shown, 1));
  }, [appIds]);

  const totals = useMemo(() => {
    const shown = stats.reduce((n, s) => n + s.shown, 0);
    const chosen = stats.reduce((n, s) => n + s.chosen, 0);
    return {
      shown,
      chosen,
      rate: shown > 0 ? Math.round((chosen / shown) * 100) : 0,
    };
  }, [stats]);

  const bestPlatform = useMemo(
    () =>
      [...stats].sort(
        (a, b) => b.chosen / Math.max(b.shown, 1) - a.chosen / Math.max(a.shown, 1),
      )[0],
    [stats],
  );

  const maxPlatformRate = useMemo(
    () => Math.max(...stats.map((s) => s.chosen / Math.max(s.shown, 1)), 0),
    [stats],
  );
  const maxToneRate = useMemo(
    () => Math.max(...tones.map((t) => t.chosen / Math.max(t.shown, 1)), 0),
    [tones],
  );

  return (
    <AppShell title="Analytics">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold">Analytics</h1>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
              {PLANS[sandboxPlan].badge}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-fg">
            What the Strategy Engine has learned so far. Every percentage below is a real publish
            rate — variants a human actually sent, over variants shown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportReport}
            className="ap-press inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-2 text-xs font-semibold hover:bg-muted"
            title="Download White-Label Strategy Report (Agency Feature)"
          >
            <Download className="h-3.5 w-3.5 text-emerald-500" />
            <span>Export Report</span>
          </button>

          <label className="sr-only" htmlFor="scope">
            Scope
          </label>
          <select
            id="scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="rounded-lg border bg-surface px-3 py-2 text-sm font-medium"
          >
            <option value="all">All apps</option>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <FallbackNotice className="mt-4" />

      {isLoading ? (
        <div className="mt-8 h-64 animate-pulse rounded-xl border bg-surface" />
      ) : stats.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={BarChart3}
            title="No strategy data yet"
            body="Publish a few posts and the engine starts recording which platforms and tones your team prefers."
            action={
              <Link
                to="/apps"
                className="ap-press inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
              >
                Go to apps
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* ── Headline numbers ── */}
          <div className="mt-6">
            <StatRow>
              <StatTile
                icon={Eye}
                label="Variants shown"
                value={totals.shown}
                hint={`across ${stats.length} platforms`}
              />
              <StatTile
                icon={Send}
                label="Variants published"
                value={totals.chosen}
                hint="a human pressed send"
              />
              <StatTile
                icon={Percent}
                label="Overall publish rate"
                value={totals.rate}
                unit="%"
                hint="published ÷ shown"
                emphasis
              />
              <StatTile
                icon={Trophy}
                label="Strongest platform"
                value={bestPlatform?.platform ?? "—"}
                hint={
                  bestPlatform
                    ? `${Math.round(
                        (bestPlatform.chosen / Math.max(bestPlatform.shown, 1)) * 100,
                      )}% publish rate`
                    : undefined
                }
              />
            </StatRow>
          </div>

          {/* ── Main chart ── */}
          <section className="mt-6 rounded-xl border bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">Shown vs. published, by platform</h2>
            <p className="mt-1 mb-4 text-sm text-muted-fg">
              The gap between the two bars is the learning signal. A platform shown often but rarely
              published gets demoted on the next event.
            </p>
            <StatsChart stats={stats} dark={dark} />
          </section>

          {/* ── Rate breakdowns ── */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border bg-surface p-5">
              <h2 className="font-display text-base font-semibold">Publish rate by platform</h2>
              <p className="mt-1 text-xs text-muted-fg">
                Bars are relative to the strongest performer.
              </p>
              <ul className="mt-4 space-y-3">
                {[...stats]
                  .sort((a, b) => b.chosen / Math.max(b.shown, 1) - a.chosen / Math.max(a.shown, 1))
                  .map((s) => (
                    <RateRow
                      key={s.platform}
                      label={s.platform}
                      chosen={s.chosen}
                      shown={s.shown}
                      max={maxPlatformRate}
                    />
                  ))}
              </ul>
            </section>

            <section className="rounded-xl border bg-surface p-5">
              <h2 className="font-display text-base font-semibold">Publish rate by tone</h2>
              <p className="mt-1 text-xs text-muted-fg">Which voice this audience responds to.</p>
              <ul className="mt-4 space-y-3">
                {tones.map((t) => (
                  <RateRow
                    key={t.tone}
                    label={t.tone}
                    chosen={t.chosen}
                    shown={t.shown}
                    max={maxToneRate}
                  />
                ))}
              </ul>
            </section>
          </div>

          {/* ── Per-app comparison ── */}
          {scope === "all" && apps.length > 1 && (
            <section className="mt-6 rounded-xl border bg-surface p-5">
              <h2 className="font-display text-base font-semibold">By app</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted-fg">
                    <tr className="border-b">
                      <th scope="col" className="py-2 pr-4 font-medium">
                        App
                      </th>
                      <th scope="col" className="py-2 pr-4 text-right font-medium">
                        Generated
                      </th>
                      <th scope="col" className="py-2 pr-4 text-right font-medium">
                        Published
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((a) => {
                      const rate =
                        a.postsGenerated > 0
                          ? Math.round((a.postsPublished / a.postsGenerated) * 100)
                          : 0;
                      return (
                        <tr key={a.id} className="border-b last:border-0">
                          <th scope="row" className="py-2.5 pr-4 font-medium">
                            <Link
                              to="/apps/$appId"
                              params={{ appId: a.id }}
                              className="hover:underline"
                            >
                              {a.name}
                            </Link>
                          </th>
                          <td className="py-2.5 pr-4 text-right font-mono text-muted-fg">
                            {a.postsGenerated}
                          </td>
                          <td className="py-2.5 pr-4 text-right font-mono text-muted-fg">
                            {a.postsPublished}
                          </td>
                          <td className="py-2.5 text-right font-mono text-muted-fg">{rate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
      <PaymentSandboxModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={sandboxPlan}
        onPlanChanged={(newPlan) => setSandboxPlan(newPlan)}
      />
    </AppShell>
  );
}
