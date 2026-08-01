/**
 * Data source context.
 *
 * The dashboard is wired to the real backend (`server/`). This module owns the
 * one piece of policy that matters for a live demo: what to show when the
 * backend is unreachable.
 *
 * Rather than rendering blank screens — which is what a judge sees if Supabase
 * or Groq is down mid-demo (a risk the plan calls out in §21) — we fall back to
 * the seed dataset and label the UI unambiguously as "sample data". Live is
 * always preferred; the fallback never masquerades as real telemetry.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { checkHealth, API_BASE_URL } from "@/lib/api";

export type ConnectionState = "checking" | "live" | "offline";

interface DataSourceValue {
  status: ConnectionState;
  /** True when reading from the seed dataset because the API is unreachable. */
  isFallback: boolean;
  apiBaseUrl: string;
  /** Re-probe the backend. */
  retry: () => void;
}

const DataSourceContext = createContext<DataSourceValue>({
  status: "checking",
  isFallback: false,
  apiBaseUrl: API_BASE_URL,
  retry: () => {},
});

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionState>("checking");

  const probe = useCallback(async () => {
    setStatus("checking");
    const ok = await checkHealth();
    setStatus(ok ? "live" : "offline");
  }, []);

  useEffect(() => {
    void probe();
  }, [probe]);

  // Re-probe when the tab regains focus, so a backend started after the page
  // loaded gets picked up without a manual refresh.
  useEffect(() => {
    function onFocus() {
      if (status === "offline") void probe();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [probe, status]);

  const value = useMemo<DataSourceValue>(
    () => ({
      status,
      isFallback: status === "offline",
      apiBaseUrl: API_BASE_URL,
      retry: () => void probe(),
    }),
    [status, probe],
  );

  return <DataSourceContext.Provider value={value}>{children}</DataSourceContext.Provider>;
}

export function useDataSource(): DataSourceValue {
  return useContext(DataSourceContext);
}
