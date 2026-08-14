import { useTheme } from "@/lib/theme";

/**
 * Returns true when dark mode is currently active.
 */
export function useDarkMode(): boolean {
  const { isDark } = useTheme();
  return isDark;
}
