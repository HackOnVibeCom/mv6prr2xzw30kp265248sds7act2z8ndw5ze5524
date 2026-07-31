import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PostCard } from "@/components/PostCard";
import {
  apps,
  getApp,
  platformStats,
  posts as allPosts,
  type EventType,
} from "@/lib/mockData";

const EVENTS: EventType[] = ["Launch", "Milestone", "New version", "New review"];

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
          content: `Ranked, AI-generated promo posts for ${name}, ready to publish to Twitter, Reddit, WhatsApp and LinkedIn.`,
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

function Dashboard() {
  const { app } = Route.useLoaderData();
  const [event, setEvent] = useState<EventType | "All">("All");
  const [runId, setRunId] = useState(0);

  const posts = useMemo(() => {
    const list = allPosts.filter(
      (p) => p.appId === app.id && (event === "All" || p.event === event),
    );
    return [...list].sort((a, b) => b.score - a.score);
  }, [app.id, event]);

  const stats = platformStats[app.id] ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 pb-24 lg:flex-row lg:pb-6">
      <aside className="lg:w-56 lg:shrink-0">
        <Link
          to="/"
          className="font-display text-sm font-bold tracking-tight hover:underline"
        >
          AutoPromo SDK
        </Link>
        <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {apps.map((a) => (
            <Link
              key={a.id}
              to="/apps/$appId"
              params={{ appId: a.id }}
              className="flex shrink-0 items-center gap-2 rounded-lg border bg-surface px-3 py-2 text-sm lg:shrink"
              activeProps={{ className: "border-mint-400 bg-mint-100 dark:bg-olive-500" }}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  a.status === "active" ? "bg-green-300" : "bg-mint-300"
                }`}
                aria-hidden="true"
              />
              <span className="truncate">{a.name}</span>
            </Link>
          ))}
          <Link
            to="/apps"
            className="shrink-0 rounded-lg px-3 py-2 text-sm text-green-500 hover:underline dark:text-mint-200"
          >
            All apps →
          </Link>
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold">{app.name}</h1>
            <p className="mt-1 text-sm text-muted-fg">{app.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
              <option value="All">Trigger event…</option>
              {EVENTS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <Link
              to="/live/$appId"
              params={{ appId: app.id }}
              className="ap-press rounded-lg border px-3 py-2 text-sm font-medium text-green-500 hover:bg-mint-100 dark:text-mint-200 dark:hover:bg-olive-500"
            >
              Live feed
            </Link>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
          <section key={`${event}-${runId}`} className="min-w-0">
            {posts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-mint-300 bg-mint-50 p-8 text-center dark:border-olive-400 dark:bg-olive-500">
                <p className="font-display text-base font-semibold">No posts yet</p>
                <p className="mt-1 text-sm text-muted-fg">
                  Trigger an event above to generate your first one.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {posts.map((p, i) => (
                  <PostCard key={p.id} post={p} topPick={i === 0} />
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-xl border bg-mint-50 p-4 dark:bg-olive-500">
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
                      <div
                        className="h-2 rounded-full bg-green-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}
