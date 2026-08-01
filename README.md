# AutoPromo SDK

**HackOnVibe 2026 · August 14–16**

AutoPromo is a drop-in SDK that turns real product moments into platform-tailored promotional content, ranks the options using a strategy engine, and opens native compose screens so a human can publish in one tap.

No automatic posting. No paid APIs. No ToS risk.

---

## Live demo

| Page | URL |
|---|---|
| Landing | `/` |
| All apps | `/apps` |
| App dashboard | `/apps/demo-app` |
| Event drill-down | `/apps/demo-app/events/:eventId` |
| Analytics | `/analytics` |
| Live feed | `/live/demo-app` |
| SDK docs | `/docs` |
| Settings & API keys | `/settings` |
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
  appId: process.env.AUTOPROMO_APP_ID,
  apiUrl: "https://autopromo.vercel.app/api",
  appUrl: "https://yourapp.com",
});

// Track product moments
AutoPromo.trackLaunch({ stores: ["ios", "android"] });
AutoPromo.trackMilestone({ label: "1000 downloads", count: 1000 });
AutoPromo.trackVersion({ build: "2.0.0", notes: "Added dark mode" });
AutoPromo.trackReview({ rating: 5, text: review.body });

// Open a platform compose screen (a human always presses send)
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

The project is four pieces: a dashboard, an API server, an SDK package, and an Expo demo app.

### 1. Dashboard

```sh
npm install
npm run dev
```

Opens on [http://localhost:8080](http://localhost:8080) (or the next free port).

The dashboard is **live-first**: it reads from the API server below. When that server isn't running it falls back to a bundled sample dataset and labels every affected screen "Sample data" — so a demo never shows blank pages, and sample data never masquerades as real telemetry. The header pill shows which mode you're in.

Point it at a different API with `VITE_API_URL` in a root `.env`:

```
VITE_API_URL=http://localhost:3001/api
```

### 2. API server

```sh
cd server
npm install
cp .env.example .env    # then fill it in
npm run dev
```

Runs on `http://localhost:3001`. Requires Supabase + Groq credentials — see [server/README.md](server/README.md). Run [server/supabase-schema.sql](server/supabase-schema.sql) in the Supabase SQL editor first.

### 3. SDK package

```sh
cd packages/autopromo-sdk
npm install && npm run build
```

See [packages/autopromo-sdk/README.md](packages/autopromo-sdk/README.md) for the full API.

### 4. Expo demo app

```sh
cd autopromo-demo
npm install
npx expo start
```

Scan the QR with Expo Go on a real phone. Set `EXPO_PUBLIC_AUTOPROMO_API_URL` to your machine's **LAN IP**, not `localhost` — on a phone `localhost` is the phone. See [autopromo-demo/README.md](autopromo-demo/README.md).

## Environment variables & where API keys go

**Short answer: secrets go in `server/.env`. Never in the browser, never in localStorage.**

Anything the frontend can read, a visitor can read. Vite compiles every `VITE_`-prefixed variable directly into the JavaScript bundle, so it is public by definition — the same is true of `EXPO_PUBLIC_` in the demo app. Secrets therefore live only on the server, which is the sole component that talks to Supabase and Groq.

### `server/.env` — secret (start from `server/.env.example`)

| Variable | Required | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase → Settings → API → `service_role`. **Bypasses row-level security** |
| `GROQ_API_KEY` | ✅ | [console.groq.com](https://console.groq.com) → API Keys. Billable |
| `DISCORD_WEBHOOK_URL` | — | Discord → channel → Integrations → Webhooks. Blank disables Discord posts |
| `PORT` | — | Defaults to `3001` |
| `FRONTEND_URL` | — | Dashboard origin, for CORS. Defaults to `http://localhost:8080` |
| `ALLOWED_ORIGINS` | — | Extra CORS origins, comma-separated. Add your deployed dashboard URL |

```sh
cd server
cp .env.example .env    # then fill it in
npm run dev
```

The server **validates all of this at boot**. A missing, placeholder, or malformed value stops startup with a message naming the variable and where to get it, instead of failing later as a confusing 500:

```
❌ AutoPromo server can't start — 1 environment problem:

  GROQ_API_KEY — Groq keys start with 'gsk_'
      get it from: console.groq.com → API Keys
```

On a successful boot it prints a masked summary — secret values are never logged in full.

### Root `.env` — public (start from `.env.example`)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the API server. Defaults to `http://localhost:3001/api` |

Only put non-secret values here.

### `autopromo-demo` — public

Set `EXPO_PUBLIC_AUTOPROMO_APP_ID`, `EXPO_PUBLIC_AUTOPROMO_API_URL`, and `EXPO_PUBLIC_AUTOPROMO_APP_URL`. The app ID is an identifier, not a secret — it only lets a client submit events for that app.

### What about the `ap_live_…` keys in the dashboard?

Those are per-app **identifiers** shown on the Settings page for copy-paste into `AutoPromo.init()`. They are not credentials for Groq or Supabase, and nothing in the browser ever holds a real secret.

> `.env` and `.env.*` are gitignored; only `.env.example` files are committed. Set the same variables in your host's dashboard (Vercel → Settings → Environment Variables) when deploying.

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
packages/autopromo-sdk/    # The npm package host apps install
  src/
    index.ts               # init / track* / getRankedPosts / share
    share.ts               # Compose-intent URL builders (all 6 platforms)
    http.ts                # Fetch wrapper — never throws into the host app
    types.ts

autopromo-demo/            # Expo app — the on-stage demo
  App.tsx                  # Fires all 4 event types, renders ranked results
  components/              # EventButton, PostCard, StatusBanner
  config.ts                # APP_ID / API_URL / APP_URL

server/                    # Express API (see server/README.md)
  src/
    routes/                # /api/apps, /event, /posts, /mark-chosen
    strategy.ts            # Strategy Engine scoring
    prompts.ts             # Groq prompt builder
    discord.ts             # Webhook auto-post
  supabase-schema.sql

src/                       # Dashboard (TanStack Start)
  routes/
    index.tsx              # Landing page + pricing
    apps.index.tsx         # App list + connect a new app
    apps.$appId.tsx        # Per-app dashboard — fire events, publish posts
    apps.$appId.events.$eventId.tsx  # Every variant from one event
    analytics.index.tsx    # Cross-app strategy-engine analytics
    settings.index.tsx     # API keys, connection status, env reference
    live.$appId.tsx        # Public live feed (dark terminal view)
    docs.index.tsx         # SDK integration guide
    share.$eventId.tsx     # OG share page for LinkedIn/Facebook
  components/
    AppShell.tsx           # Sidebar nav + header
    PostCard.tsx           # Post with share, copy, score breakdown
    ScoreBreakdown.tsx     # Explains how one post's rank was computed
    StatsChart.tsx         # Shown-vs-published learning signal
    EventTimeline.tsx      # Event → variants → published history
    ConnectionBadge.tsx    # Live / sample-data indicator
    EmptyState.tsx, PostCardSkeleton.tsx, PlatformIcon.tsx, ThemeToggle.tsx
  lib/
    api.ts                 # Typed backend client
    apiTypes.ts            # Wire row shapes
    adapters.ts            # Wire ↔ display translation
    queries.ts             # React Query hooks (live + fallback)
    dataSource.tsx         # Connection state provider
    share.ts               # Dashboard-side share URL builders
    mockData.ts            # Sample dataset used when the API is unreachable
```

---

Built for [HackOnVibe](https://hackonvibe.com) by the AutoPromo team.
This project was also scaffolded with [Lovable](https://lovable.dev/projects/f0a7b634-fb29-440b-bf30-a3d816b99306).
