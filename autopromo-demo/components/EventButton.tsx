import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export function EventButton({
  label,
  hint,
  onPress,
}: {
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View style={styles.zap}>
        <Text style={styles.zapIcon}>⚡</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
  zap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  zapIcon: { fontSize: 14 },
  text: { flex: 1 },
  label: { fontSize: 15, fontWeight: "600", color: colors.text },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: "monospace",
  },
});
