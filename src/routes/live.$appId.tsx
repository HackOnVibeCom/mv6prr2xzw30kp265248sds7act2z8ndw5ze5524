import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { feedEvents, getApp, apps, nextMockEvent, type FeedEvent } from "@/lib/mockData";

export const Route = createFileRoute("/live/$appId")({
  loader: ({ params }) => {
    const app = getApp(params.appId);
    if (!app) throw notFound();
    return { app };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.app.name ?? "App";
    return {
      meta: [
        { title: `${name} live feed — AutoPromo SDK` },
        {
          name: "description",
          content: `Real-time stream of promotion events generated and published for ${name}.`,
        },
        { property: "og:title", content: `${name} live feed — AutoPromo SDK` },
        {
          property: "og:description",
          content: `Watch AutoPromo generate, rank and publish posts for ${name} in real time.`,
        },
      ],
    };
  },
  component: LiveFeed,
});

/** Color-codes event type tokens so judges can scan the feed at a glance */
function eventTypeColor(type: string): string {
  if (type.startsWith("post.published")) return "text-green-300";
  if (type.startsWith("content.generated")) return "text-mint-300";
  if (type.startsWith("event.received")) return "text-amber-100";
  if (type.startsWith("strategy.reranked")) return "text-mint-400";
  if (type.startsWith("post.skipped")) return "text-olive-200";
  if (type.startsWith("sdk.")) return "text-olive-200";
  return "text-mint-300";
}

/** Short label for the event type so the payload line doesn't repeat info */
function eventLabel(type: string): string {
  const map: Record<string, string> = {
    "post.published": "published",
    "content.generated": "generated",
    "event.received": "event",
    "strategy.reranked": "reranked",
    "post.skipped": "skipped",
    "sdk.handshake": "handshake",
    "sdk.heartbeat": "heartbeat",
  };
  return map[type] ?? type;
}

function LiveFeed() {
  const { app } = Route.useLoaderData();
  const [showAll, setShowAll] = useState(false);
  const [events, setEvents] = useState<FeedEvent[]>(() =>
    feedEvents.filter((e) => e.appId === app.id),
  );
  const seq = useRef(0);

  useEffect(() => {
    setEvents(
      showAll ? [...feedEvents] : feedEvents.filter((e) => e.appId === app.id),
    );
    seq.current = 0;
    const t = setInterval(() => {
      seq.current += 1;
      // cycle through apps when showing all
      const targetApp = showAll
        ? apps[seq.current % apps.length]!.id
        : app.id;
      setEvents((prev) =>
        [nextMockEvent(targetApp, seq.current), ...prev].slice(0, 80),
      );
    }, 3500);
    return () => clearInterval(t);
  }, [app.id, showAll]);

  const appNameMap = Object.fromEntries(apps.map((a) => [a.id, a.name]));

  return (
    <div style={{ backgroundColor: "#1f1e14" }} className="min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 font-mono text-[13px]">

        {/* ── Header ── */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span
                className="ap-pulse-dot absolute inline-flex h-2 w-2 rounded-full bg-amber-200"
                aria-hidden="true"
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-200" />
            </span>
            <span className="text-amber-100">Live</span>
            <span className="text-olive-200">
              · {showAll ? "all apps" : app.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
                showAll
                  ? "border-mint-400 text-mint-200"
                  : "border-olive-400 text-olive-200 hover:border-mint-400 hover:text-mint-200"
              }`}
            >
              {showAll ? "▪ All apps" : "◦ All apps"}
            </button>
            <Link
              to="/apps/$appId"
              params={{ appId: app.id }}
              className="text-mint-200 hover:underline"
            >
              ← dashboard
            </Link>
          </div>
        </header>

        {/* ── Title ── */}
        <div className="mt-6">
          <h1 className="font-display text-xl font-bold text-mint-100">
            {showAll ? "AutoPromo — all apps" : `${app.name} promotion stream`}
          </h1>
          <p className="mt-1 text-olive-200">
            {showAll
              ? `${apps.length} apps · events emitted by the AutoPromo SDK`
              : "events emitted by the AutoPromo SDK"}
          </p>
        </div>

        {/* ── Legend ── */}
        <div className="mt-4 flex flex-wrap gap-3 border-b border-olive-500 pb-4">
          {[
            { color: "text-amber-100", label: "event.received" },
            { color: "text-mint-300", label: "content.generated" },
            { color: "text-green-300", label: "post.published" },
            { color: "text-mint-400", label: "strategy.reranked" },
            { color: "text-olive-200", label: "sdk / skipped" },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11px]">
              <span className={`${l.color} font-semibold`}>■</span>
              <span className="text-olive-200">{l.label}</span>
            </span>
          ))}
        </div>

        {/* ── Event stream ── */}
        <ul className="mt-4 space-y-0">
          {events.map((e) => {
            const isLive = e.id.startsWith("live-");
            const appName = appNameMap[e.appId];
            return (
              <li
                key={e.id}
                className={`grid gap-x-3 rounded px-2 py-1.5 ${
                  isLive ? "ap-flash" : ""
                }`}
                style={{
                  gridTemplateColumns: showAll
                    ? "auto auto minmax(0,1fr)"
                    : "auto minmax(0,1fr)",
                }}
              >
                <span className="shrink-0 tabular-nums text-olive-200">{e.ts}</span>
                {showAll && appName && (
                  <span className="shrink-0 rounded bg-olive-500 px-1.5 py-0.5 text-[10px] text-mint-200">
                    {appName}
                  </span>
                )}
                <span className="min-w-0">
                  <span className={`font-semibold ${eventTypeColor(e.type)}`}>
                    {eventLabel(e.type)}
                  </span>{" "}
                  <span className="break-words text-olive-100">{e.payload}</span>
                </span>
              </li>
            );
          })}
        </ul>

        {/* ── App switcher (when on single-app mode) ── */}
        {!showAll && (
          <div className="mt-8 border-t border-olive-500 pt-6">
            <p className="mb-3 text-[11px] text-olive-200">Switch app</p>
            <div className="flex flex-wrap gap-2">
              {apps.map((a) => (
                <Link
                  key={a.id}
                  to="/live/$appId"
                  params={{ appId: a.id }}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    a.id === app.id
                      ? "border-mint-400 text-mint-200"
                      : "border-olive-400 text-olive-200 hover:border-mint-400 hover:text-mint-200"
                  }`}
                >
                  {a.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
