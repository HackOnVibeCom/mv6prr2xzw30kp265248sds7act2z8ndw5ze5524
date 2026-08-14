import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Inbox, Sparkles, Send, Percent, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { PostCardSkeletonGrid } from "@/components/PostCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { StatTile, StatRow } from "@/components/StatTile";
import { FallbackNotice } from "@/components/ConnectionBadge";
import { useApp, useMarkChosen, usePosts } from "@/lib/queries";
import { getApp, platformStats, type Post } from "@/lib/mockData";

export const Route = createFileRoute("/apps/$appId/events/$eventId")({
  loader: ({ params }) => {
    // Seed apps resolve synchronously; live apps are fetched in the component.
    const seed = getApp(params.appId);
    return { seedApp: seed ?? null, eventId: params.eventId };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.seedApp?.name ?? "Event";
    return {
      meta: [
        { title: `Event detail — ${name} — AutoPromo` },
        {
          name: "description",
          content: `Every post variant generated from a single ${name} product event, ranked by the strategy engine.`,
        },
      ],
    };
  },
  component: EventDetail,
});

function EventDetail() {
  const { appId, eventId } = Route.useParams();
  const { data: appResult, isLoading: appLoading } = useApp(appId);
  const { data: postsResult, isLoading: postsLoading } = usePosts(appId);
  const markChosen = useMarkChosen(appId);

  const app = appResult?.data;
  const allPosts = useMemo(() => postsResult?.data ?? [], [postsResult]);

  // Live posts carry eventId; seed posts don't, so fall back to showing the
  // app's whole set rather than an empty page.
  const posts = useMemo(() => {
    const matching = allPosts.filter((p) => p.eventId === eventId);
    return matching.length > 0 ? matching : allPosts;
  }, [allPosts, eventId]);

  const isSyntheticView = useMemo(
    () => allPosts.length > 0 && allPosts.every((p) => p.eventId !== eventId),
    [allPosts, eventId],
  );

  const stats = platformStats[appId] ?? [];

  function handlePublish(post: Post) {
    markChosen.mutate(post);
  }

  if (appLoading) {
    return (
      <AppShell title="Event">
        <div className="h-8 w-48 animate-pulse rounded bg-mint-200 dark:bg-olive-400" />
        <div className="mt-6">
          <PostCardSkeletonGrid />
        </div>
      </AppShell>
    );
  }

  if (!app) throw notFound();

  const published = posts.filter((p) => p.chosen).length;

  return (
    <AppShell title={`${app.name} · event`} liveAppId={app.id}>
      <Link
        to="/apps/$appId"
        params={{ appId: app.id }}
        className="inline-flex items-center gap-1.5 text-sm text-green-400 hover:underline dark:text-mint-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to {app.name}
      </Link>

      <header className="mt-4">
        <h1 className="font-display text-2xl font-bold">Event detail</h1>
        <p className="mt-1 font-mono text-[11px] text-olive-300 dark:text-olive-200">
          event_id={eventId}
        </p>
      </header>

      <FallbackNotice className="mt-4" />

      {isSyntheticView && (
        <p className="mt-4 rounded-xl border border-dashed px-4 py-3 text-xs text-muted-fg">
          This event's individual variants aren't in the sample dataset, so every post for{" "}
          {app.name} is shown instead. Connect the backend to drill into real events.
        </p>
      )}

      <div className="mt-6">
        <StatRow>
          <StatTile
            icon={Sparkles}
            label="Variants generated"
            value={posts.length}
            hint="platforms × tones"
            loading={postsLoading}
          />
          <StatTile
            icon={Send}
            label="Published"
            value={published}
            hint={published > 0 ? "a human pressed send" : "none yet"}
            emphasis={published > 0}
            loading={postsLoading}
          />
          <StatTile
            icon={Percent}
            label="Publish rate"
            value={posts.length > 0 ? Math.round((published / posts.length) * 100) : "—"}
            unit={posts.length > 0 ? "%" : undefined}
            loading={postsLoading}
          />
          <StatTile
            icon={Trophy}
            label="Top score"
            value={posts.length > 0 ? posts[0]!.score.toFixed(2) : "—"}
            hint={posts.length > 0 ? `${posts[0]!.platform} · ${posts[0]!.tone}` : undefined}
            loading={postsLoading}
          />
        </StatRow>
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold">
        Generated variants
        <span className="ml-2 text-sm font-normal text-muted-fg">ranked best first</span>
      </h2>

      <div className="mt-3">
        {postsLoading ? (
          <PostCardSkeletonGrid />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No variants for this event"
            body="The event was recorded but generation produced no posts. Check the server logs for a Groq error."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((p, i) => (
              <PostCard
                key={p.id}
                post={p}
                appUrl={app.url}
                topPick={i === 0}
                stats={stats}
                onPublish={handlePublish}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
