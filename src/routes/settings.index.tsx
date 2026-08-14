import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Eye, EyeOff, ExternalLink, CreditCard, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FallbackNotice } from "@/components/ConnectionBadge";
import { PaymentSandboxModal } from "@/components/PaymentSandboxModal";
import { getStoredSandboxPlan, PLANS, type PlanTier } from "@/lib/sandboxPlan";
import { useDataSource } from "@/lib/dataSource";
import { useApps } from "@/lib/queries";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings — AutoPromo SDK" },
      {
        name: "description",
        content:
          "API keys per connected app, backend connection status, and the environment variables the AutoPromo server needs.",
      },
      { property: "og:title", content: "Settings — AutoPromo SDK" },
      {
        property: "og:description",
        content: "Manage API keys and check your AutoPromo backend connection.",
      },
    ],
  }),
  component: SettingsPage,
});

const ENV_VARS: { name: string; where: string; secret: boolean }[] = [
  { name: "AGENTROUTER_API_KEY", where: "agentrouter.org/console/topup → API Keys", secret: true },
  { name: "LLM_MODEL", where: "Model selection (e.g. gpt-4o-mini, claude-3-5-sonnet)", secret: false },
  { name: "GROQ_API_KEY", where: "console.groq.com → API Keys", secret: true },
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    where: "Supabase → Settings → API",
    secret: false,
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    where: "Supabase → Settings → API",
    secret: true,
  },
  {
    name: "DISCORD_WEBHOOK_URL",
    where: "Discord → channel → Integrations → Webhooks",
    secret: true,
  },
];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — select the text instead");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="ap-press inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-muted-fg hover:bg-mint-100 dark:hover:bg-olive-500"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ApiKeyRow({ name, apiKey, appId }: { name: string; apiKey: string; appId: string }) {
  const [revealed, setRevealed] = useState(false);
  const masked = `${apiKey.slice(0, 8)}${"•".repeat(Math.max(apiKey.length - 8, 0))}`;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border bg-surface p-4">
      <div className="min-w-0 flex-1">
        <Link
          to="/apps/$appId"
          params={{ appId }}
          className="font-display text-sm font-semibold hover:underline"
        >
          {name}
        </Link>
        <p className="mt-1 truncate font-mono text-[11px] text-muted-fg">
          {revealed ? apiKey : masked}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? `Hide ${name} API key` : `Reveal ${name} API key`}
        className="ap-press inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-muted-fg hover:bg-mint-100 dark:hover:bg-olive-500"
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <CopyButton value={apiKey} label={`${name} API key`} />
    </li>
  );
}

function SettingsPage() {
  const { status, apiBaseUrl, retry } = useDataSource();
  const { data: appsResult } = useApps();
  const apps = appsResult?.data ?? [];

  const [sandboxPlan, setSandboxPlan] = useState<PlanTier>("builder");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    setSandboxPlan(getStoredSandboxPlan());
  }, []);

  const plan = PLANS[sandboxPlan];

  return (
    <AppShell title="Settings">
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-fg">
        Subscription plan, connection status, per-app API keys, and environment configuration.
      </p>

      <FallbackNotice className="mt-4" />

      {/* ── Sandbox Subscription ── */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Subscription & Billing (Sandbox)</h2>
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold">{plan.name}</span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                  {plan.price}{plan.period}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-fg">
                Monthly AI Post Limit: <strong className="text-foreground">{plan.postsLimit === 999999 ? "Unlimited" : plan.postsLimit}</strong> · App Limit: <strong className="text-foreground">{plan.appsLimit}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="ap-press inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-teal-600"
            >
              <CreditCard className="h-4 w-4" />
              Manage Sandbox Plan
            </button>
          </div>

          <div className="mt-4 border-t pt-4">
            <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider">Unlocked Sandbox Features</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {plan.features.map((feat) => (
                <span
                  key={feat}
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-surface px-2.5 py-1 text-xs font-medium"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  {feat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Connection ── */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Backend connection</h2>
        <div className="mt-3 rounded-xl border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {status === "live"
                  ? "Connected"
                  : status === "checking"
                    ? "Checking…"
                    : "Not reachable"}
              </p>
              <p className="mt-1 truncate font-mono text-[11px] text-muted-fg">{apiBaseUrl}</p>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                status === "live"
                  ? "bg-green-50 text-green-500 dark:bg-olive-500 dark:text-mint-200"
                  : status === "checking"
                    ? "bg-mint-100 text-muted-fg dark:bg-olive-500"
                    : "bg-amber-50 text-amber-300"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === "live"
                    ? "bg-green-300"
                    : status === "checking"
                      ? "bg-olive-200"
                      : "bg-amber-200"
                }`}
              />
              {status === "live" ? "Live" : status === "checking" ? "Checking" : "Offline"}
            </span>
          </div>

          {status === "offline" && (
            <div className="mt-4 rounded-lg bg-mint-50 p-3 dark:bg-olive-500">
              <p className="text-xs text-muted-fg">Start the API server, then retry:</p>
              <pre className="mt-2 overflow-x-auto font-mono text-[11px]">
                <code>cd server && npm install && npm run dev</code>
              </pre>
              <button
                type="button"
                onClick={retry}
                className="ap-press mt-3 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-mint-100 dark:hover:bg-olive-400"
              >
                Retry connection
              </button>
            </div>
          )}

          <p className="mt-4 text-xs text-muted-fg">
            Override the URL with <code className="font-mono">VITE_API_URL</code> in a{" "}
            <code className="font-mono">.env</code> file at the project root.
          </p>
        </div>
      </section>

      {/* ── API keys ── */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">App API keys</h2>
        <p className="mt-1 text-sm text-muted-fg">
          One key per connected app. Pass it to{" "}
          <code className="rounded bg-mint-100 px-1 font-mono text-xs dark:bg-olive-500">
            AutoPromo.init()
          </code>{" "}
          in the host app.
        </p>
        {apps.length === 0 ? (
          <p className="mt-3 text-sm text-muted-fg">No apps connected yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {apps.map((a) => (
              <ApiKeyRow key={a.id} name={a.name} apiKey={a.apiKey} appId={a.id} />
            ))}
          </ul>
        )}
      </section>

      {/* ── Environment ── */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Backend environment</h2>
        <p className="mt-1 text-sm text-muted-fg">
          These live in <code className="font-mono">server/.env</code> — never in the frontend
          bundle, and never committed.
        </p>

        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-300">Where do API keys go?</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-fg">
            In <code className="font-mono">server/.env</code> only — never in localStorage or a{" "}
            <code className="font-mono">VITE_</code> variable. Vite compiles those into the public
            JavaScript bundle, so anything the browser can read, a visitor can read. The keys below
            never leave the server, which is the only component that talks to Supabase and Groq. The
            server validates them at boot and refuses to start if one is missing or malformed.
          </p>
        </div>

        <ul className="mt-3 space-y-2">
          {ENV_VARS.map((v) => (
            <li
              key={v.name}
              className="flex flex-wrap items-center gap-3 rounded-xl border bg-surface p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-mono text-xs font-medium">
                  {v.name}
                  {v.secret && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      server only
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[11px] text-muted-fg">{v.where}</p>
              </div>
              <CopyButton value={v.name} label={v.name} />
            </li>
          ))}
        </ul>
      </section>

      {/* ── Links ── */}
      <section className="mt-8 rounded-xl border bg-mint-50 p-5 dark:bg-olive-500">
        <h2 className="font-display text-base font-semibold">Set-up checklist</h2>
        <ol className="mt-3 space-y-2 text-sm text-muted-fg">
          <li>
            1. Run <code className="font-mono text-xs">server/supabase-schema.sql</code> in the
            Supabase SQL editor.
          </li>
          <li>
            2. Copy <code className="font-mono text-xs">server/.env.example</code> to{" "}
            <code className="font-mono text-xs">server/.env</code> and fill it in.
          </li>
          <li>
            3. Start the API with{" "}
            <code className="font-mono text-xs">cd server &amp;&amp; npm run dev</code>.
          </li>
          <li>
            4. Register an app, then drop its ID into the SDK —{" "}
            <Link to="/docs" className="text-green-400 hover:underline dark:text-mint-300">
              integration guide
            </Link>
            .
          </li>
        </ol>
        <a
          href="https://console.groq.com"
          target="_blank"
          rel="noopener noreferrer"
          className="ap-press mt-4 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-mint-100 dark:hover:bg-olive-400"
        >
          Groq console
          <ExternalLink className="h-3 w-3" />
        </a>
      </section>
      <PaymentSandboxModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={sandboxPlan}
        onPlanChanged={(newPlan) => setSandboxPlan(newPlan)}
      />
    </AppShell>
  );
}
