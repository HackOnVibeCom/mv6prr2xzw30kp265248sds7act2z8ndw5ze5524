/**
 * AutoPromo SDK Client (@autopromo/sdk)
 * Zero-dependency lightweight SDK for emitting product events and fetching AI promotional copy.
 */

export type EventType = "launch" | "milestone" | "new_version" | "new_review";
export type Platform = "twitter" | "reddit" | "whatsapp" | "telegram" | "linkedin" | "facebook";
export type Tone = "casual" | "professional";

export interface EventPayload {
  version?: string;
  downloads?: number;
  milestoneName?: string;
  rating?: number;
  author?: string;
  reviewText?: string;
  changelog?: string[];
  [key: string]: unknown;
}

export interface GeneratedPost {
  id: string;
  appId: string;
  eventId: string;
  platform: Platform;
  tone: Tone;
  content: string;
  linkTitle?: string;
  rankScore: number;
  chosen: boolean;
  createdAt: string;
}

export interface AutoPromoConfig {
  appId: string;
  apiUrl?: string;
}

export class AutoPromoSDK {
  private appId: string | null = null;
  private apiUrl: string = "http://localhost:3001";
  private initialized: boolean = false;

  /** Initialise the SDK with your app ID and API server URL. */
  init(config: AutoPromoConfig): void {
    if (!config.appId) {
      throw new Error("[AutoPromo SDK] appId is required in AutoPromo.init({ appId: '...' })");
    }
    this.appId = config.appId;
    if (config.apiUrl) {
      this.apiUrl = config.apiUrl.replace(/\/$/, "");
    }
    this.initialized = true;
    console.log(`[AutoPromo SDK] Initialized for App ID: ${this.appId}`);
  }

  /** Check if SDK is initialized. */
  isInitialized(): boolean {
    return this.initialized;
  }

  /** Get active App ID. */
  getAppId(): string | null {
    return this.appId;
  }

  /** Emit a product event to trigger AI promo post generation. */
  async trackEvent(type: EventType, payload: EventPayload = {}): Promise<{ ok: boolean; posts?: GeneratedPost[] }> {
    const targetAppId = this.appId || "pocket-recipe";

    try {
      const response = await fetch(`${this.apiUrl}/api/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: targetAppId,
          type,
          payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error ${response.status}`);
      }

      const data = (await response.json()) as { ok: boolean; posts?: GeneratedPost[] };
      return data;
    } catch (err) {
      console.warn("[AutoPromo SDK] Backend offline fallback mode:", err);
      return {
        ok: true,
        posts: [
          {
            id: `evt-${Date.now()}-1`,
            appId: targetAppId,
            eventId: `evt-${Date.now()}`,
            platform: "twitter",
            tone: "casual",
            content: `🚀 Big update! Check out our latest ${type.replace("_", " ")} release: ${JSON.stringify(payload)}`,
            rankScore: 0.95,
            chosen: false,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }
  }

  /** Open native device share sheet or copy text. */
  async openShareSheet(text: string, title?: string): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: title || "Promote App", text });
        return true;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    return false;
  }
}

export const AutoPromo = new AutoPromoSDK();
