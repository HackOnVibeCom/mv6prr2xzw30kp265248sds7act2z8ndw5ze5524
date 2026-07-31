import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Zap, Copy, Check } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
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
  type Post,
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

/** Posts that appear when manually triggering an event from the dashboard */
const TRIGGER_POSTS: Record<EventType, Omit<Post, "id" | "appId" | "createdAt">[]> = {
  Launch: [
    {
      platform: "Twitter",
      tone: "hype",
      event: "Launch",
      score: 0.94,
      hashtags: ["#buildinpublic", "#launch"],
      content:
        "🚀 We just went live! After months of building, the app is officially in your hands. Try it free — link in bio.",
    },
    {
      platform: "Reddit",
      tone: "casual",
      event: "Launch",
      score: 0.81,
      hashtags: [],
      content:
        "Launching today after building solo for six months. Would love brutal feedback from this community — what's broken, what's missing, what made you smile.",
    },
    {
      platform: "LinkedIn",
      tone: "professional",
      event: "Launch",
      score: 0.75,
      hashtags: ["#productlaunch"],
      content:
        "Proud to share we've officially launched. Built to solve a problem we couldn't find a good answer for — here's what we shipped and why.",
    },
  ],
  Milestone: [
    {
      platform: "Twitter",
      tone: "hype",
      event: "Milestone",
      score: 0.96,
      hashtags: ["#1000users", "#indieapp"],
      content:
        "1,000 users 🎉 A thousand real people chose to use what we built. Genuinely surreal. Thank you all — this is just the start.",
    },
    {
      platform: "WhatsApp",
      tone: "casual",
      event: "Milestone",
      score: 0.78,
      hashtags: [],
      content:
        "Just hit a big milestone with the app — 1,000 people using it! If you haven't tried it yet, now's a great time 👉 [LINK]",
    },
    {
      platform: "LinkedIn",
      tone: "professional",
      event: "Milestone",
      score: 0.82,
      hashtags: ["#growth"],
      content:
        "1,000 active users reached. Looking at the data: the retention lift from last week's UX fix was larger than the lift from our launch post. Lesson noted.",
    },
  ],
  "New version": [
    {
      platform: "Twitter",
      tone: "casual",
      event: "New version",
      score: 0.77,
      hashtags: ["#update"],
      content:
        "v2.0 just dropped. Biggest release since launch — we rewrote the core and it's noticeably faster. Update is live on both stores.",
    },
    {
      platform: "Reddit",
      tone: "technical",
      event: "New version",
      score: 0.69,
      hashtags: [],
      content:
        "v2.0 changelog: migrated storage layer from SQLite to a CRDT-based sync engine, reduced cold-start by 40%, added offline-first support. Full diff and known regressions in comments.",
    },
    {
      platform: "Telegram",
      tone: "casual",
      event: "New version",
      score: 0.61,
      hashtags: [],
      content:
        "Big update just landed! v2.0 is faster, works offline, and fixes the bug everyone kept messaging us about. Grab it from the store 🙏",
    },
  ],
  "New review": [
    {
      platform: "Twitter",
      tone: "casual",
      event: "New review",
      score: 0.71,
      hashtags: [],
      content:
        '⭐⭐⭐⭐⭐ "This is the only app I\'ve kept on my phone for longer than a week." We\'ll take it. Free on both stores.',
    },
    {
      platform: "LinkedIn",
      tone: "professional",
      event: "New review",
      score: 0.65,
      hashtags: [],
      content:
        "Five-star review this morning: a user described exactly the problem we set out to solve. When product and pain align, people notice.",
    },
  ],
};

const NEW_REVIEW_REPLY =
  "Thanks so much for the kind words — hearing this from real users is what keeps us going. If you ever run into anything or have a feature request, drop us a line at support@autopromo.app 🙏";

/* -------------------------------------------------------------------------- */

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-surface p-4">
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-fg">{label}</p>
    </div>
  );
}

function ScoreBar({
  label,
  pct,
  chosen,
  shown,
}: {
  label: string;
  pct: number;
  chosen: number;
  shown: number;
}) {
  return (
    <li>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span
          className="cursor-help font-mono text-olive-300 dark:text-mint-200"
          title={`base_weight + 0.5 × (${chosen}/${shown} chosen)`}
        >
          {chosen}/{shown}
        </span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-mint-200 dark:bg-olive-400">
        <div
          className="h-2 rounded-full bg-green-300 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

function SuggestedReplyCard({ replyText }: { replyText: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(replyText);
      setCopied(true);
      toast.success("Reply copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — select the text instead");
    }
  }

  return (
    <article className="ap-enter col-span-full flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-200/30 dark:bg-olive-500">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs text-amber-300">
          ★
        </span>
        <span className="font-display text-sm font-semibold">Suggested reply to reviewer</span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
          review response
        </span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-fg">{replyText}</p>
      <div className="mt-auto pt-1">
        <button
          type="button"
          onClick={copy}
          className="ap-press inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-mint-100 dark:hover:bg-olive-400"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied ✓" : "Copy reply"}
        </button>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */

function Dashboard() {
  const { app } = Route.useLoaderData();
  const [filterEvent, setFilterEvent] = useState<EventType | "All">("All");
  const [filterPlatform, setFilterPlatform] = useState<Platform | "All">("All");
  const [triggered, setTriggered] = useState<EventType | null>(null);
  const [triggerPosts, setTriggerPosts] = useState<Post[]>([]);
  const [runId, setRunId] = useState(0);

  const basePosts = useMemo(() => {
    return getPosts(app.id)
      .filter(
        (p) =>
          (filterEvent === "All" || p.event === filterEvent) &&
          (filterPlatform === "All" || p.platform === filterPlatform),
      )
      .sort((a, b) => b.score - a.score);
  }, [app.id, filterEvent, filterPlatform]);

  const triggeredFiltered = useMemo(() => {
    return triggerPosts.filter(
      (p) =>
        (filterEvent === "All" || p.event === filterEvent) &&
        (filterPlatform === "All" || p.platform === filterPlatform),
    );
  }, [triggerPosts, filterEvent, filterPlatform]);

  const allPosts = useMemo(
    () => [...triggeredFiltered, ...basePosts],
    [triggeredFiltered, basePosts],
  );

  function handleTrigger(eventType: EventType) {
    const seeds = TRIGGER_POSTS[eventType] ?? [];
    const newPosts: Post[] = seeds.map((s, i) => ({
      ...s,
      id: `triggered-${eventType}-${Date.now()}-${i}`,
      appId: app.id,
      createdAt: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
    setTriggered(eventType);
    setTriggerPosts((prev) => [...newPosts, ...prev]);
    setRunId((r) => r + 1);
    toast.success(`${seeds.length} posts generated for "${eventType}"`, {
      description: "Strategy engine ranked them — top pick shown first.",
    });
  }

  const stats = platformStats[app.id] ?? [];
  const tones = toneStats[app.id] ?? [];
  const week = activity[app.id] ?? [];
  const reviews = getReviews(app.id);

  const showReplyCard =
    (triggered === "New review" || filterEvent === "New review") && allPosts.length > 0;

  return (
    <AppShell title={app.name} liveAppId={app.id}>
      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-2xl font-bold">{app.name}</h1>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                app.status === "active"
                  ? "bg-mint-100 text-green-500 dark:bg-olive-500 dark:text-mint-200"
                  : app.status === "idle"
                    ? "bg-olive-100 text-olive-400 dark:bg-olive-500 dark:text-olive-200"
                    : "bg-amber-50 text-amber-300"
              }`}
            >
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

      {/* ── Stats row ── */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Installs" value={app.installs.toLocaleString()} />
        <Stat label="Posts generated" value={app.postsGenerated + triggerPosts.length} />
        <Stat label="Posts published" value={app.postsPublished} />
        <Stat label="Store rating" value={app.rating.toFixed(1)} />
      </div>

      {/* ── Trigger event bar ── */}
      <div className="mt-6 rounded-xl border border-mint-300 bg-mint-50 p-4 dark:border-olive-400 dark:bg-olive-500">
        <p className="mb-3 text-xs font-semibold text-muted-fg">
          Simulate an SDK event — new posts will appear above existing ones, ranked by the strategy
          engine
        </p>
        <div className="flex flex-wrap gap-2">
          {EVENTS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => handleTrigger(e)}
              className={`ap-press inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                triggered === e
                  ? "border-green-300 bg-green-50 text-green-500 dark:bg-olive-400 dark:text-mint-200"
                  : "hover:bg-mint-100 dark:hover:bg-olive-400"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="filter-event">
          Filter by event
        </label>
        <select
          id="filter-event"
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value as EventType | "All")}
          className="rounded-lg border bg-surface px-3 py-2 text-sm"
        >
          <option value="All">All events</option>
          {EVENTS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-platform">
          Filter by platform
        </label>
        <select
          id="filter-platform"
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value as Platform | "All")}
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
          {allPosts.length} ranked {allPosts.length === 1 ? "post" : "posts"}
        </span>
        {triggerPosts.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setTriggerPosts([]);
              setTriggered(null);
              setRunId((r) => r + 1);
            }}
            className="text-xs text-green-400 hover:underline dark:text-mint-300"
          >
            clear simulated
          </button>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section key={`${filterEvent}-${filterPlatform}-${runId}`} className="min-w-0">
          {allPosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-mint-300 bg-mint-50 p-8 text-center dark:border-olive-400 dark:bg-olive-500">
              <p className="font-display text-base font-semibold">No posts yet for this filter</p>
              <p className="mt-1 text-sm text-muted-fg">
                Trigger an event above to generate your first posts, or try a different filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {showReplyCard && <SuggestedReplyCard replyText={NEW_REVIEW_REPLY} />}
              {allPosts.map((p, i) => (
                <PostCard
                  key={`${p.id}-${runId}`}
                  post={p}
                  appUrl={app.url}
                  topPick={!showReplyCard && i === 0}
                />
              ))}
            </div>
          )}

          {/* ── Reviews ── */}
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

        {/* ── Sidebar ── */}
        <aside className="space-y-6">
          {/* Strategy engine */}
          <div className="rounded-xl border bg-mint-50 p-4 dark:bg-olive-500">
            <h2 className="font-display text-sm font-semibold">Strategy engine</h2>
            <p className="mt-1 text-xs text-muted-fg">
              Platforms your team actually publishes to get ranked higher over time.
            </p>
            <ul className="mt-4 space-y-3">
              {stats.map((s) => (
                <ScoreBar
                  key={s.platform}
                  label={s.platform}
                  pct={Math.round((s.chosen / s.shown) * 100)}
                  chosen={s.chosen}
                  shown={s.shown}
                />
              ))}
            </ul>
            <p className="mt-4 font-mono text-[10px] leading-relaxed text-muted-fg">
              score = base_weight(event, platform)
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.5 × (chosen / shown)
            </p>
          </div>

          {/* Tone preference */}
          <div className="rounded-xl border bg-surface p-4">
            <h2 className="font-display text-sm font-semibold">Tone preference</h2>
            <ul className="mt-3 space-y-2.5">
              {tones.map((t) => {
                const pct = Math.round((t.chosen / t.shown) * 100);
                return (
                  <li key={t.tone}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize">{t.tone}</span>
                      <span className="font-mono text-olive-300 dark:text-olive-200">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-mint-200 dark:bg-olive-400">
                      <div
                        className="h-1.5 rounded-full bg-green-200 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Weekly chart */}
          <div className="rounded-xl border bg-surface p-4">
            <h2 className="font-display text-sm font-semibold">This week</h2>
            <div className="mt-4 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={week} barGap={2} barCategoryGap="20%">
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "var(--color-muted-fg)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-surface-border)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="generated"
                    name="Generated"
                    fill="var(--color-mint-300)"
                    radius={[3, 3, 0, 0]}
                  >
                    {week.map((_, i) => (
                      <Cell key={i} />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="published"
                    name="Published"
                    fill="var(--color-green-300)"
                    radius={[3, 3, 0, 0]}
                  >
                    {week.map((_, i) => (
                      <Cell key={i} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] text-muted-fg">
              <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-mint-300" />
              Generated
              <span className="ml-3 mr-1 inline-block h-2 w-2 rounded-sm bg-green-300" />
              Published
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
