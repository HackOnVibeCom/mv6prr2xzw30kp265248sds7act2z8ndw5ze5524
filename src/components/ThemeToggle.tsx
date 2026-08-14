import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`ap-press relative z-10 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-surface text-muted-fg transition-colors hover:bg-mint-100 hover:text-foreground dark:hover:bg-olive-500 ${className ?? ""}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-olive-600 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
