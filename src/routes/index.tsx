import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PlatformIcon } from "@/components/PlatformIcon";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoPromo SDK — AI promotion layer for new mobile apps" },
      {
        name: "description",
        content:
          "Drop-in SDK that turns product moments into ranked, platform-tailored promo posts and opens the native compose screen in one click.",
      },
      { property: "og:title", content: "AutoPromo SDK — AI promotion layer for new mobile apps" },
      {
        property: "og:description",
        content:
          "Generate, rank and publish promo posts straight from your app's real product events.",
      },
    ],
  }),
  component: Landing,
});

const previews = [
  {
    platform: "Twitter" as const,
    tone: "hype",
    event: "Milestone",
    text: "1,000 downloads in SEVEN DAYS 🔥 A thousand people pointed their phone at a fridge this week and cooked something. PocketRecipe is free, go break it.",
    score: "0.91",
  },
  {
    platform: "LinkedIn" as const,
    tone: "professional",
    event: "Milestone",
    text: "1,000 downloads in seven days. What moved the needle was shipping the fix on day three — and replying to everyone who reported it.",
    score: "0.81",
  },
  {
    platform: "Reddit" as const,
    tone: "casual",
    event: "Launch",
    text: "Built this because I was tired of scrolling past someone's childhood memories to find a pasta recipe. Free, no ads. Would love r/cooking's brutal feedback.",
    score: "0.84",
  },
  {
    platform: "WhatsApp" as const,
    tone: "casual",
    event: "Milestone",
    text: "Hey! You know how I never know what to cook? I've been using PocketRecipe — take a photo of the fridge and it gives you a recipe. Saved me three takeaways this week 👉",
    score: "0.73",
  },
];

const SDK_SNIPPET = `import AutoPromo from "@autopromo/sdk";

// 1. Init once at app startup
AutoPromo.init({
  appId: process.env.AUTOPROMO_APP_ID,
  apiUrl: "https://autopromo.vercel.app/api",
  appUrl: "https://yourapp.com",
});

// 2. Track product moments
AutoPromo.trackLaunch({ stores: ["ios", "android"] });
AutoPromo.trackMilestone({ label: "1000 downloads" });
AutoPromo.trackVersion({ build: "2.0.0", notes: "Dark mode" });
AutoPromo.trackReview({ rating: 5, text: review.body });

// 3. Open a real platform compose screen
const posts = await AutoPromo.getRankedPosts();
await AutoPromo.share(posts[0]); // opens Twitter, Reddit, WhatsApp…`;

const PRICING = [
  {
    tier: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    features: ["20 AI-generated posts / month", "1 app", "All 6 platforms", "Strategy Engine"],
  },
  {
    tier: "Builder",
    price: "$12",
    period: "/ month",
    highlight: true,
    features: [
      "200 posts / month",
      "3 apps",
      "Strategy Engine insights dashboard",
      "Priority generation queue",
    ],
  },
  {
    tier: "Agency",
    price: "$39",
    period: "/ month",
    highlight: false,
    features: [
      "Unlimited posts",
      "Unlimited apps",
      "White-label dashboard",
      "Client management view",
    ],
  },
];

function Landing() {
  const [index, setIndex] = useState(0);
  const [snippetCopied, setSnippetCopied] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % previews.length), 3200);
    return () => clearInterval(t);
  }, []);

  const preview = previews[index]!;

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(SDK_SNIPPET);
      setSnippetCopied(true);
      toast.success("Snippet copied");
      setTimeout(() => setSnippetCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the text instead");
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:py-20">
      {/* ── Nav ── */}
      <nav className="mb-14 flex items-center justify-between">
        <span className="font-display text-sm font-bold tracking-tight">AutoPromo SDK</span>
        <div className="flex items-center gap-3">
          <Link to="/docs" className="text-sm text-muted-fg hover:text-foreground">
            Docs
          </Link>
          <Link
            to="/apps"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-green-500 hover:bg-mint-100 dark:text-mint-200 dark:hover:bg-olive-500"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-mint-50 px-3 py-1 text-xs font-medium text-green-500 dark:bg-olive-500 dark:text-mint-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="ap-pulse-dot absolute inline-flex h-1.5 w-1.5 rounded-full bg-green-300" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-300" />
            </span>
            HackOnVibe 2026 · August 14–16
          </div>
          <h1 className="font-display text-4xl leading-tight font-bold sm:text-5xl">
            Your app already knows when to promote itself.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-fg">
            AutoPromo is a drop-in SDK that turns real product moments — a launch, a milestone, a
            five-star review — into platform-tailored posts, ranks them by a strategy engine, and
            opens the native compose screen so a human ships it in one tap.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/apps/$appId"
              params={{ appId: "demo-app" }}
              className="ap-press inline-flex items-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Open the demo dashboard
            </Link>
            <Link
              to="/live/$appId"
              params={{ appId: "demo-app" }}
              className="ap-press inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold hover:bg-mint-100 dark:hover:bg-olive-500"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="ap-pulse-dot absolute inline-flex h-2 w-2 rounded-full bg-amber-200"
                  aria-hidden="true"
                />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-200" />
              </span>
              Watch live feed
            </Link>
          </div>
        </div>

        {/* animated preview card */}
        <div className="rounded-2xl border border-mint-200 bg-mint-100 p-4 dark:border-olive-400 dark:bg-olive-500">
          <div className="mb-3 flex items-center gap-2">
            <span className="font-mono text-[11px] text-olive-300 dark:text-mint-200">
              generating…&nbsp;event={preview.event.toLowerCase().replace(" ", "_")}
            </span>
          </div>
          <article key={index} className="ap-enter rounded-xl border bg-surface p-4">
            <div className="flex items-center gap-2">
              <span className="text-green-400 dark:text-mint-300">
                <PlatformIcon platform={preview.platform} />
              </span>
              <span className="font-display text-sm font-semibold">{preview.platform}</span>
              <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[11px] text-green-500 dark:bg-olive-400 dark:text-mint-200">
                {preview.tone}
              </span>
              <span className="ml-auto font-mono text-[11px] text-muted-fg">{preview.score}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-fg">{preview.text}</p>
          </article>
          <div className="mt-3 flex gap-2">
            {previews.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Preview ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i === index ? "bg-green-400" : "bg-mint-300 dark:bg-olive-400"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature trio ── */}
      <section className="mt-20 grid gap-6 sm:grid-cols-3">
        {[
          {
            letter: "G",
            title: "Generate",
            body: "Product events become real copy per platform and tone — not one message reposted four times.",
          },
          {
            letter: "R",
            title: "Rank",
            body: "A strategy engine learns which platforms your team actually posts to, and floats those first.",
          },
          {
            letter: "P",
            title: "Publish",
            body: "One tap opens the native compose screen with the text pre-filled. A human always presses send.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border bg-surface p-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-mint-100 font-display text-sm font-bold text-green-500 dark:bg-olive-500 dark:text-mint-200">
              {f.letter}
            </span>
            <h2 className="mt-3 font-display text-lg font-semibold">{f.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-fg">{f.body}</p>
          </div>
        ))}
      </section>

      {/* ── SDK snippet ── */}
      <section className="mt-20">
        <h2 className="font-display text-2xl font-bold">Three lines to integrate.</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-fg">
          Drop the SDK into any Expo or React Native app. Call{" "}
          <code className="rounded bg-mint-100 px-1 font-mono text-xs text-green-500 dark:bg-olive-500">
            init
          </code>{" "}
          once, track the moments that matter, and let AutoPromo handle the rest.
        </p>
        <div className="mt-6 overflow-hidden rounded-xl border bg-olive-600">
          <div className="flex items-center justify-between border-b border-olive-500 px-4 py-2">
            <span className="font-mono text-[11px] text-olive-200">
              TypeScript · Expo / React Native
            </span>
            <button
              type="button"
              onClick={copySnippet}
              className="ap-press rounded-lg border border-olive-400 px-2 py-1 text-xs text-olive-100 hover:bg-olive-500"
            >
              {snippetCopied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[12px] leading-relaxed text-mint-100">
            <code>{SDK_SNIPPET}</code>
          </pre>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            to="/docs"
            className="ap-press inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-mint-100 dark:hover:bg-olive-500"
          >
            Full integration guide →
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-fg hover:underline"
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* ── Platforms ── */}
      <section className="mt-20">
        <h2 className="font-display text-2xl font-bold">Every platform, one click.</h2>
        <p className="mt-2 text-sm text-muted-fg">
          No automatic posting, no API keys, no ToS risk. AutoPromo opens the platform's own compose
          screen with the content pre-filled — a human always reviews and sends.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {(["Twitter", "Reddit", "WhatsApp", "LinkedIn", "Telegram", "Facebook"] as const).map(
            (p) => (
              <div
                key={p}
                className="flex flex-col items-center gap-2 rounded-xl border bg-surface py-4"
              >
                <span className="text-green-400 dark:text-mint-300">
                  <PlatformIcon platform={p} className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-medium">{p}</span>
              </div>
            ),
          )}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="mt-20">
        <h2 className="font-display text-2xl font-bold">Pricing</h2>
        <p className="mt-2 text-sm text-muted-fg">Start free. No credit card required to try.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {PRICING.map((plan) => (
            <div
              key={plan.tier}
              className={`flex flex-col rounded-xl border p-5 ${
                plan.highlight
                  ? "border-green-300 bg-green-50 dark:border-green-300/40 dark:bg-olive-500"
                  : "bg-surface"
              }`}
            >
              {plan.highlight && (
                <span className="mb-2 self-start rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-500 dark:bg-olive-400 dark:text-mint-200">
                  Most popular
                </span>
              )}
              <p className="font-display text-lg font-bold">{plan.tier}</p>
              <p className="mt-1">
                <span className="font-display text-3xl font-bold">{plan.price}</span>
                <span className="ml-1 text-xs text-muted-fg">{plan.period}</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-green-400">✓</span>
                    <span className="text-muted-fg">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/apps/$appId"
                params={{ appId: "demo-app" }}
                className={`ap-press mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                    : "border hover:bg-mint-100 dark:hover:bg-olive-500"
                }`}
              >
                {plan.tier === "Free" ? "Try the demo" : "Get started"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Strategy Engine callout ── */}
      <section className="mt-20 rounded-xl border bg-mint-50 p-6 dark:bg-olive-500">
        <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-display text-xl font-bold">Not just generation — ranking.</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-fg">
              The Strategy Engine starts with sensible defaults for which platform fits which event,
              then learns from your team's actual publishing choices. Over time it surfaces the
              platforms and tones that work for your specific app's audience — not a generic
              template.
            </p>
            <p className="mt-3 font-mono text-[11px] text-muted-fg">
              score = base_weight(event, platform) + 0.5 × (chosen / shown)
            </p>
          </div>
          <div className="flex items-center">
            <Link
              to="/apps/$appId"
              params={{ appId: "demo-app" }}
              className="ap-press whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium hover:bg-mint-100 dark:hover:bg-olive-400"
            >
              See it live →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t pt-8 text-xs text-muted-fg">
        <span className="font-display font-bold">AutoPromo SDK</span>
        <div className="flex gap-4">
          <Link to="/apps" className="hover:underline">
            Dashboard
          </Link>
          <Link to="/docs" className="hover:underline">
            Docs
          </Link>
          <Link to="/live/$appId" params={{ appId: "demo-app" }} className="hover:underline">
            Live feed
          </Link>
        </div>
        <span>HackOnVibe 2026 · Built with 100% free-tier services</span>
      </footer>
    </main>
  );
}
