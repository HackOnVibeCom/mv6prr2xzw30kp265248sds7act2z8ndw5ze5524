import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export type Status =
  | { kind: "idle" }
  | { kind: "sending"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function StatusBanner({ status }: { status: Status }) {
  if (status.kind === "idle") return null;

  const tint =
    status.kind === "error"
      ? colors.danger
      : status.kind === "success"
        ? colors.green
        : colors.amber;

  return (
    <View style={[styles.banner, { borderColor: tint }]}>
      {status.kind === "sending" ? (
        <ActivityIndicator size="small" color={tint} />
      ) : (
        <Text style={[styles.icon, { color: tint }]}>{status.kind === "success" ? "✓" : "!"}</Text>
      )}
      <Text style={styles.message}>{status.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: colors.surface,
  },
  icon: { fontSize: 14, fontWeight: "700", width: 16, textAlign: "center" },
  message: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
});
