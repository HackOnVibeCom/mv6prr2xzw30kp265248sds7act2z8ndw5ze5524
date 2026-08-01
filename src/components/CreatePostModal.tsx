import { useState } from "react";
import { Sparkles, X, Check, Send, Rocket, MessageSquare, Code, Star, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTrackEvent } from "@/lib/queries";
import type { ApiEventType, ApiPlatform, ApiTone } from "@/lib/apiTypes";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  appName: string;
}

const PLATFORMS: { id: ApiPlatform; label: string; icon: string }[] = [
  { id: "twitter", label: "Twitter / X", icon: "🐦" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "reddit", label: "Reddit", icon: "🔴" },
  { id: "whatsapp", label: "WhatsApp", icon: "🟢" },
  { id: "telegram", label: "Telegram", icon: "✈️" },
  { id: "facebook", label: "Facebook", icon: "📘" },
];

const EVENT_TYPES: { id: ApiEventType; label: string; desc: string }[] = [
  { id: "launch", label: "Product Launch", desc: "Showcase your app launch to early adopters" },
  { id: "milestone", label: "Milestone", desc: "Celebrate 1k downloads, revenue or user goals" },
  { id: "new_version", label: "New Release / Version", desc: "Announce new features, speedups & bug fixes" },
  { id: "new_review", label: "5★ Review Spotlight", desc: "Turn user reviews into high-converting proof" },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customPrompt.trim()) {
      toast.error("Please enter a short description or prompt for your update.");
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
        description: `Generated custom posts across ${selectedPlatforms.length} social platforms!`,
      });
      onClose();
    } catch (err) {
      toast.error("Failed to generate posts. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border bg-background p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint-100 text-green-500 dark:bg-olive-400 dark:text-mint-200">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold">Generate AI Posts & Threads</h2>
              <p className="text-xs text-muted-fg">Create custom promotional posts for <span className="font-semibold text-foreground">{appName}</span></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-fg hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Prompt Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">
              1. What are you promoting / announcing? <span className="text-green-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. We just released v2.0 with Dark Mode, 50% faster load speeds, and automated PDF export! Try it free at https://focusflow.app"
              className="mt-2 w-full rounded-xl border bg-surface p-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <p className="mt-1 text-[11px] text-muted-fg">Provide any release notes, stats, or features you want the AI to highlight.</p>
          </div>

          {/* Event Type Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">
              2. Select Event Type:
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {EVENT_TYPES.map((et) => (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => setEventType(et.id)}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
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

          {/* Target Platforms Checkboxes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">
              3. Target Social Platforms:
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const isSelected = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`ap-press flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                      isSelected
                        ? "border-mint-400 bg-mint-100 text-green-500 dark:bg-olive-500 dark:text-mint-200 font-bold"
                        : "border-border bg-surface text-muted-fg hover:bg-muted"
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-green-500 dark:text-mint-300" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-fg">
              4. Tone of Voice:
            </label>
            <div className="mt-2 flex gap-3">
              {(["casual", "professional"] as ApiTone[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`flex-1 rounded-xl border py-2.5 text-xs font-bold capitalize transition-all ${
                    tone === t
                      ? "border-mint-400 bg-mint-100 text-green-500 dark:bg-olive-500 dark:text-mint-200"
                      : "border-border bg-surface text-muted-fg hover:bg-muted"
                  }`}
                >
                  {t === "casual" ? "🔥 Casual & Engaging" : "💼 Professional & Clear"}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-xs font-medium text-muted-fg hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
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
        </form>
      </div>
    </div>
  );
}
