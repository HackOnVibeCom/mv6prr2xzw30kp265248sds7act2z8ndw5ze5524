import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  X,
  Wand2,
  Download,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Layout,
  CreditCard,
} from "lucide-react";
import { useApps } from "@/lib/queries";
import { AdCanvas } from "@/components/AdCanvas";
import { PaymentSandboxModal } from "@/components/PaymentSandboxModal";
import { getStoredSandboxPlan, PLANS, canUseAdStudio, type PlanTier } from "@/lib/sandboxPlan";
import { generateAd, type AdFormatName, type GenerateAdResult } from "@/lib/api";
import type { App } from "@/lib/mockData";

const GEMINI_KEY_STORAGE = "autopromo-gemini-api-key";

const FORMAT_OPTIONS: { name: AdFormatName; label: string; hint: string; icon: string; aspect: "1:1" | "16:9" | "9:16" }[] = [
  { name: "square", label: "Square (1:1)", hint: "Instagram · LinkedIn", icon: "▢", aspect: "1:1" },
  { name: "landscape", label: "Landscape (16:9)", hint: "Twitter · Facebook", icon: "▭", aspect: "16:9" },
  { name: "story", label: "Story (9:16)", hint: "Instagram · TikTok", icon: "▯", aspect: "9:16" },
];

const PRESET_PROMPTS = [
  "🚀 Version 2.0 Launch with major features",
  "⭐ Rated 4.8 by 1,000+ satisfied users",
  "🔥 10,000 active users milestone celebration",
  "⚡ Solve your daily problem in 20 seconds",
  "🎁 Limited time free offer for new users",
];

interface CreateAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAppId?: string;
}

export function CreateAdModal({ isOpen, onClose, defaultAppId }: CreateAdModalProps) {
  const { data: appsResult } = useApps();
  const apps = appsResult?.data ?? [];

  const [selectedAppId, setSelectedAppId] = useState<string>(defaultAppId || "");
  const [inputPrompt, setInputPrompt] = useState("");
  const [format, setFormat] = useState<AdFormatName>("square");
  const [sandboxPlan, setSandboxPlan] = useState<PlanTier>("builder");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [adResult, setAdResult] = useState<GenerateAdResult | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSandboxPlan(getStoredSandboxPlan());

      if (defaultAppId && apps.some((a) => a.id === defaultAppId)) {
        setSelectedAppId(defaultAppId);
      } else if (apps.length > 0 && !selectedAppId) {
        setSelectedAppId(apps[0].id);
      }
    }
  }, [isOpen, defaultAppId, apps]);

  const selectedApp: App | undefined = apps.find((a) => a.id === selectedAppId) || apps[0];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedApp) {
      toast.error("Please select an app first");
      return;
    }

    if (!canUseAdStudio(sandboxPlan)) {
      toast.info("Ad Poster Creation requires Builder Sandbox or Agency Sandbox plan", {
        action: {
          label: "Upgrade Plan",
          onClick: () => setIsPaymentModalOpen(true),
        },
      });
      setIsPaymentModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setAdResult(null);

    try {
      // 1. Get ad copy brief and palette structure from API (or generate locally)
      let result: GenerateAdResult;
      try {
        result = await generateAd({
          appId: selectedApp.id,
          input: inputPrompt.trim() || undefined,
          format,
        });
      } catch {
        // Fallback brief if backend offline
        const promptText = inputPrompt.trim() || selectedApp.description;
        result = {
          ok: true,
          brief: {
            headline: `${selectedApp.name}: ${selectedApp.tagline ?? selectedApp.name}`,
            subhead: promptText,
            badge: "FEATURED APP",
            cta: "Try Free Now",
            vibe: "bold",
            rationale: "Auto-generated fallback layout.",
            imagery: "gradient",
          },
          palette: {
            art: "gradient",
            palette: "dark",
            ink: {
              heading: "#FFFFFF",
              body: "#A3CEF1",
              accent: "#48E5C2",
              scrim: "#0B132B",
            },
            type: "bold",
          },
          format: {
            name: format,
            width: format === "landscape" ? 1200 : 1080,
            height: format === "landscape" ? 630 : format === "story" ? 1920 : 1080,
          },
          image: { dataUri: null, provider: "none" },
          app: { name: selectedApp.name, description: selectedApp.description },
        };
      }

      // 2. Perform artwork generation brief processing
      if (!result.image.dataUri) {
        toast.info("Generated ad poster layout. Configure IMAGE_API_KEY in server/.env for AI background images.");
      }

      setAdResult(result);
    } catch (err) {
      toast.error("Failed to generate advertisement", {
        description: err instanceof Error ? err.message : "Unknown error occurred",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !adResult || !selectedApp) {
      toast.error("No canvas preview available to download");
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Couldn't render blob");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedApp.name.toLowerCase().replace(/\s+/g, "-")}-ad-${format}.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded ad poster image!");
    }, "image/png");
  };

  const handleCopyPostText = async () => {
    if (!adResult || !selectedApp) return;
    const text = `${adResult.brief.headline}\n\n${adResult.brief.subhead}\n\n👉 ${adResult.brief.cta}: ${selectedApp.url}\n\n#${selectedApp.name.replace(/\s+/g, "")} #AppStore #IndieApp`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      toast.success("Social copy copied to clipboard!");
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      toast.error("Could not copy text");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-mint-500/20 bg-background/95 p-6 shadow-2xl backdrop-blur-xl dark:bg-zinc-950/95"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">AI Ad & Poster Generator</h2>
              <p className="text-xs text-muted-fg">Create high-converting promotional assets with Gemini AI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-fg hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Controls Form */}
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* App Selection */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
                Select App
              </label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border bg-surface px-3 py-2 text-sm font-medium focus:border-emerald-500 focus:outline-none"
              >
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name} {app.isDemo ? "(Demo)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
                Promotion Prompt
              </label>
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="What are you promoting? e.g. 1,000 downloads milestone or new version update..."
                rows={3}
                className="mt-1.5 w-full resize-none rounded-lg border bg-surface p-3 text-sm focus:border-emerald-500 focus:outline-none"
              />
              {/* Preset suggestion pills */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESET_PROMPTS.map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => setInputPrompt(promptText)}
                    className="rounded-full border border-mint-500/20 bg-mint-50/50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-mint-100 dark:bg-emerald-950/30 dark:text-emerald-300"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selector */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
                Ad Aspect Ratio
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setFormat(f.name)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
                      format === f.name
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-sm"
                        : "border-border bg-surface text-muted-fg hover:border-muted-fg"
                    }`}
                  >
                    <span className="text-lg font-bold">{f.icon}</span>
                    <span className="mt-1 text-xs font-semibold">{f.label.split(" ")[0]}</span>
                    <span className="text-[10px] opacity-75">{f.aspect}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Security note */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Server Environment Generation
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-fg">
                All AI prompts and background artwork are processed securely via environment variables configured in <code className="font-mono text-emerald-600">server/.env</code>.
              </p>
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="ap-press flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Poster...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generate Ad Poster
                </>
              )}
            </button>
          </form>

          {/* Ad Preview & Export Area */}
          <div className="flex flex-col items-center justify-center rounded-xl border bg-zinc-950/50 p-4 text-center dark:bg-zinc-900/50 min-h-[380px]">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Sparkles className="h-8 w-8 animate-pulse" />
                  <div className="absolute inset-0 animate-ping rounded-2xl border border-emerald-500/50" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-semibold">Crafting Visuals with Gemini AI</h4>
                  <p className="text-xs text-muted-fg mt-1">Applying typography, color palette, and poster layout...</p>
                </div>
              </div>
            ) : adResult ? (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="max-w-full overflow-hidden rounded-xl border shadow-xl">
                  <AdCanvas
                    brief={adResult.brief}
                    palette={adResult.palette}
                    width={adResult.format.width}
                    height={adResult.format.height}
                    imageDataUri={adResult.image.dataUri}
                    appName={adResult.app.name}
                    onReady={(canvas) => {
                      canvasRef.current = canvas;
                    }}
                  />
                </div>

                {/* Poster Action Bar */}
                <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="ap-press inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PNG
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPostText}
                    className="ap-press inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3.5 py-2 text-xs font-semibold hover:bg-muted"
                  >
                    {copiedText ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy Social Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    className="ap-press inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3.5 py-2 text-xs font-semibold text-muted-fg hover:text-foreground"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Re-roll
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-fg py-12">
                <Layout className="h-10 w-10 opacity-30" />
                <h4 className="font-display text-sm font-semibold text-foreground">Poster Preview</h4>
                <p className="max-w-xs text-xs">
                  Fill in the prompt details and click <strong>Generate Ad Poster</strong> to create instant promotional assets.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <PaymentSandboxModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={sandboxPlan}
        onPlanChanged={(newPlan) => setSandboxPlan(newPlan)}
      />
    </div>
  );
}
