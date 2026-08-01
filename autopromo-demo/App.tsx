import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AutoPromo, { type RankedPost } from "@autopromo/sdk";
import { APP_ID, API_URL, APP_URL } from "./config";
import { EventButton } from "./components/EventButton";
import { PostCard } from "./components/PostCard";
import { StatusBanner, type Status } from "./components/StatusBanner";
import { colors } from "./theme";

AutoPromo.init({
  appId: APP_ID,
  apiUrl: API_URL,
  appUrl: APP_URL,
  appName: "PocketRecipe",
  debug: __DEV__,
});

export default function App() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [posts, setPosts] = useState<RankedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDraft, setReplyDraft] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    const next = await AutoPromo.getRankedPosts({ limit: 20 });
    setPosts(next);
    setLoading(false);
    return next;
  }, []);

  // Fire the launch event once on first mount — this is the single most
  // important SDK call, and it happens without the user doing anything.
  useEffect(() => {
    (async () => {
      const result = await AutoPromo.trackLaunch({ stores: ["ios", "android"] });
      if (!result.ok) {
        setStatus({
          kind: "error",
          message: "Backend unreachable — check API_URL in config.ts",
        });
      }
      await loadPosts();
    })();
  }, [loadPosts]);

  async function fire(
    label: string,
    run: () => Promise<{ ok: boolean; generated?: number; replyDraft?: string; error?: string }>,
  ) {
    setStatus({ kind: "sending", message: `Sending ${label}…` });
    setReplyDraft(null);

    const result = await run();

    if (!result.ok) {
      setStatus({ kind: "error", message: result.error ?? "Event failed" });
      return;
    }

    setStatus({
      kind: "success",
      message: `${result.generated ?? 0} posts generated for "${label}"`,
    });
    if (result.replyDraft) setReplyDraft(result.replyDraft);

    await loadPosts();
  }

  async function share(post: RankedPost) {
    await AutoPromo.share(post, Linking.openURL);
    // Reflect the choice locally so the card greys out immediately.
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, chosen: true } : p)));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadPosts} tintColor={colors.mint} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.brand}>
            AutoPromo <Text style={styles.brandAccent}>demo</Text>
          </Text>
          <Text style={styles.title}>PocketRecipe</Text>
          <Text style={styles.subtitle}>
            Scan your fridge, get dinner. Tap an event below — the SDK sends it, the backend writes
            the posts, and they appear here ranked.
          </Text>
        </View>

        <StatusBanner status={status} />

        <Text style={styles.sectionLabel}>Simulate a product moment</Text>
        <View style={styles.buttons}>
          <EventButton
            label="First launch"
            hint="AutoPromo.trackLaunch()"
            onPress={() =>
              fire("launch", () => AutoPromo.trackLaunch({ stores: ["ios", "android"] }))
            }
          />
          <EventButton
            label="1,000th download"
            hint="AutoPromo.trackMilestone()"
            onPress={() =>
              fire("milestone", () =>
                AutoPromo.trackMilestone({
                  label: "1000 downloads",
                  count: 1000,
                }),
              )
            }
          />
          <EventButton
            label="New version shipped"
            hint="AutoPromo.trackVersion()"
            onPress={() =>
              fire("new version", () =>
                AutoPromo.trackVersion({
                  build: "1.2.0",
                  notes: "Added dark mode and offline pantry sync",
                }),
              )
            }
          />
          <EventButton
            label="New 5-star review"
            hint="AutoPromo.trackReview()"
            onPress={() =>
              fire("new review", () =>
                AutoPromo.trackReview({
                  rating: 5,
                  text: "Used it four nights in a row and didn't order takeaway once.",
                }),
              )
            }
          />
        </View>

        {replyDraft && (
          <View style={styles.replyCard}>
            <Text style={styles.replyLabel}>Suggested reply to reviewer</Text>
            <Text style={styles.replyBody}>{replyDraft}</Text>
          </View>
        )}

        <View style={styles.postsHeader}>
          <Text style={styles.sectionLabel}>Ranked posts</Text>
          {posts.length > 0 && <Text style={styles.count}>{posts.length}</Text>}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.mint} style={styles.loader} />
        ) : posts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyBody}>
              Fire an event above and the generated variants will land here, best-ranked first.
            </Text>
          </View>
        ) : (
          posts.map((post, i) => (
            <PostCard key={post.id} post={post} topPick={i === 0} onShare={() => share(post)} />
          ))
        )}

        <Pressable
          style={styles.footerLink}
          onPress={() => Linking.openURL(`${APP_URL}/live/${APP_ID}`)}
        >
          <Text style={styles.footerLinkText}>Open the live feed →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 48 },
  header: { marginBottom: 20 },
  brand: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  brandAccent: { color: colors.mint },
  title: { fontSize: 28, fontWeight: "700", color: colors.text, marginTop: 6 },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  buttons: { gap: 10, marginBottom: 24 },
  postsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  count: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
  },
  loader: { marginVertical: 32 },
  empty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  emptyBody: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  replyCard: {
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    backgroundColor: colors.surface,
  },
  replyLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.amber,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  replyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    marginTop: 8,
  },
  footerLink: { marginTop: 28, alignItems: "center" },
  footerLinkText: { fontSize: 13, color: colors.mint, fontWeight: "600" },
});
