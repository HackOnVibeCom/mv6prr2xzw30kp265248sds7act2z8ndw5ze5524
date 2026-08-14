import { Pressable, StyleSheet, Text, View } from "react-native";
import { platformLabel, type RankedPost } from "@autopromo/sdk";
import { colors, platformColor } from "../theme";

export function PostCard({
  post,
  topPick,
  onShare,
}: {
  post: RankedPost;
  topPick?: boolean;
  onShare: () => void;
}) {
  const tint = platformColor[post.platform] ?? colors.mint;

  return (
    <View style={[styles.card, post.chosen && styles.chosen]}>
      <View style={styles.head}>
        <Text style={[styles.platform, { color: tint }]}>{post.platform}</Text>
        <View style={styles.tone}>
          <Text style={styles.toneText}>{post.tone}</Text>
        </View>
        {topPick && (
          <View style={styles.topPick}>
            <Text style={styles.topPickText}>top pick</Text>
          </View>
        )}
        <Text style={styles.score}>{post.rank_score.toFixed(2)}</Text>
      </View>

      {post.link_title && <Text style={styles.linkTitle}>{post.link_title}</Text>}

      <Text style={styles.content}>{post.content}</Text>

      <Pressable
        onPress={onShare}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          post.chosen && styles.buttonChosen,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={[styles.buttonText, post.chosen && styles.buttonTextChosen]}>
          {post.chosen ? "✓ Compose opened" : platformLabel[post.platform]}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  chosen: { opacity: 0.65 },
  head: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  platform: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  tone: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  toneText: { fontSize: 10, color: colors.textMuted },
  topPick: {
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  topPickText: { fontSize: 10, color: colors.amber, fontWeight: "700" },
  score: {
    marginLeft: "auto",
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "monospace",
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  content: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  button: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.green,
  },
  buttonChosen: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
  buttonPressed: { opacity: 0.75 },
  buttonText: { fontSize: 14, fontWeight: "600", color: colors.bg },
  buttonTextChosen: { color: colors.textMuted },
});
