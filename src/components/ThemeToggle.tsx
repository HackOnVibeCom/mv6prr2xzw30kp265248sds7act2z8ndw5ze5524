import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("ap-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", dark);
      document.body.classList.toggle("dark", dark);
    }
  }, [dark]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !dark;
    setDark(next);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next);
      document.body.classList.toggle("dark", next);
      localStorage.setItem("ap-theme", next ? "dark" : "light");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={`ap-press relative z-10 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-surface text-muted-fg transition-colors hover:bg-mint-100 hover:text-foreground dark:hover:bg-olive-500 ${className ?? ""}`}
    >
      {dark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-olive-600 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
