# AutoPromo SDK

**HackOnVibe 2026 · August 14–16**

AutoPromo is a drop-in SDK that turns real product moments into platform-tailored promotional content, ranks the options using a strategy engine, and opens native compose screens so a human can publish in one tap.

No automatic posting. No paid APIs. No ToS risk.

---

## Live demo

| Page | URL |
|---|---|
| Landing | `/` |
| App dashboard | `/apps/demo-app` |
| Live feed | `/live/demo-app` |
| All apps | `/apps` |
| SDK docs | `/docs` |
| OG share page | `/share/f1` |

---

## How it works

```
Mobile app  →  AutoPromo.track("milestone", { value: "1000_downloads" })
                      ↓
              Backend API  →  Groq LLM (one structured JSON call)
                      ↓
          8 variants per event (4 platforms × 2 tones)
                      ↓
          Strategy Engine ranks by base_weight + 0.5 × (chosen/shown)
                      ↓
         Dashboard shows ranked cards  →  human clicks "Tweet it"
                      ↓
          twitter.com/intent/tweet opens pre-filled  →  human sends
```

---

## SDK integration (3 lines)

```typescript
import AutoPromo from "@autopromo/sdk";

AutoPromo.init({
  apiKey: process.env.AUTOPROMO_KEY,
  appName: "YourApp",
  appUrl: "https://yourapp.com",
});

// Track product moments
AutoPromo.track("launch");
AutoPromo.track("milestone", { value: "1000_downloads" });
AutoPromo.track("new_version", { build: "2.0.0" });
AutoPromo.track("new_review", { rating: 5, body: review.text });

// Open a platform compose screen
const posts = await AutoPromo.getRankedPosts();
await AutoPromo.share(posts[0]);
```

---

## Platforms supported

| Platform | Method |
|---|---|
| Twitter / X | `twitter.com/intent/tweet` — native compose |
| Reddit | `reddit.com/submit` — text or link post |
| WhatsApp | `wa.me/?text=` — share sheet |
| Telegram | `t.me/share/url` — share sheet |
| LinkedIn | `linkedin.com/sharing/share-offsite` + OG share page |
| Facebook | `facebook.com/sharer` + OG share page |

---

## Strategy Engine

```
score = base_weight(event_type, platform)
      + 0.5 × (times_chosen / times_shown)
```

Base weights are hard-coded starting priors. Over time the engine adjusts platform/tone order based on what your team actually publishes. Every post card shows its score in the corner — hover it to see the formula breakdown.

---

## Tech stack (100% free tier)

| Layer | Tool |
|---|---|
| Frontend | TanStack Start (React), TypeScript, Tailwind CSS v4 |
| Database | Supabase (Postgres + Realtime) |
| AI generation | Groq API — Llama 3.3 70B |
| Backend | Vercel Serverless Functions |
| Mobile demo | Expo / React Native |
| Discord | Webhook auto-post on every event (no human click needed) |

---

## Local development

```sh
git clone <repo-url>
cd AutoPromo-SDK
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables (backend, not needed for frontend-only run)

```
GROQ_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DISCORD_WEBHOOK_URL=
```

---

## Business model

| Tier | Price | Limits |
|---|---|---|
| Free | $0 | 20 posts/month · 1 app |
| Builder | $12/month | 200 posts · 3 apps · strategy insights |
| Agency | $39/month | Unlimited posts · unlimited apps · white-label |

---

## Project structure

```
src/
  routes/
    index.tsx          # Landing page + pricing
    apps.index.tsx     # App selector / onboarding
    apps.$appId.tsx    # Per-app dashboard (trigger events, view posts)
    live.$appId.tsx    # Public live feed (dark terminal view)
    docs.index.tsx     # SDK integration guide
    share.$eventId.tsx # OG share page for LinkedIn/Facebook
  components/
    AppShell.tsx       # Sidebar nav + header
    PostCard.tsx       # Individual post with share/copy/regenerate
    PlatformIcon.tsx   # SVG icons for all 6 platforms
    ThemeToggle.tsx    # Light/dark mode toggle
  lib/
    mockData.ts        # All demo data (apps, posts, feed events, stats)
    share.ts           # Share intent URL builders
```

---

Built for [HackOnVibe](https://hackonvibe.com) by the AutoPromo team.
This project was also scaffolded with [Lovable](https://lovable.dev/projects/f0a7b634-fb29-440b-bf30-a3d816b99306).
