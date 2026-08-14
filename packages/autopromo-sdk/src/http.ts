/**
 * Minimal fetch wrapper.
 *
 * Design rule (plan §9.3): the SDK must never crash the host app. A newly
 * launched app has enough problems without its promotion layer taking down a
 * cold start. Every failure is swallowed and surfaced as a result object,
 * unless the caller explicitly opted into `strict` mode.
 */

export interface HttpOptions {
  strict?: boolean;
  debug?: boolean;
  /** Milliseconds before the request is aborted. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

function log(debug: boolean | undefined, ...args: unknown[]) {
  if (debug) console.log("[AutoPromo]", ...args);
}

async function request<T>(url: string, init: RequestInit, opts: HttpOptions): Promise<T | null> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // AbortController exists in RN/Hermes and every modern browser, but guard
  // anyway so an exotic runtime degrades to "no timeout" rather than throwing.
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    log(opts.debug, init.method ?? "GET", url);

    const res = await fetch(url, {
      ...init,
      signal: controller?.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} ${body}`.trim());
    }

    // 204 / empty body
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch (err) {
    log(opts.debug, "request failed", err);
    if (opts.strict) throw err;
    console.warn("[AutoPromo] request failed:", err);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function postJson<T>(url: string, body: unknown, opts: HttpOptions = {}): Promise<T | null> {
  return request<T>(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    opts,
  );
}

export function getJson<T>(url: string, opts: HttpOptions = {}): Promise<T | null> {
  return request<T>(url, { method: "GET" }, opts);
}
