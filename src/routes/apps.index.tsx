import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Loader2,
  LayoutGrid,
  Sparkles,
  Send,
  Download,
  Plus,
  Lock,
  CreditCard,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FallbackNotice } from "@/components/ConnectionBadge";
import { StatTile, StatRow } from "@/components/StatTile";
import { PaymentSandboxModal } from "@/components/PaymentSandboxModal";
import { getStoredSandboxPlan, PLANS, canAddApp, type PlanTier } from "@/lib/sandboxPlan";
import { useApps, useCreateApp } from "@/lib/queries";

export const Route = createFileRoute("/apps/")({
  head: () => ({
    meta: [
      { title: "Connected apps — AutoPromo SDK" },
      {
        name: "description",
        content: "Every mobile app connected to AutoPromo, plus onboarding for a new one.",
      },
      { property: "og:title", content: "Connected apps — AutoPromo SDK" },
      {
        property: "og:description",
        content: "Manage the apps sending product events to AutoPromo.",
      },
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
  const [form, setForm] = useState({ name: "", description: "" });
  const [sandboxPlan, setSandboxPlan] = useState<PlanTier>("builder");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setSandboxPlan(getStoredSandboxPlan());
  }, []);

  const { data: appsResult, isLoading } = useApps();
  const createApp = useCreateApp();

  const apps = appsResult?.data ?? [];
  const realApps = apps.filter((a) => !a.isDemo);
  const demoApps = apps.filter((a) => a.isDemo);

  const canAdd = canAddApp(sandboxPlan, realApps.length);

  const handleConnectClick = () => {
    if (!canAdd) {
      toast.info(`App limit reached for ${PLANS[sandboxPlan].name}`, {
        description: `Your ${PLANS[sandboxPlan].name} plan allows up to ${PLANS[sandboxPlan].appsLimit} connected app(s). Upgrade your Sandbox plan to connect more apps.`,
        action: {
          label: "Upgrade Plan",
          onClick: () => setIsPaymentModalOpen(true),
        },
      });
      setIsPaymentModalOpen(true);
      return;
    }
    setAdding(true);
  };

  // Rollups cover the user's own apps only. Folding demo sample numbers into a
  // headline total would overstate what the workspace has actually done.
  const totals = {
    apps: realApps.length,
    generated: realApps.reduce((n, a) => n + a.postsGenerated, 0),
    published: realApps.reduce((n, a) => n + a.postsPublished, 0),
    installs: realApps.reduce((n, a) => n + a.installs, 0),
  };

  const activeCount = realApps.filter((a) => a.status === "active").length;
  const publishRate =
    totals.generated > 0 ? Math.round((totals.published / totals.generated) * 100) : 0;

  /** Rollup tiles only earn their space once there's something to roll up. */
  const hasActivity = totals.generated > 0 || totals.installs > 0;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name || createApp.isPending) return;

    if (!canAdd) {
      setIsPaymentModalOpen(true);
      return;
    }

    try {
      const created = await createApp.mutateAsync({
        name,
        description: form.description.trim() || name,
      });

      setForm({ name: "", description: "" });

      toast.success(`${created.name} connected`, {
        description: "Drop the SDK in and send your first event.",
        action: {
          label: "Open",
          onClick: () =>
            void router.navigate({ to: "/apps/$appId", params: { appId: created.id } }),
        },
      });
    } catch (err) {
      toast.error("Couldn't create the app", {
        description:
          err instanceof Error ? err.message : "Check that the API server in server/ is running.",
      });
    }
  }

  return (
    <AppShell title="Connected apps">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold">Connected apps</h1>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
              {PLANS[sandboxPlan].badge}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-fg">
            Each app sends product events through the SDK. Pick one to see its generated posts.
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={handleConnectClick}
            className="ap-press inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {canAdd ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4 text-emerald-300" />}
            {canAdd ? "Connect an app" : `Connect an app (${PLANS[sandboxPlan].appsLimit} Limit)`}
          </button>
        )}
      </header>

      <FallbackNotice className="mt-4" />

      {/* Rollup stats. Four zeroes tell nobody anything — until something has
          actually been generated, the space is better spent on the next step. */}
      {hasActivity && (
        <div className="mt-6">
          <StatRow>
            <StatTile
              icon={LayoutGrid}
              label="Apps connected"
              value={totals.apps}
              hint={`${activeCount} active`}
              loading={isLoading}
            />
            <StatTile
              icon={Sparkles}
              label="Posts generated"
              value={totals.generated}
              hint="across all apps"
              loading={isLoading}
            />
            <StatTile
              icon={Send}
              label="Posts published"
              value={totals.published}
              hint={totals.generated > 0 ? `${publishRate}% of generated` : "none yet"}
              emphasis={totals.published > 0}
              loading={isLoading}
            />
            <StatTile
              icon={Download}
              label="Total installs"
              value={totals.installs.toLocaleString()}
              hint="lifetime, all stores"
              loading={isLoading}
            />
          </StatRow>
        </div>
      )}

      {/* ── App grid ── */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading &&
          Array.from({ length: 3 }, (_, i) => (
            <div
              key={`skeleton-${i}`}
              aria-hidden="true"
              className="h-56 animate-pulse rounded-xl border bg-surface"
            />
          ))}

        {apps.map((app) => (
          <Link
            key={app.id}
            to="/apps/$appId"
            params={{ appId: app.id }}
            className="ap-enter group flex flex-col rounded-xl border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-mint-400 hover:shadow-md dark:hover:border-olive-300"
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
              <div className="flex shrink-0 items-center gap-1.5">
                {app.isDemo && (
                  <span
                    title="Bundled showcase app — its metrics are sample data"
                    className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-300"
                  >
                    demo
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
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
            </div>

            {/* Tagline — omitted when it would repeat the description */}
            {app.tagline && (
              <p className="mt-1 text-xs font-medium text-green-400 dark:text-mint-300">
                {app.tagline}
              </p>
            )}

            {/* Description */}
            <p className="mt-2 text-sm leading-relaxed text-muted-fg line-clamp-2">
              {app.description}
            </p>

            {/* Stats — a card with nothing to report says what to do instead
                of showing three zeroes. */}
            {app.postsGenerated === 0 && app.installs === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed px-3 py-2.5 text-xs text-muted-fg">
                No events received yet — fire one from the dashboard to generate your first
                posts.
              </p>
            ) : (
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ["Installs", app.installs > 0 ? app.installs.toLocaleString() : "—"],
                  ["Generated", app.postsGenerated],
                  ["Published", app.postsPublished],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg bg-mint-50 py-2 dark:bg-olive-500">
                    <dd className="font-display text-sm font-semibold tabular-nums">{v}</dd>
                    <dt className="text-[10px] text-muted-fg">{k}</dt>
                  </div>
                ))}
              </dl>
            )}

            {/* SDK info + API key */}
            <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 mt-4">
              <p className="truncate font-mono text-[10px] text-olive-300 dark:text-olive-200">
                sdk {app.sdkVersion} · {app.platform}
              </p>
              <ApiKeyCell apiKey={app.apiKey} />
            </div>
          </Link>
        ))}

        {/* Add new app card */}
        <div className="rounded-xl border-2 border-dashed border-mint-300 bg-mint-50 p-5 dark:border-olive-400 dark:bg-olive-500">
          {adding ? (
            <form className="flex flex-col gap-3" onSubmit={handleCreate}>
              <label className="sr-only" htmlFor="new-app-name">
                App name
              </label>
              <input
                id="new-app-name"
                required
                autoFocus
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="App name"
                className="rounded-lg border bg-surface px-3 py-2 text-sm"
              />
              <label className="sr-only" htmlFor="new-app-description">
                Description
              </label>
              <textarea
                id="new-app-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What does it do? The AI uses this to write your posts."
                className="resize-none rounded-lg border bg-surface px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createApp.isPending || !form.name.trim()}
                  className="ap-press inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                >
                  {createApp.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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
      <PaymentSandboxModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={sandboxPlan}
        onPlanChanged={(newPlan) => setSandboxPlan(newPlan)}
      />
    </AppShell>
  );
}
