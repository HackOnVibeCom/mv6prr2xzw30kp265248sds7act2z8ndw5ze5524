import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
        content: "Generate, rank and publish promo posts straight from your app's real product events.",
      },
    ],
  }),
  component: Landing,
});

const previews = [
  {
    platform: "Twitter" as const,
    tone: "casual",
    text: "PocketRecipe just passed 1,000 downloads 🎉 Point your camera at the fridge, get dinner in 20 seconds.",
  },
  {
    platform: "LinkedIn" as const,
    tone: "professional",
    text: "1,000 downloads in seven days. What moved the needle was shipping the fix on day three — and replying to everyone who reported it.",
  },
  {
    platform: "Reddit" as const,
    tone: "casual",
    text: "Built this because I was tired of scrolling past someone's childhood memories to find a pasta recipe. Free, no ads.",
  },
];

function Landing() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % previews.length), 3200);
    return () => clearInterval(t);
  }, []);

  const preview = previews[index];

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:py-20">
      <nav className="mb-14 flex items-center justify-between">
        <span className="font-display text-sm font-bold tracking-tight">AutoPromo SDK</span>
        <Link
          to="/apps"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-green-500 hover:bg-mint-100 dark:text-mint-200 dark:hover:bg-olive-500"
        >
          Dashboard
        </Link>
      </nav>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
        <div>
          <h1 className="font-display text-4xl leading-tight font-bold sm:text-5xl">
            Your app already knows when to promote itself.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-fg">
            AutoPromo is a drop-in SDK that turns real product moments — a launch, a milestone, a
            five-star review — into platform-tailored posts, ranks them, and opens the native
            compose screen so a human ships it in one tap.
          </p>
          <div className="mt-7">
            <Link
              to="/apps/$appId"
              params={{ appId: "demo-app" }}
              className="ap-press inline-flex items-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Open the demo dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-mint-200 bg-mint-100 p-4 dark:border-olive-400 dark:bg-olive-500">
          <p className="mb-3 font-mono text-[11px] text-olive-300 dark:text-mint-200">
            generating…&nbsp;event=milestone
          </p>
          <article key={index} className="ap-enter rounded-xl border bg-surface p-4">
            <div className="flex items-center gap-2">
              <span className="text-green-400 dark:text-mint-300">
                <PlatformIcon platform={preview.platform} />
              </span>
              <span className="font-display text-sm font-semibold">{preview.platform}</span>
              <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[11px] text-green-500 dark:bg-olive-400 dark:text-mint-200">
                {preview.tone}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-fg">{preview.text}</p>
          </article>
        </div>
      </section>

      <section className="mt-20 grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "Generate",
            body: "Product events become real copy per platform and tone — not one message reposted four times.",
          },
          {
            title: "Rank",
            body: "A strategy engine learns which platforms your team actually posts to, and floats those first.",
          },
          {
            title: "Publish",
            body: "One tap opens the native compose screen with the text pre-filled. A human always presses send.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border bg-surface p-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-mint-100 font-display text-sm font-bold text-green-500 dark:bg-olive-500 dark:text-mint-200">
              {f.title[0]}
            </span>
            <h2 className="mt-3 font-display text-lg font-semibold">{f.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-fg">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
