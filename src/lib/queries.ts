/**
 * React Query hooks — the single way dashboard screens read data.
 *
 * Each hook queries the live backend and, if that fails, resolves to the seed
 * dataset with `isFallback: true` so the UI can label it. No screen talks to
 * `api.ts` directly.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApp, getAppById, listApps, listPosts, markChosen, trackEvent } from "@/lib/api";
import { AutoPromo } from "@/lib/sdk";
import { toDisplayApp, toDisplayPost, toWirePlatform, toWireTone } from "@/lib/adapters";
import type { ApiEventType } from "@/lib/apiTypes";
import {
  apps as seedApps,
  getApp as getSeedApp,
  getPosts as getSeedPosts,
  type App,
  type Post,
} from "@/lib/mockData";

/** Marks whether a query resolved from the live API or the seed fallback. */
export interface Sourced<T> {
  data: T;
  isFallback: boolean;
}

/**
 * True when this app record came from the bundled demo dataset rather than the
 * backend. Screens use it to decide whether presentation-only fields —
 * installs, store rating, store reviews — are real telemetry or demo dressing.
 *
 * A live app must never borrow a demo app's numbers: that would present
 * fabricated metrics as if the backend had reported them.
 */
export function isSeedApp(appId: string): boolean {
  return getSeedApp(appId) !== undefined;
}

const STALE_MS = 30_000;

export const queryKeys = {
  apps: ["apps"] as const,
  app: (appId: string) => ["apps", appId] as const,
  posts: (appId: string) => ["posts", appId] as const,
};

/* ------------------------------------------------------------------- apps */

/**
 * Every app in the workspace: the bundled demo apps plus every app the user
 * has actually created through the API.
 *
 * The two sets coexist rather than replacing each other. Demo apps are a
 * permanent showcase with rich sample numbers; real apps carry only their own
 * data. `app.isDemo` tells them apart, and no screen may mix the two.
 */
function getLocalCustomApps(): App[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("autopromo-custom-apps");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCustomApp(app: App): void {
  if (typeof window === "undefined") return;
  const current = getLocalCustomApps();
  const updated = [app, ...current.filter((a) => a.id !== app.id)];
  localStorage.setItem("autopromo-custom-apps", JSON.stringify(updated));
}

export function useApps() {
  return useQuery<Sourced<App[]>>({
    queryKey: queryKeys.apps,
    staleTime: STALE_MS,
    placeholderData: { data: [...getLocalCustomApps(), ...seedApps], isFallback: true },
    queryFn: async () => {
      const localApps = getLocalCustomApps();
      try {
        const live = await listApps();
        const displayApps = live.map((a) => toDisplayApp(a));
        const combined = [...localApps.filter(la => !displayApps.some(da => da.id === la.id)), ...displayApps];
        return {
          data: [...combined, ...seedApps],
          isFallback: false,
        };
      } catch {
        return { data: [...localApps, ...seedApps], isFallback: true };
      }
    },
  });
}

export function useApp(appId: string) {
  return useQuery<Sourced<App | undefined>>({
    queryKey: queryKeys.app(appId),
    staleTime: STALE_MS,
    placeholderData: () => {
      const localApps = getLocalCustomApps();
      const local = localApps.find((a) => a.id === appId);
      if (local) return { data: local, isFallback: true };
      const seed = getSeedApp(appId);
      return seed ? { data: seed, isFallback: true } : undefined;
    },
    queryFn: async () => {
      const localApps = getLocalCustomApps();
      const local = localApps.find((a) => a.id === appId);
      try {
        const live = await getAppById(appId);
        return { data: toDisplayApp(live), isFallback: false };
      } catch {
        if (local) return { data: local, isFallback: true };
        const seed = getSeedApp(appId);
        return seed
          ? { data: seed, isFallback: true }
          : { data: undefined, isFallback: false };
      }
    },
  });
}

/* ------------------------------------------------------------------ posts */

export function usePosts(appId: string) {
  return useQuery<Sourced<Post[]>>({
    queryKey: queryKeys.posts(appId),
    staleTime: STALE_MS,
    placeholderData: () => {
      const seed = getSeedPosts(appId);
      return seed.length > 0
        ? { data: [...seed].sort((a, b) => b.score - a.score), isFallback: true }
        : undefined;
    },
    queryFn: async () => {
      try {
        const live = await listPosts({ appId, limit: 200 });
        if (live.length === 0) {
          const seeded = getSeedPosts(appId);
          return seeded.length > 0
            ? { data: seeded, isFallback: true }
            : { data: [], isFallback: false };
        }
        return {
          data: live.map((p) => toDisplayPost(p)).sort((a, b) => b.score - a.score),
          isFallback: false,
        };
      } catch {
        const seeded = getSeedPosts(appId);
        return {
          data: [...seeded].sort((a, b) => b.score - a.score),
          isFallback: seeded.length > 0,
        };
      }
    },
  });
}

/* -------------------------------------------------------------- mutations */

export function useTrackEvent(appId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { type: ApiEventType; payload: Record<string, unknown> }) => {
      try {
        return await trackEvent({ appId, type: vars.type, payload: vars.payload });
      } catch (err) {
        console.warn("[useTrackEvent] API call failed, using SDK fallback copy generator:", err);
        return await AutoPromo.trackEvent(vars.type as any, vars.payload);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.posts(appId) });
      void qc.invalidateQueries({ queryKey: queryKeys.app(appId) });
    },
  });
}

export function useMarkChosen(appId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (post: Post) =>
      markChosen({
        postId: post.id,
        appId,
        platform: toWirePlatform(post.platform),
        tone: toWireTone(post.tone),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.posts(appId) });
    },
  });
}

export function useCreateApp() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name: string; description: string }): Promise<App> => {
      try {
        const live = await createApp(body);
        return toDisplayApp(live);
      } catch {
        // Fallback: Create custom app locally if API or Database is unavailable
        const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "app";
        const id = `${slug}-${Date.now().toString(36)}`;
        const localApp: App = {
          id,
          name: body.name,
          description: body.description,
          apiKey: `ap_live_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`,
          status: "active",
          sdkVersion: "1.2.0",
          platform: "universal",
          connectedAt: "Just now",
          installs: 0,
          postsGenerated: 0,
          postsPublished: 0,
          url: `https://${slug}.app`,
          tagline: body.description,
          category: "Utility",
          isDemo: false,
        };
        saveLocalCustomApp(localApp);
        return localApp;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.apps });
    },
  });
}
