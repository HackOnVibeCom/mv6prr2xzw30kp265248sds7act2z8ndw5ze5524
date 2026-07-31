import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { feedEvents, getApp, nextMockEvent, type FeedEvent } from "@/lib/mockData";

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

function LiveFeed() {
  const { app } = Route.useLoaderData();
  const [events, setEvents] = useState<FeedEvent[]>(() =>
    feedEvents.filter((e) => e.appId === app.id),
  );
  const seq = useRef(0);

  useEffect(() => {
    setEvents(feedEvents.filter((e) => e.appId === app.id));
    seq.current = 0;
    const t = setInterval(() => {
      seq.current += 1;
      setEvents((prev) => [nextMockEvent(app.id, seq.current), ...prev].slice(0, 60));
    }, 4000);
    return () => clearInterval(t);
  }, [app.id]);

  return (
    <div style={{ backgroundColor: "#1f1e14" }} className="min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 font-mono text-[13px]">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className="ap-pulse-dot absolute inline-flex h-2 w-2 rounded-full bg-amber-200"
                aria-hidden="true"
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-200" />
            </span>
            <span className="text-amber-100">Live</span>
            <span className="text-olive-200">· {app.name}</span>
          </div>
          <Link
            to="/apps/$appId"
            params={{ appId: app.id }}
            className="text-mint-200 hover:underline"
          >
            ← dashboard
          </Link>
        </header>

        <h1 className="mt-6 font-display text-xl font-bold text-mint-100">
          {app.name} promotion stream
        </h1>
        <p className="mt-1 text-olive-200">events emitted by the AutoPromo SDK</p>

        <ul className="mt-6 divide-y divide-olive-500">
          {events.map((e) => (
            <li
              key={e.id}
              className={`grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded px-2 py-2 ${
                e.id.startsWith("live-") ? "ap-flash" : ""
              }`}
            >
              <span className="shrink-0 text-olive-200">{e.ts}</span>
              <span className="min-w-0">
                <span className="text-mint-300">{e.type}</span>{" "}
                <span className="break-words text-mint-100">{e.payload}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
