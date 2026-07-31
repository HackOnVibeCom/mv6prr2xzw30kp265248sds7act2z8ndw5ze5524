import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import {
  EVENTS,
  PLATFORMS,
  activity,
  getApp,
  getPosts,
  getReviews,
  platformStats,
  toneStats,
  type EventType,
  type Platform,
} from "@/lib/mockData";

export const Route = createFileRoute("/apps/$appId")({
  loader: ({ params }) => {
    const app = getApp(params.appId);
    if (!app) throw notFound();
    return { app };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.app.name ?? "App";
    return {
      meta: [
        { title: `${name} — AutoPromo dashboard` },
        {
          name: "description",
          content: `Ranked, AI-generated promo posts for ${name}, ready to publish to Twitter, Reddit, WhatsApp, LinkedIn, Telegram and Facebook.`,
        },
        { property: "og:title", content: `${name} — AutoPromo dashboard` },
        {
          property: "og:description",
          content: `Ranked promo posts and strategy-engine stats for ${name}.`,
        },
      ],
    };
  },
  component: Dashboard,
});

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-surface p-4">
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-fg">{label}</p>
    </div>
  );
}

function Dashboard() {
  const { app } = Route.useLoaderData();
  const [event, setEvent] = useState<EventType | "All">("All");
  const [platform, setPlatform] = useState<Platform | "All">("All");
  const [runId, setRunId] = useState(0);

  const posts = useMemo(() => {
    const list = getPosts(app.id).filter(
      (p) =>
        (event === "All" || p.event === event) && (platform === "All" || p.platform === platform),
    );
    return [...list].sort((a, b) => b.score - a.score);
  }, [app.id, event, platform]);

  const stats = platformStats[app.id] ?? [];
  const tones = toneStats[app.id] ?? [];
  const week = activity[app.id] ?? [];
  const reviews = getReviews(app.id);
  const peak = Math.max(1, ...week.map((d) => d.generated));

  return (
    <AppShell title={app.name} liveAppId={app.id}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-2xl font-bold">{app.name}</h1>
            <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-medium text-green-500 dark:bg-olive-500 dark:text-mint-200">
              {app.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-fg">{app.description}</p>
          <p className="mt-1 font-mono text-[11px] text-olive-300 dark:text-olive-200">
            sdk {app.sdkVersion} · {app.platform} · connected {app.connectedAt}
          </p>
        </div>
        <Link
          to="/docs"
          className="ap-press rounded-lg border px-3 py-2 text-sm font-medium hover:bg-mint-100 dark:hover:bg-olive-500"
        >
          Integration guide
        </Link>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Installs" value={app.installs.toLocaleString()} />
        <Stat label="Posts generated" value={app.postsGenerated} />
        <Stat label="Posts published" value={app.postsPublished} />
        <Stat label="Store rating" value={app.rating.toFixed(1)} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="trigger">
          Trigger event
        </label>
        <select
          id="trigger"
          value={event}
          onChange={(e) => {
            setEvent(e.target.value as EventType | "All");
            setRunId((r) => r + 1);
          }}
          className="rounded-lg border bg-surface px-3 py-2 text-sm"
        >
          <option value="All">All events</option>
          {EVENTS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="platform">
          Platform
        </label>
        <select
          id="platform"
          value={platform}
          onChange={(e) => {
            setPlatform(e.target.value as Platform | "All");
            setRunId((r) => r + 1);
          }}
          className="rounded-lg border bg-surface px-3 py-2 text-sm"
        >
          <option value="All">All platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-fg">
          {posts.length} ranked {posts.length === 1 ? "post" : "posts"}
        </span>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section key={`${event}-${platform}-${runId}`} className="min-w-0">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-mint-300 bg-mint-50 p-8 text-center dark:border-olive-400 dark:bg-olive-500">
              <p className="font-display text-base font-semibold">No posts for this filter</p>
              <p className="mt-1 text-sm text-muted-fg">
                Pick another event or platform to see generated copy.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {posts.map((p, i) => (
                <PostCard key={p.id} post={p} appUrl={app.url} topPick={i === 0} />
              ))}
            </div>
          )}

          <h2 className="mt-10 font-display text-lg font-semibold">Recent store reviews</h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border bg-surface p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">@{r.author}</span>
                  <span className="text-amber-300">{"★".repeat(r.rating)}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-fg">{r.body}</p>
                <p className="mt-2 font-mono text-[11px] text-olive-300 dark:text-olive-200">
                  {r.store} · {r.date}
                </p>
              </li>
            ))}
            {reviews.length === 0 && (
              <li className="text-sm text-muted-fg">No reviews synced yet.</li>
            )}
          </ul>
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl border bg-mint-50 p-4 dark:bg-olive-500">
            <h2 className="font-display text-sm font-semibold">Strategy engine</h2>
            <p className="mt-1 text-xs text-muted-fg">Times chosen / times shown</p>
            <ul className="mt-4 space-y-3">
              {stats.map((s) => {
                const pct = Math.round((s.chosen / s.shown) * 100);
                return (
                  <li key={s.platform}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{s.platform}</span>
                      <span className="font-mono text-olive-300 dark:text-mint-200">
                        {s.chosen}/{s.shown}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-mint-200 dark:bg-olive-400">
                      <div className="h-2 rounded-full bg-green-300" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-xl border bg-surface p-4">
            <h2 className="font-display text-sm font-semibold">Tone preference</h2>
            <ul className="mt-3 space-y-2">
              {tones.map((t) => (
                <li key={t.tone} className="flex items-center justify-between text-xs">
                  <span>{t.tone}</span>
                  <span className="font-mono text-olive-300 dark:text-olive-200">
                    {Math.round((t.chosen / t.shown) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border bg-surface p-4">
            <h2 className="font-display text-sm font-semibold">This week</h2>
            <div className="mt-4 flex h-24 items-end gap-2">
              {week.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-mint-300"
                    style={{ height: `${(d.generated / peak) * 72}px` }}
                    title={`${d.generated} generated`}
                  />
                  <div
                    className="w-full rounded-b bg-green-300"
                    style={{ height: `${(d.published / peak) * 72}px` }}
                    title={`${d.published} published`}
                  />
                  <span className="text-[10px] text-muted-fg">{d.day}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-fg">Generated (light) vs published (dark)</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
