import { createFileRoute, Link } from "@tanstack/react-router";
import { feedEvents, posts, getApp } from "@/lib/mockData";
import { PlatformIcon } from "@/components/PlatformIcon";
import { buildShareUrl } from "@/lib/share";
import type { Platform } from "@/lib/mockData";

export const Route = createFileRoute("/share/$eventId")({
  loader: ({ params }) => {
    // Find the event in the feed
    const event = feedEvents.find((e) => e.id === params.eventId);
    // Try to resolve an app
    const app = event ? getApp(event.appId) : undefined;
    // Find relevant posts (posts generated from this app)
    const relatedPosts = app
      ? posts.filter((p) => p.appId === app.id).slice(0, 4)
      : posts.slice(0, 4);
    return { event: event ?? null, app: app ?? null, relatedPosts };
  },
  head: ({ loaderData }) => {
    const app = loaderData?.app;
    const title = app ? `${app.name} — AutoPromo` : "AutoPromo SDK";
    const description = app
      ? app.description
      : "AI-driven promotion layer for newly launched mobile apps.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: SharePage,
});

function SharePage() {
  const { event, app, relatedPosts } = Route.useLoaderData();

  // Best post for the primary share action (highest score LinkedIn/Twitter)
  const primaryPost =
    relatedPosts.find((p) => p.platform === "LinkedIn") ??
    relatedPosts.find((p) => p.platform === "Twitter") ??
    relatedPosts[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-16">
        {/* Brand */}
        <div className="mb-10 flex items-center gap-2">
          <Link to="/" className="font-display text-sm font-bold tracking-tight">
            AutoPromo<span className="text-green-400 dark:text-mint-300"> SDK</span>
          </Link>
          <span className="text-xs text-muted-fg">· share page</span>
        </div>

        {/* App context */}
        {app ? (
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold">{app.name}</h1>
            <p className="mt-1 text-sm text-muted-fg">{app.description}</p>
            {event && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border bg-surface px-3 py-1.5">
                <span className="font-mono text-[11px] text-mint-400">{event.type}</span>
                <span className="font-mono text-[11px] text-muted-fg">{event.payload}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold">AutoPromo SDK</h1>
            <p className="mt-1 text-sm text-muted-fg">
              AI-generated promotional content, ranked and ready to publish.
            </p>
          </div>
        )}

        {/* Primary share action */}
        {primaryPost && (
          <div className="mb-6 rounded-xl border border-l-2 border-l-amber-200 bg-surface p-5">
            <div className="flex items-center gap-2">
              <span className="text-green-400 dark:text-mint-300">
                <PlatformIcon platform={primaryPost.platform} />
              </span>
              <span className="font-display text-sm font-semibold">{primaryPost.platform}</span>
              <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[11px] text-green-500 dark:bg-olive-500 dark:text-mint-200">
                {primaryPost.tone}
              </span>
              <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                Top pick
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-fg">{primaryPost.content}</p>
            <div className="mt-4">
              <a
                href={buildShareUrl(primaryPost.platform as Platform, primaryPost, app?.url ?? "https://autopromo.app")}
                target="_blank"
                rel="noopener noreferrer"
                className="ap-press inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                Share on {primaryPost.platform} →
              </a>
            </div>
          </div>
        )}

        {/* Other platform variants */}
        {relatedPosts.length > 1 && (
          <>
            <h2 className="mb-3 font-display text-sm font-semibold text-muted-fg">
              More platforms
            </h2>
            <ul className="space-y-3">
              {relatedPosts
                .filter((p) => p.id !== primaryPost?.id)
                .map((p) => (
                  <li key={p.id} className="rounded-xl border bg-surface p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 dark:text-mint-300">
                        <PlatformIcon platform={p.platform} />
                      </span>
                      <span className="font-display text-sm font-semibold">{p.platform}</span>
                      <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[11px] text-green-500 dark:bg-olive-500 dark:text-mint-200">
                        {p.tone}
                      </span>
                      <span className="ml-auto font-mono text-[11px] text-muted-fg">
                        {p.score.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-fg">{p.content}</p>
                    <a
                      href={buildShareUrl(p.platform as Platform, p, app?.url ?? "https://autopromo.app")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ap-press mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-mint-100 dark:hover:bg-olive-500"
                    >
                      Share on {p.platform}
                    </a>
                  </li>
                ))}
            </ul>
          </>
        )}

        {/* Back link */}
        <div className="mt-10 border-t pt-6">
          {app ? (
            <Link
              to="/apps/$appId"
              params={{ appId: app.id }}
              className="text-sm text-green-400 hover:underline dark:text-mint-300"
            >
              ← Back to {app.name} dashboard
            </Link>
          ) : (
            <Link to="/apps" className="text-sm text-green-400 hover:underline dark:text-mint-300">
              ← Back to dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
