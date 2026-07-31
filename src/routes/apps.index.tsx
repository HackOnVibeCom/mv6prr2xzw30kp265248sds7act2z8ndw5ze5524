import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { apps, totals } from "@/lib/mockData";

export const Route = createFileRoute("/apps/")({
  head: () => ({
    meta: [
      { title: "Connected apps — AutoPromo SDK" },
      {
        name: "description",
        content: "Every mobile app connected to AutoPromo, plus onboarding for a new one.",
      },
      { property: "og:title", content: "Connected apps — AutoPromo SDK" },
      { property: "og:description", content: "Manage the apps sending product events to AutoPromo." },
    ],
  }),
  component: AppsPage,
});

function ApiKeyCell({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast.success("API key copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy");
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        copy();
      }}
      className="ap-press flex items-center gap-1.5 rounded bg-mint-50 px-2 py-1 font-mono text-[10px] text-muted-fg hover:bg-mint-100 dark:bg-olive-500 dark:hover:bg-olive-400"
      title="Copy API key"
    >
      <span className="max-w-[100px] truncate">{apiKey}</span>
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function AppsPage() {
  const [adding, setAdding] = useState(false);

  return (
    <AppShell title="Connected apps">
      <h1 className="font-display text-3xl font-bold">Connected apps</h1>
      <p className="mt-2 text-sm text-muted-fg">
        Each app sends product events through the SDK. Pick one to see its generated posts.
      </p>

      {/* ── Rollup stats ── */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Apps connected", value: totals.apps },
          { label: "Posts generated", value: totals.generated },
          { label: "Posts published", value: totals.published },
          { label: "Total installs", value: totals.installs.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-surface p-4">
            <p className="font-display text-xl font-bold">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted-fg">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── App grid ── */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {apps.map((app) => (
          <Link
            key={app.id}
            to="/apps/$appId"
            params={{ appId: app.id }}
            className="ap-enter group flex flex-col rounded-xl border bg-surface p-5 transition-colors hover:border-mint-400"
          >
            {/* App name + status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    app.status === "active"
                      ? "bg-green-300"
                      : app.status === "idle"
                        ? "bg-olive-200"
                        : "bg-amber-200"
                  }`}
                  aria-hidden="true"
                />
                <h2 className="truncate font-display text-base font-semibold">{app.name}</h2>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
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

            {/* Tagline */}
            <p className="mt-1 text-xs font-medium text-green-400 dark:text-mint-300">
              {app.tagline}
            </p>

            {/* Description */}
            <p className="mt-2 text-sm leading-relaxed text-muted-fg line-clamp-2">
              {app.description}
            </p>

            {/* Stats */}
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["Installs", app.installs.toLocaleString()],
                ["Generated", app.postsGenerated],
                ["Published", app.postsPublished],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-lg bg-mint-50 py-2 dark:bg-olive-500">
                  <dd className="font-display text-sm font-semibold">{v}</dd>
                  <dt className="text-[10px] text-muted-fg">{k}</dt>
                </div>
              ))}
            </dl>

            {/* SDK info + API key */}
            <div className="mt-3 flex items-center justify-between">
              <p className="font-mono text-[10px] text-olive-300 dark:text-olive-200">
                sdk {app.sdkVersion} · {app.platform}
              </p>
              <ApiKeyCell apiKey={app.apiKey} />
            </div>
          </Link>
        ))}

        {/* Add new app card */}
        <div className="rounded-xl border-2 border-dashed border-mint-300 bg-mint-50 p-5 dark:border-olive-400 dark:bg-olive-500">
          {adding ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setAdding(false);
                toast.success("App connected", {
                  description: "Drop the SDK in and send an event.",
                });
              }}
            >
              <input
                required
                placeholder="App name"
                className="rounded-lg border bg-surface px-3 py-2 text-sm"
              />
              <input
                placeholder="One-line tagline"
                className="rounded-lg border bg-surface px-3 py-2 text-sm"
              />
              <input
                placeholder="One-line description"
                className="rounded-lg border bg-surface px-3 py-2 text-sm"
              />
              <input
                placeholder="https://yourapp.com"
                className="rounded-lg border bg-surface px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="ap-press rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
                >
                  Connect app
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
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
              <span className="mt-2 font-mono text-[10px] text-muted-fg">
                npm install @autopromo/sdk
              </span>
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
