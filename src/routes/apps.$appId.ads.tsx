import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, ImageIcon, Key, Eye, EyeOff, Loader2, Sparkles, Wand2, Lock, CreditCard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AdCanvas } from "@/components/AdCanvas";
import { EmptyState } from "@/components/EmptyState";
import { PaymentSandboxModal } from "@/components/PaymentSandboxModal";
import { getStoredSandboxPlan, PLANS, canUseAdStudio, type PlanTier } from "@/lib/sandboxPlan";
import { generateAd, generateGeminiImageClient, type AdFormatName, type GenerateAdResult } from "@/lib/api";
import { useApp } from "@/lib/queries";

export const Route = createFileRoute("/apps/$appId/ads")({
  head: () => ({
    meta: [
      { title: "Ad studio — AutoPromo SDK" },
      {
        name: "description",
        content:
          "Describe what you want to promote and AutoPromo generates a finished advertisement image, art-directed to match your product's audience.",
      },
    ],
  }),
  component: AdStudio,
});

const FORMATS: { name: AdFormatName; label: string; hint: string; w: number; h: number }[] = [
  { name: "square", label: "Square", hint: "Instagram · LinkedIn", w: 1080, h: 1080 },
  { name: "landscape", label: "Landscape", hint: "Twitter · Facebook", w: 1200, h: 630 },
  { name: "story", label: "Story", hint: "Instagram · TikTok", w: 1080, h: 1920 },
];

/** Prompts that give the model something concrete to work with. */
const SUGGESTIONS = [
  "We just hit 1,000 downloads",
  "Version 2.0 is out with dark mode",
  "Free for the next week",
  "Rated 4.8 by 300 users",
];

function AdStudio() {
  const { appId } = Route.useParams();
  const { data: appResult, isLoading } = useApp(appId);
  const app = appResult?.data;

  const [input, setInput] = useState("");
  const [format, setFormat] = useState<AdFormatName>("square");
  const [sandboxPlan, setSandboxPlan] = useState<PlanTier>("builder");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [result, setResult] = useState<GenerateAdResult | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setSandboxPlan(getStoredSandboxPlan());
  }, []);

  const hasAccess = canUseAdStudio(sandboxPlan);

  const handleKeyChange = (val: string) => {
    setGeminiApiKey(val);
    if (val.trim()) {
      localStorage.setItem("autopromo-gemini-api-key", val.trim());
    } else {
      localStorage.removeItem("autopromo-gemini-api-key");
    }
  };

  const generate = useMutation({
    mutationFn: async () => {
      let data: GenerateAdResult;
      try {
        data = await generateAd({ appId, input: input.trim(), format });
      } catch {
        const promptText = input.trim() || app?.description || "";
        data = {
          ok: true,
          brief: {
            headline: `${app?.name ?? "App"}: ${app?.tagline ?? "Featured App"}`,
            subline: promptText,
            badge: "FEATURED APP",
            cta: "Try Free Now",
            imagePrompt: `A commercial promotion poster for ${app?.name ?? "App"}, ${promptText}`,
            artStyle: "Modern tech showcase",
          },
          palette: {
            bgDark: "#0B132B",
            bgLight: "#1C2541",
            accent: "#48E5C2",
            text: "#FFFFFF",
            subtext: "#A3CEF1",
          },
          format: {
            name: format,
            width: format === "landscape" ? 1200 : format === "story" ? 1080 : 1080,
            height: format === "landscape" ? 630 : format === "story" ? 1920 : 1080,
          },
          image: { dataUri: null, provider: "none" },
          app: { name: app?.name ?? "App", description: app?.description ?? "" },
        };
      }

      const key = geminiApiKey.trim();
      if (key) {
        try {
          const aspect = format === "landscape" ? "16:9" : format === "story" ? "9:16" : "1:1";
          const uri = await generateGeminiImageClient(
            data.brief.imagePrompt || input || app?.description || "",
            key,
            aspect
          );
          data.image = { dataUri: uri, provider: "gemini" };
        } catch (err) {
          data.image.error = err instanceof Error ? err.message : "Gemini generation failed";
        }
      }
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.image.dataUri) {
        toast.success("Advertisement ready with Gemini AI artwork!");
      } else {
        toast.info("Advertisement poster layout ready");
      }
    },
    onError: (err: Error) => {
      toast.error("Couldn't generate the ad", {
        description: err.message || "Check network connection.",
      });
    },
  });

  const handleReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Couldn't export the image");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(app?.name ?? "ad").toLowerCase().replace(/\s+/g, "-")}-${result.format.name}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
    }, "image/png");
  }

  if (isLoading) {
    return (
      <AppShell title="Ad studio">
        <div className="h-8 w-48 animate-pulse rounded bg-mint-200 dark:bg-olive-400" />
        <div className="mt-6 h-96 animate-pulse rounded-xl border bg-surface" />
      </AppShell>
    );
  }

  if (!app) throw notFound();

  const activeFormat = FORMATS.find((f) => f.name === format)!;

  return (
    <AppShell title={`${app.name} · ads`} liveAppId={app.id}>
      <Link
        to="/apps/$appId"
        params={{ appId: app.id }}
        className="inline-flex items-center gap-1.5 text-sm text-green-400 hover:underline dark:text-mint-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to {app.name}
      </Link>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">Ad studio</h1>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
              {PLANS[sandboxPlan].badge}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-fg">
            Say what you want to promote. AutoPromo writes the copy, picks an art direction that
            fits your audience, and composes a finished image you can post anywhere.
          </p>
        </div>
      </header>

      {!hasAccess && (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-background p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">Unlock AI Ad & Poster Studio</h3>
                <p className="mt-1 text-xs text-muted-fg max-w-md">
                  Ad & Poster generation is an exclusive feature of the <strong>Builder Sandbox</strong> ($12/mo) and <strong>Agency Sandbox</strong> plans. Free Sandbox accounts are limited to text posts.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="ap-press shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600"
            >
              <CreditCard className="h-4 w-4" />
              Upgrade to Builder Sandbox ($12/mo)
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* ── Controls ── */}
        <section className="space-y-5">
          <div>
            <label htmlFor="ad-input" className="text-sm font-medium">
              What are you promoting?
            </label>
            <textarea
              id="ad-input"
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="e.g. we just passed 1,000 downloads"
              className="mt-2 w-full resize-none rounded-lg border bg-surface px-3 py-2 text-sm transition-colors hover:border-mint-400 focus:border-mint-400"
            />
            <p className="mt-1.5 text-xs text-muted-fg">
              Optional — leave blank and we'll work from your app description.
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="ap-press rounded-full border px-2.5 py-1 text-[11px] text-muted-fg transition-colors hover:border-mint-400 hover:bg-mint-100 dark:hover:bg-olive-500"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium">Format</span>
            <div className="mt-2 grid gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => setFormat(f.name)}
                  aria-pressed={format === f.name}
                  className={`ap-press flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    format === f.name
                      ? "border-green-300 bg-green-50 dark:bg-olive-500"
                      : "hover:border-mint-400 hover:bg-mint-100 dark:hover:bg-olive-500"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="shrink-0 rounded border-2 border-current opacity-40"
                    style={{
                      width: f.w > f.h ? 28 : (28 * f.w) / f.h,
                      height: f.h > f.w ? 28 : (28 * f.h) / f.w,
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{f.label}</span>
                    <span className="block text-[11px] text-muted-fg">{f.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Server environment key note */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Server API Environment
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-fg">
              Generation keys (<code className="font-mono text-emerald-600">GROQ_API_KEY</code>, <code className="font-mono text-emerald-600">IMAGE_API_KEY</code>) are securely loaded from <code className="font-mono text-emerald-600">server/.env</code>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="ap-press inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generate.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                {result ? "Generate again" : "Generate ad"}
              </>
            )}
          </button>

          {/* The art-direction reasoning, surfaced so the choice is explainable
              rather than arbitrary. */}
          {result && (
            <div className="rounded-xl border bg-surface p-4">
              <h2 className="flex items-center gap-1.5 font-display text-sm font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-green-400 dark:text-mint-300" />
                Art direction
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-fg">
                {result.brief.rationale}
              </p>
              <dl className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-fg">Vibe</dt>
                  <dd className="font-medium capitalize">{result.brief.vibe}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-fg">Artwork</dt>
                  <dd className="font-medium">
                    {result.image.dataUri ? result.image.provider : "gradient"}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </section>

        {/* ── Preview ── */}
        <section className="min-w-0">
          {result ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-fg">
                  {result.format.width} × {result.format.height}
                </p>
                <button
                  type="button"
                  onClick={download}
                  className="ap-press inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-mint-100 dark:hover:bg-olive-500"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PNG
                </button>
              </div>

              <div className="mx-auto" style={{ maxWidth: format === "story" ? 420 : "100%" }}>
                <AdCanvas
                  brief={result.brief}
                  palette={result.palette}
                  width={result.format.width}
                  height={result.format.height}
                  imageDataUri={result.image.dataUri}
                  appName={result.app.name}
                  onReady={handleReady}
                />
              </div>

              {!result.image.dataUri && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-300">
                  Rendered without AI artwork. Set{" "}
                  <code className="font-mono">IMAGE_PROVIDER</code> and{" "}
                  <code className="font-mono">IMAGE_API_KEY</code> in{" "}
                  <code className="font-mono">server/.env</code> for generated backgrounds.
                </p>
              )}
            </>
          ) : (
            <EmptyState
              icon={ImageIcon}
              title="No ad yet"
              body={`Pick a format and hit Generate. AutoPromo reads ${app.name}'s description to choose colours and style that suit its audience.`}
              action={
                <button
                  type="button"
                  onClick={() => generate.mutate()}
                  disabled={generate.isPending}
                  className="ap-press inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                >
                  <Wand2 className="h-4 w-4" />
                  Generate ad
                </button>
              }
            />
          )}
          <p className="sr-only">Preview format: {activeFormat.label}</p>
        </section>
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
