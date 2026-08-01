import { useEffect, useState } from "react";

/**
 * Reads the current theme by observing the `dark` class that ThemeToggle sets
 * on <html>. Charts need this because their mark colors are chosen per surface
 * and can't be expressed as CSS variables inside an SVG fill.
 *
 * Returns false during SSR and on first paint, then corrects after hydration.
 */
export function useDarkMode(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const sync = () => setDark(root.classList.contains("dark"));
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return dark;
}
