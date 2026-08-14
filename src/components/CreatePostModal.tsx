import { useState } from "react";
import { Sparkles, X, Check, Send, RefreshCw, Layers } from "lucide-react";
import { toast } from "sonner";
import { PlatformIcon } from "@/components/PlatformIcon";
import { useTrackEvent } from "@/lib/queries";
import type { ApiEventType, ApiPlatform, ApiTone } from "@/lib/apiTypes";
import type { Platform } from "@/lib/mockData";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  appName: string;
}

const PLATFORMS: { id: ApiPlatform; platformKey: Platform; label: string; color: string }[] = [
  { id: "twitter", platformKey: "Twitter", label: "Twitter / X", color: "text-[#1D9BF0]" },
  { id: "linkedin", platformKey: "LinkedIn", label: "LinkedIn", color: "text-[#0A66C2]" },
  { id: "reddit", platformKey: "Reddit", label: "Reddit", color: "text-[#FF4500]" },
  { id: "whatsapp", platformKey: "WhatsApp", label: "WhatsApp", color: "text-[#25D366]" },
  { id: "telegram", platformKey: "Telegram", label: "Telegram", color: "text-[#229ED9]" },
  { id: "facebook", platformKey: "Facebook", label: "Facebook", color: "text-[#1877F2]" },
];

const EVENT_TYPES: { id: ApiEventType; label: string; desc: string }[] = [
  { id: "new_version", label: "New Release / Version", desc: "Announce new features, speedups & bug fixes" },
  { id: "launch", label: "Product Launch", desc: "Showcase your app launch to early adopters" },
  { id: "milestone", label: "Milestone", desc: "Celebrate downloads, revenue or user goals" },
  { id: "new_review", label: "5★ Review Spotlight", desc: "Turn user reviews into social proof" },
];

export function CreatePostModal({ isOpen, onClose, appId, appName }: CreatePostModalProps) {
  const [eventType, setEventType] = useState<ApiEventType>("new_version");
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<ApiPlatform[]>([
    "twitter",
    "linkedin",
    "reddit",
    "whatsapp",
    "telegram",
    "facebook",
  ]);
  const [tone, setTone] = useState<ApiTone>("casual");

  const trackEventMutation = useTrackEvent(appId);

  if (!isOpen) return null;

  const togglePlatform = (id: ApiPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((p) => p !== id)
          : prev
        : [...prev, id]
    );
  };

  const selectAllPlatforms = () => {
    setSelectedPlatforms(["twitter", "linkedin", "reddit", "whatsapp", "telegram", "facebook"]);
  };

  const applyTemplate = (text: string) => {
    setCustomPrompt(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customPrompt.trim()) {
      toast.error("Please enter your update notes or prompt.");
      return;
    }

    try {
      await trackEventMutation.mutateAsync({
        type: eventType,
        payload: {
          prompt: customPrompt.trim(),
          details: customPrompt.trim(),
          targetPlatforms: selectedPlatforms,
          tone,
        },
      });

      toast.success("AI Post & Thread Generation Complete!", {
        description: `Generated posts across ${selectedPlatforms.length} social platforms!`,
      });
      onClose();
    } catch (err) {
      toast.error("Failed to generate posts. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-xl max-h-[85vh] overflow-hidden rounded-2xl border bg-background shadow-2xl">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-100 text-green-500 dark:bg-olive-400 dark:text-mint-200">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold">Generate AI Posts & Threads</h2>
              <p className="text-[11px] text-muted-fg">Create custom promotional posts for <span className="font-semibold text-foreground">{appName}</span></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick Preset Chips */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-fg">
                1. What are you promoting? <span className="text-green-500">*</span>
              </label>
              <span className="font-mono text-[10px] text-muted-fg">{customPrompt.length} chars</span>
            </div>

            {/* Template Chips */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyTemplate(`We just shipped ${appName} v2.0 with Dark Mode, 50% faster loading speeds, and automated export!`)}
                className="rounded-md border bg-surface px-2 py-1 text-[11px] font-medium text-muted-fg hover:border-mint-300 hover:text-foreground"
              >
                🚀 Major V2.0 Release
              </button>
              <button
                type="button"
                onClick={() => applyTemplate(`We just hit 10,000 active users on ${appName}! Huge thanks to everyone supporting our journey.`)}
                className="rounded-md border bg-surface px-2 py-1 text-[11px] font-medium text-muted-fg hover:border-mint-300 hover:text-foreground"
              >
                ⚡ 10k Users Milestone
              </button>
              <button
                type="button"
                onClick={() => applyTemplate(`"Best app I've used this year!" — Check out how ${appName} is helping people streamline their workflow.`)}
                className="rounded-md border bg-surface px-2 py-1 text-[11px] font-medium text-muted-fg hover:border-mint-300 hover:text-foreground"
              >
                ⭐ 5-Star Review Highlight
              </button>
            </div>

            <textarea
              required
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. We just released v2.0 with Dark Mode, 50% faster load speeds, and automated PDF export! Try it free at https://focusflow.app"
              className="mt-2 w-full rounded-xl border bg-surface p-3 text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Event Type Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-fg">
              2. Select Event Type:
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {EVENT_TYPES.map((et) => (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => setEventType(et.id)}
                  className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                    eventType === et.id
                      ? "border-mint-400 bg-mint-100 text-green-500 dark:bg-olive-500 dark:text-mint-200 font-semibold"
                      : "border-border bg-surface text-muted-fg hover:border-mint-300"
                  }`}
                >
                  <span className="text-xs font-bold">{et.label}</span>
                  <span className="mt-0.5 text-[10px] text-muted-fg">{et.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Social Platforms with Official SVG Logos */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-fg">
                3. Target Social Platforms ({selectedPlatforms.length}/6):
              </label>
              <button
                type="button"
                onClick={selectAllPlatforms}
                className="text-[10px] font-bold text-green-500 hover:underline"
              >
                Select All
              </button>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              {PLATFORMS.map((p) => {
                const isSelected = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`ap-press flex items-center justify-between rounded-xl border p-2.5 text-xs font-medium transition-all ${
                      isSelected
                        ? "border-mint-400 bg-mint-100 text-green-500 dark:bg-olive-500 dark:text-mint-200 font-bold"
                        : "border-border bg-surface text-muted-fg hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={p.color}>
                        <PlatformIcon platform={p.platformKey} className="h-4 w-4" />
                      </span>
                      <span>{p.label}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-green-500 dark:text-mint-300" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-fg">
              4. Tone of Voice:
            </label>
            <div className="mt-2 flex gap-2">
              {(["casual", "professional"] as ApiTone[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold capitalize transition-all ${
                    tone === t
                      ? "border-mint-400 bg-mint-100 text-green-500 dark:bg-olive-500 dark:text-mint-200"
                      : "border-border bg-surface text-muted-fg hover:bg-muted"
                  }`}
                >
                  {t === "casual" ? "🔥 Casual & Viral" : "💼 Professional & Clear"}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between border-t bg-background px-5 py-3">
          <span className="text-[11px] text-muted-fg">
            Generating <strong className="text-foreground">{selectedPlatforms.length * 2} posts</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-3.5 py-1.5 text-xs font-medium text-muted-fg hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={trackEventMutation.isPending}
              className="ap-press inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {trackEventMutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Generating AI Posts...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-mint-300" />
                  Generate Posts & Threads
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
