import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { apps } from "@/lib/mockData";

export const Route = createFileRoute("/apps/")({
  head: () => ({
    meta: [
      { title: "Connected apps — AutoPromo SDK" },
      { name: "description", content: "Every mobile app connected to AutoPromo, plus onboarding for a new one." },
      { property: "og:title", content: "Connected apps — AutoPromo SDK" },
      { property: "og:description", content: "Manage the apps sending product events to AutoPromo." },
    ],
  }),
  component: AppsPage,
});

function AppsPage() {
  const [adding, setAdding] = useState(false);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12">
      <Link
        to="/"
        className="text-sm font-medium text-green-500 hover:underline dark:text-mint-200"
      >
        ← AutoPromo SDK
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold">Connected apps</h1>
      <p className="mt-2 text-sm text-muted-fg">
        Each app sends product events through the SDK. Pick one to see its generated posts.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <Link
            key={app.id}
            to="/apps/$appId"
            params={{ appId: app.id }}
            className="ap-enter rounded-xl border bg-surface p-5 transition-colors hover:border-mint-400"
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  app.status === "active" ? "bg-green-300" : "bg-mint-300"
                }`}
                aria-hidden="true"
              />
              <h2 className="truncate font-display text-base font-semibold">{app.name}</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-fg">{app.description}</p>
            <p className="mt-3 font-mono text-[11px] text-olive-300 dark:text-olive-200">
              {app.status}
            </p>
          </Link>
        ))}

        <div className="rounded-xl border-2 border-dashed border-mint-300 bg-mint-50 p-5 dark:border-olive-400 dark:bg-olive-500">
          {adding ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setAdding(false);
              }}
            >
              <input
                required
                placeholder="App name"
                className="rounded-lg border bg-surface px-3 py-2 text-sm"
              />
              <input
                placeholder="One-line description"
                className="rounded-lg border bg-surface px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="ap-press rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
              >
                Connect app
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex h-full w-full flex-col items-start gap-2 text-left"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-mint-100 text-lg font-bold text-green-400 dark:bg-olive-400 dark:text-mint-200">
                +
              </span>
              <span className="font-display text-base font-semibold">Add new app</span>
              <span className="text-sm text-muted-fg">
                Drop the SDK in, send your first event, watch posts appear here.
              </span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
