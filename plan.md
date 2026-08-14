# AutoPromo SDK — Complete HackOnVibe Build Plan

**Hackathon:** HackOnVibe · August 14–16, 2026
**Theme:** Best practical code integration for actual promotion of a newly created mobile application
**Project:** AutoPromo SDK — an AI-driven, code-level promotion layer that any newly launched mobile app can plug in, generating platform-tailored content and opening real native "create post" screens for humans to publish with one click.

This document is the single source of truth for the entire build. Everything you need — architecture, accounts to create, database schema, SDK code, backend code, AI prompts, dashboard structure, live feed, demo app, hour-by-hour schedule, and submission materials — is in here. Follow it top to bottom during the weekend.

---

## Table of Contents

1. Project Overview
2. Why This Wins Against the Theme
3. Goals and Non-Goals
4. System Architecture
5. Tech Stack (100% Free Tier)
6. Account & Service Setup Checklist
7. Environment Variables Reference
8. Database Schema (Supabase / Postgres)
9. SDK Design and Code
10. Backend API Design and Code
11. AI Prompt Templates (all event types × tones)
12. Strategy Engine Logic
13. Share-Intent / Compose-Intent Layer
14. Discord Auto-Post Integration
15. Dashboard (Next.js) Structure and Code
16. Live Feed Page (Public, Real-Time)
17. Demo Mobile App (Expo) Structure and Code
18. Onboarding a Real Third-Party App (Score Booster)
19. Testing Checklist
20. Hour-by-Hour Weekend Build Schedule
21. Risk List and Mitigations
22. Business Model Details
23. Go-To-Market Plan
24. Judging Rubric Mapping (Self-Score Before Submission)
25. Demo Video Script (5 Minutes)
26. Questionnaire Answer Draft
27. Submission Checklist
28. Stretch Goals (If Time Remains)
29. Appendix: Full File Tree
30. Appendix: All Copy-Paste Code Blocks Index

---

## 1. Project Overview

AutoPromo SDK is a lightweight, free, drop-in code library plus a small backend and dashboard. A mobile app integrates the SDK with a handful of function calls tied to real product moments:

- App first launched
- User hit a milestone (e.g., "1,000th download", "invited a friend", "completed onboarding")
- New version shipped
- New user review received

Each of these events is sent to a backend, which asks a free-tier LLM (Groq) to write platform-tailored promotional copy — a tweet, a Reddit post, a WhatsApp referral message, a LinkedIn-ready link page, a Telegram share, a Facebook-ready link page. A lightweight "Strategy Engine" ranks which platforms and tones are worth showing first, based on the event type and on what a human has actually chosen to post before for that app.

Rather than attempting to auto-post directly (which requires paid/gated APIs on most platforms and creates spam risk), AutoPromo opens the platform's own native "create post" screen with the AI-written content pre-loaded. The human reviews and clicks post themselves. This keeps everything free, ToS-compliant, and fully verifiable live by anyone watching — exactly what the hackathon judging criteria ask for.

A public live feed page shows every event and generated post for an app in real time, so judges (or anyone) can watch the whole loop work without needing access to your codebase or any account.

---

## 2. Why This Wins Against the Theme

The exact theme wording: *"Best practical code integration for actual promotion of a newly created mobile application. Priority will be given to those implementations that have a practical implementation that judges can verify (description of an idea is not evaluated)."*

Mapping:

- **"Code integration"** → the SDK is literally 3–5 lines of code dropped into any app; nothing about this project is conceptual.
- **"Actual promotion"** → real platform compose screens open with real, usable content; a human can genuinely publish a real post to a real platform during the judging session.
- **"Newly created mobile application"** → the target user is explicitly a just-launched app with no existing marketing infrastructure; the demo app plus, ideally, one other team's real app, both qualify.
- **"Practical implementation that judges can verify"** → the live feed page, the working SDK, and the live compose-intent buttons mean judges do not have to trust a description — they can trigger an event themselves and watch content appear and a real Twitter/Reddit/WhatsApp window open.

---

## 3. Goals and Non-Goals

### Goals for the weekend

- A working, installable SDK with at least 4 trackable event types.
- A deployed backend that receives events, calls an LLM, stores results, and serves a dashboard.
- Real, working share-intent buttons for at least 4 platforms (Twitter/X, Reddit, WhatsApp, Telegram), plus OG-based share pages for LinkedIn and Facebook.
- A Strategy Engine that ranks generated content by a transparent, explainable scoring formula that updates from human choices.
- A public live feed page updating in real time via Supabase Realtime.
- A demo Expo app that can trigger all four event types on stage.
- Ideally, one other hackathon team's app also wired in, to prove third-party viability.
- A clear, numeric business model and go-to-market plan.
- A polished 5-minute demo video and completed questionnaire.

### Non-goals (explicitly out of scope, do not waste time on these)

- Real automatic posting to Instagram or YouTube (no free API path exists — state this limitation confidently rather than trying to hack around it).
- Publishing to real app stores (Apple/Google developer accounts cost money and require review time you do not have).
- Building a custom ML model for the Strategy Engine — a transparent weighted formula is enough and is easier to explain to judges anyway.
- Building user authentication/login systems for the dashboard — for a hackathon MVP, an unauthenticated or simple shared-link dashboard is fine.
- Native iOS/Android SDKs — a single JS/TS package usable from Expo/React Native is sufficient.

---

## 4. System Architecture

### 4.1 Component diagram (text form)

```
Demo App (Expo/React Native)
   |
   |  AutoPromo.trackX(...)  [SDK call, HTTPS POST]
   v
Backend API (Vercel Serverless Functions, Node/TypeScript)
   |
   |--> Groq API (LLM call: generate N content variants)
   |
   |--> Supabase Postgres (store events, generated_posts, platform_stats)
   |
   |--> Discord Webhook (auto-post a summary, no human click needed)
   |
   v
Supabase Realtime (Postgres change stream)
   |
   |--> Dashboard (Next.js, deployed on Vercel) — human reviews & clicks share buttons
   |--> Live Feed Page (Next.js, public route) — read-only real-time timeline
   |
   v
Share-Intent Layer (client-side JS, no backend needed)
   |--> Opens native compose screens: Twitter, Reddit, WhatsApp, Telegram
   |--> Opens OG-metadata share pages for LinkedIn, Facebook
```

### 4.2 Request lifecycle for a single event

1. Demo app calls `AutoPromo.trackMilestone({ label: "1000 downloads" })`.
2. SDK POSTs `{ appId, type: "milestone", payload: { label: "1000 downloads" } }` to `/api/event`.
3. Backend validates payload, inserts a row into `events`.
4. Backend builds prompts for each of the four core platforms (Twitter, Reddit, WhatsApp, LinkedIn) times two tones (casual, professional) = 8 generation calls (can be batched into fewer LLM calls using a single structured-JSON prompt — see Section 11).
5. Backend calls Groq once (structured JSON output) to get all 8 variants back in one round trip.
6. Backend computes a `rank_score` per variant using the Strategy Engine formula (Section 12), reading current `platform_stats` for this app.
7. Backend inserts all variants into `generated_posts`, sorted by `rank_score`.
8. Backend posts a short summary message to the Discord webhook automatically (no human involved — this is your always-on, fully automatic integration).
9. Supabase Realtime pushes the new rows to any subscribed clients (dashboard, live feed).
10. Dashboard renders the new post cards, best-ranked first, each with a platform-appropriate "Post" button.
11. Human clicks "Post to Twitter" → SDK/dashboard opens `twitter.com/intent/tweet?...` in a new tab/window with content pre-filled → human reviews and clicks Tweet.
12. Dashboard marks that `generated_posts` row as `chosen = true` and increments `platform_stats.times_chosen` for that platform/tone combination.
13. Live feed page shows the whole sequence as it happened, timestamped.

---

## 5. Tech Stack (100% Free Tier)

| Layer | Tool | Free tier notes |
|---|---|---|
| Demo mobile app | Expo (React Native), TypeScript | Free, run in Expo Go app, no build fees |
| SDK | Custom TypeScript package, consumed via local import or npm publish | Free to publish to npm under an unscoped/scoped free package name |
| Backend | Vercel Serverless Functions | Free hobby tier is enough for hackathon traffic |
| AI generation | Groq API (Llama 3.1/3.3 8B or 70B) | Free tier, very fast responses — good for live demo |
| Database | Supabase (Postgres) | Free tier: enough rows/storage for a hackathon project |
| Realtime | Supabase Realtime (built into the same free project) | No extra cost |
| Dashboard | Next.js (App Router), deployed on Vercel | Free |
| Live feed | Next.js route + Supabase Realtime subscription | Free |
| Discord integration | Discord Webhook URL | Free, instant, no OAuth needed |
| Social compose | Native share-intent URLs (Twitter, Reddit, WhatsApp, Telegram) + Open Graph share pages (LinkedIn, Facebook) | Free, no API keys, no app review |
| Version control | GitHub | Free, required by the hackathon anyway |
| Design/UI | Tailwind CSS | Free, fast to style consistently |

No component in this stack requires a credit card or paid tier to complete the hackathon build and demo.

---

## 6. Account & Service Setup Checklist

Do these before Friday's kickoff so build time isn't lost to signups.

- [ ] GitHub account + create the team repo (or accept the hackathon-issued repo invite)
- [ ] Groq account → console.groq.com → create API key → store safely, do not commit to git
- [ ] Supabase account → new project → note Project URL, anon key, service role key
- [ ] Vercel account → connect GitHub → import repo (can do this once repo exists)
- [ ] Discord server (can be your own test server) → a text channel → Integrations → Webhooks → New Webhook → copy URL
- [ ] Expo account (optional, only needed if using EAS; not required to just run via Expo Go)
- [ ] Decide on a project domain/subdomain name if using a custom Vercel domain (optional — the default `*.vercel.app` URL is fine)

---

## 7. Environment Variables Reference

Create a `.env.local` file (never commit this) with:

```
GROQ_API_KEY=your_groq_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxx/yyyy
```

Add the same variables in the Vercel project's dashboard under Settings → Environment Variables before deploying, or deploys will fail at runtime when these are read.

Rules:
- `SUPABASE_SERVICE_ROLE_KEY` must only ever be used in backend/serverless code, never shipped to the client bundle.
- `NEXT_PUBLIC_` prefixed variables are safe for client-side use (anon key is designed to be public, protected by row-level security rules).
- `GROQ_API_KEY` and `DISCORD_WEBHOOK_URL` must only be used server-side.

---

## 8. Database Schema (Supabase / Postgres)

Run this SQL in the Supabase SQL editor to set up all tables in one pass.

```sql
-- Apps being promoted
create table apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  created_at timestamptz not null default now()
);

-- Raw events fired by the SDK
create table events (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references apps(id) on delete cascade,
  type text not null check (type in ('launch', 'milestone', 'new_version', 'new_review')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- AI-generated content variants tied to an event
create table generated_posts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  app_id uuid not null references apps(id) on delete cascade,
  platform text not null check (platform in ('twitter', 'reddit', 'whatsapp', 'telegram', 'linkedin', 'facebook')),
  tone text not null check (tone in ('casual', 'professional')),
  content text not null,
  link_title text,        -- used for reddit title / OG title
  rank_score numeric not null default 0,
  chosen boolean not null default false,
  created_at timestamptz not null default now()
);

-- Rolling stats used by the Strategy Engine to learn preferences per app
create table platform_stats (
  app_id uuid not null references apps(id) on delete cascade,
  platform text not null,
  tone text not null,
  times_shown int not null default 0,
  times_chosen int not null default 0,
  primary key (app_id, platform, tone)
);

-- Enable realtime on the tables the dashboard/live feed will subscribe to
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table generated_posts;
```

Optional but recommended row-level security (RLS) policies for a public-read live feed while keeping writes backend-only:

```sql
alter table apps enable row level security;
alter table events enable row level security;
alter table generated_posts enable row level security;
alter table platform_stats enable row level security;

-- Public read access (needed for the live feed page using the anon key)
create policy "public read apps" on apps for select using (true);
create policy "public read events" on events for select using (true);
create policy "public read generated_posts" on generated_posts for select using (true);

-- Writes only via service role key (server-side), so no insert/update policy is created for anon
```

---

## 9. SDK Design and Code

### 9.1 Package structure

```
autopromo-sdk/
  src/
    index.ts
    types.ts
    http.ts
  package.json
  tsconfig.json
```

### 9.2 `types.ts`

```typescript
export interface AutoPromoConfig {
  appId: string;
  apiUrl: string; // e.g. "https://autopromo.vercel.app/api"
}

export interface MilestonePayload {
  label: string; // e.g. "1000 downloads"
}

export interface VersionPayload {
  notes: string; // changelog text
}

export interface ReviewPayload {
  text: string;
  rating: number; // 1-5
}
```

### 9.3 `http.ts`

```typescript
export async function postEvent(apiUrl: string, body: unknown): Promise<void> {
  try {
    await fetch(`${apiUrl}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    // Fail silently in production so a network hiccup never crashes the host app.
    console.warn("[AutoPromo] failed to send event", err);
  }
}
```

### 9.4 `index.ts`

```typescript
import { postEvent } from "./http";
import { AutoPromoConfig, MilestonePayload, VersionPayload, ReviewPayload } from "./types";

let config: AutoPromoConfig | null = null;

function init(cfg: AutoPromoConfig) {
  config = cfg;
}

function requireConfig(): AutoPromoConfig {
  if (!config) {
    throw new Error("AutoPromo.init() must be called before tracking events.");
  }
  return config;
}

function trackLaunch() {
  const cfg = requireConfig();
  return postEvent(cfg.apiUrl, { appId: cfg.appId, type: "launch", payload: {} });
}

function trackMilestone(payload: MilestonePayload) {
  const cfg = requireConfig();
  return postEvent(cfg.apiUrl, { appId: cfg.appId, type: "milestone", payload });
}

function trackVersion(payload: VersionPayload) {
  const cfg = requireConfig();
  return postEvent(cfg.apiUrl, { appId: cfg.appId, type: "new_version", payload });
}

function trackReview(payload: ReviewPayload) {
  const cfg = requireConfig();
  return postEvent(cfg.apiUrl, { appId: cfg.appId, type: "new_review", payload });
}

const AutoPromo = { init, trackLaunch, trackMilestone, trackVersion, trackReview };
export default AutoPromo;
```

### 9.5 Usage inside any Expo/React Native app

```typescript
import AutoPromo from "autopromo-sdk";

AutoPromo.init({
  appId: "REPLACE_WITH_APP_UUID",
  apiUrl: "https://autopromo.vercel.app/api",
});

// On first mount
AutoPromo.trackLaunch();

// When a milestone button is pressed in the demo
AutoPromo.trackMilestone({ label: "1000 downloads" });
```

This is the entire "code integration" a third-party app needs — copy the package, call `init`, call the tracker functions at the right moments.

---

## 10. Backend API Design and Code

### 10.1 Endpoints

| Route | Method | Purpose |
|---|---|---|
| `/api/event` | POST | Receive an SDK event, trigger generation pipeline |
| `/api/posts` | GET | Fetch generated posts for a given app (dashboard use) |
| `/api/mark-chosen` | POST | Mark a post as chosen, update platform_stats |
| `/api/apps` | POST | Create a new app record (used once per onboarded app) |

### 10.2 `/api/apps` (create an app record)

```typescript
// pages/api/apps.ts (or app/api/apps/route.ts if using App Router)
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { name, description } = req.body;

  const { data, error } = await supabase
    .from("apps")
    .insert({ name, description })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
}
```

### 10.3 `/api/event` (the core pipeline)

```typescript
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const PLATFORMS = ["twitter", "reddit", "whatsapp", "linkedin"] as const;
const TONES = ["casual", "professional"] as const;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { appId, type, payload } = req.body;

  // 1. Fetch app context
  const { data: app } = await supabase.from("apps").select("*").eq("id", appId).single();
  if (!app) return res.status(404).json({ error: "App not found" });

  // 2. Store the raw event
  const { data: eventRow } = await supabase
    .from("events")
    .insert({ app_id: appId, type, payload })
    .select()
    .single();

  // 3. Build a single structured prompt asking for all variants at once
  const prompt = buildPrompt(app, type, payload);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const variants = JSON.parse(completion.choices[0].message.content); 
  // expected shape: { posts: [{ platform, tone, content, link_title }, ...] }

  // 4. Fetch current platform_stats for ranking
  const { data: stats } = await supabase
    .from("platform_stats")
    .select("*")
    .eq("app_id", appId);

  // 5. Score + insert each variant
  const rows = variants.posts.map((v) => ({
    event_id: eventRow.id,
    app_id: appId,
    platform: v.platform,
    tone: v.tone,
    content: v.content,
    link_title: v.link_title || null,
    rank_score: computeRankScore(type, v.platform, v.tone, stats),
  }));

  await supabase.from("generated_posts").insert(rows);

  // 6. Ensure platform_stats rows exist (increment times_shown)
  for (const row of rows) {
    await supabase.rpc("increment_times_shown", {
      p_app_id: appId,
      p_platform: row.platform,
      p_tone: row.tone,
    });
  }

  // 7. Fire-and-forget Discord auto-post (always automatic, no human click)
  postToDiscord(app.name, type, payload).catch(() => {});

  return res.status(200).json({ ok: true, generated: rows.length });
}

function buildPrompt(app, type, payload) {
  return `
You are a marketing copywriter. Generate promotional social posts for a mobile app.

App name: ${app.name}
App description: ${app.description}
Event type: ${type}
Event details: ${JSON.stringify(payload)}

Generate exactly one post for each combination of platform and tone below.
Platforms: twitter, reddit, whatsapp, linkedin
Tones: casual, professional

Rules:
- twitter: under 280 characters, may include up to 2 relevant hashtags
- reddit: needs both a short "link_title" (under 100 chars) and a longer "content" body suitable for a text post
- whatsapp: warm, personal, written as if sent to a friend, include a placeholder [LINK]
- linkedin: needs a "link_title" and a short professional "content" summary (this will be used as Open Graph metadata, not posted directly)

Respond ONLY with valid JSON in this exact shape, no extra commentary:
{
  "posts": [
    { "platform": "twitter", "tone": "casual", "content": "..." },
    { "platform": "twitter", "tone": "professional", "content": "..." },
    { "platform": "reddit", "tone": "casual", "content": "...", "link_title": "..." },
    { "platform": "reddit", "tone": "professional", "content": "...", "link_title": "..." },
    { "platform": "whatsapp", "tone": "casual", "content": "..." },
    { "platform": "whatsapp", "tone": "professional", "content": "..." },
    { "platform": "linkedin", "tone": "casual", "content": "...", "link_title": "..." },
    { "platform": "linkedin", "tone": "professional", "content": "...", "link_title": "..." }
  ]
}
`;
}

async function postToDiscord(appName, type, payload) {
  await fetch(process.env.DISCORD_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `📣 **${appName}** just triggered a **${type}** event: ${JSON.stringify(payload)}. AutoPromo generated new posts — check the dashboard.`,
    }),
  });
}
```

### 10.4 `/api/mark-chosen`

```typescript
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { postId, appId, platform, tone } = req.body;

  await supabase.from("generated_posts").update({ chosen: true }).eq("id", postId);

  await supabase.rpc("increment_times_chosen", {
    p_app_id: appId,
    p_platform: platform,
    p_tone: tone,
  });

  return res.status(200).json({ ok: true });
}
```

### 10.5 Supporting Postgres functions (run once in Supabase SQL editor)

```sql
create or replace function increment_times_shown(p_app_id uuid, p_platform text, p_tone text)
returns void as $$
begin
  insert into platform_stats (app_id, platform, tone, times_shown, times_chosen)
  values (p_app_id, p_platform, p_tone, 1, 0)
  on conflict (app_id, platform, tone)
  do update set times_shown = platform_stats.times_shown + 1;
end;
$$ language plpgsql;

create or replace function increment_times_chosen(p_app_id uuid, p_platform text, p_tone text)
returns void as $$
begin
  update platform_stats
  set times_chosen = times_chosen + 1
  where app_id = p_app_id and platform = p_platform and tone = p_tone;
end;
$$ language plpgsql;
```

---

## 11. AI Prompt Templates (all event types × tones)

The single structured prompt in Section 10.3 is reusable across all event types by changing `type` and `payload`. Reference examples for each:

**Launch event**
```
Event type: launch
Event details: {}
```
Expected tone: announcing the app exists for the first time, inviting people to try it.

**Milestone event**
```
Event type: milestone
Event details: { "label": "1000 downloads" }
```
Expected tone: celebratory, social-proof driven ("join the 1000 people already using...").

**New version event**
```
Event type: new_version
Event details: { "notes": "Added dark mode and offline support" }
```
Expected tone: feature-focused, "here's what's new," encourages existing users to update and share.

**New review event**
```
Event type: new_review
Event details: { "text": "Love this app but wish it had X", "rating": 4 }
```
For this event type only, also add a second prompt asking specifically for a **reply draft** (not a promotional post):

```
Additionally generate a "reply_draft" field: a warm, appreciative reply to this review, acknowledging the feedback and mentioning that the suggestion has been noted. If rating is 3 or below, make the tone extra empathetic and offer a way to follow up (e.g., "please reach out at support@...").
```

Add `reply_draft` to the JSON response shape for this event type and surface it in the dashboard as a separate "Suggested Reply" card, distinct from the promotional post cards.

---

## 12. Strategy Engine Logic

### 12.1 Purpose
Turn "AI writes text" into "AI makes a ranking decision that improves over time" — this is what elevates the AI functionality score.

### 12.2 Base weight table (hard-coded starting priors)

| Event type | Twitter | Reddit | WhatsApp | LinkedIn |
|---|---|---|---|---|
| launch | 0.8 | 0.7 | 0.5 | 0.6 |
| milestone | 0.9 | 0.6 | 0.5 | 0.7 |
| new_version | 0.6 | 0.5 | 0.4 | 0.7 |
| new_review | 0.3 | 0.2 | 0.2 | 0.3 |

(new_review rows score lower across the board because that event type is mostly about the reply draft, not public promotion.)

### 12.3 Scoring formula

```
final_score = base_weight(event_type, platform)
            + adjustment_factor * (times_chosen / max(times_shown, 1))
```

Where `adjustment_factor` is a constant, e.g. `0.5`, tunable during testing. This is simple enough to compute in a single SQL query or in the serverless function after fetching `platform_stats`.

```typescript
function computeRankScore(eventType, platform, tone, stats) {
  const base = BASE_WEIGHTS[eventType]?.[platform] ?? 0.4;
  const row = stats?.find((s) => s.platform === platform && s.tone === tone);
  const ratio = row && row.times_shown > 0 ? row.times_chosen / row.times_shown : 0;
  const adjustmentFactor = 0.5;
  return base + adjustmentFactor * ratio;
}
```

### 12.4 How to narrate this to judges
"The Strategy Engine starts with reasonable defaults about which platform fits which event, then adjusts those weights based on which posts humans actually choose to publish for this specific app — so over time, AutoPromo learns this app's audience preferences instead of treating every app the same." This is accurate and does not overstate what a straightforward weighted-ratio formula does.

---

## 13. Share-Intent / Compose-Intent Layer

### 13.1 Client-side helper functions

```typescript
export function shareToTwitter(text: string) {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function shareToReddit(title: string, link: string) {
  const url = `https://www.reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(link)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function shareToRedditText(title: string, text: string) {
  const url = `https://www.reddit.com/submit?title=${encodeURIComponent(title)}&selftext=true&text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function shareToWhatsApp(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function shareToTelegram(text: string, link: string) {
  const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function shareToLinkedIn(shareUrl: string) {
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function shareToFacebook(shareUrl: string) {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
```

### 13.2 Dynamic OG share page for LinkedIn/Facebook

Since LinkedIn and Facebook pull title/description from Open Graph tags rather than accepting arbitrary text via URL, generate one dynamic page per event.

```typescript
// pages/share/[eventId].tsx (Next.js Pages Router example)
export async function getServerSideProps({ params }) {
  const { data: post } = await supabase
    .from("generated_posts")
    .select("*")
    .eq("event_id", params.eventId)
    .eq("platform", "linkedin")
    .single();

  return { props: { post } };
}

export default function SharePage({ post }) {
  return (
    <html>
      <head>
        <meta property="og:title" content={post.link_title} />
        <meta property="og:description" content={post.content} />
        <meta property="og:type" content="website" />
      </head>
      <body>
        <h1>{post.link_title}</h1>
        <p>{post.content}</p>
      </body>
    </html>
  );
}
```

### 13.3 Marking a post as chosen when a share button is clicked

```typescript
async function handleShareClick(post) {
  if (post.platform === "twitter") shareToTwitter(post.content);
  if (post.platform === "reddit") shareToReddit(post.link_title, post.shareUrl);
  if (post.platform === "whatsapp") shareToWhatsApp(post.content);
  if (post.platform === "telegram") shareToTelegram(post.content, post.shareUrl);
  if (post.platform === "linkedin") shareToLinkedIn(post.shareUrl);
  if (post.platform === "facebook") shareToFacebook(post.shareUrl);

  await fetch("/api/mark-chosen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      postId: post.id,
      appId: post.app_id,
      platform: post.platform,
      tone: post.tone,
    }),
  });
}
```

---

## 14. Discord Auto-Post Integration

This is your one fully hands-off, always-automatic integration — no human click required, always fires the moment an event is processed. Already implemented in Section 10.3's `postToDiscord` function. To set up:

1. Open Discord → your server → a text channel → channel settings gear icon.
2. Integrations → Webhooks → New Webhook.
3. Name it (e.g. "AutoPromo Bot"), copy the Webhook URL.
4. Paste into `.env.local` as `DISCORD_WEBHOOK_URL` and into Vercel's environment variables.
5. Test with a manual curl call before relying on it in the pipeline:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"content": "Test message from AutoPromo"}' \
  https://discord.com/api/webhooks/xxxx/yyyy
```

---

## 15. Dashboard (Next.js) Structure and Code

### 15.1 Page structure

```
dashboard/
  app/
    page.tsx            -- app selector / overview
    apps/[appId]/page.tsx -- per-app dashboard with generated posts
    share/[eventId]/page.tsx -- OG share page (Section 13.2)
    live/[appId]/page.tsx    -- public live feed (Section 16)
  components/
    PostCard.tsx
    EventTimeline.tsx
    StatsChart.tsx
  lib/
    supabaseClient.ts
    shareIntents.ts       -- Section 13.1 functions
```

### 15.2 `lib/supabaseClient.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 15.3 `components/PostCard.tsx`

```typescript
import { handleShareClick } from "../lib/shareActions";

export default function PostCard({ post }) {
  return (
    <div className="border rounded-lg p-4 mb-3 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs uppercase font-semibold text-gray-500">
          {post.platform} · {post.tone}
        </span>
        <span className="text-xs text-gray-400">
          score: {post.rank_score.toFixed(2)}
        </span>
      </div>
      <p className="text-sm mb-3">{post.content}</p>
      <button
        onClick={() => handleShareClick(post)}
        className="px-3 py-1.5 rounded bg-black text-white text-sm"
        disabled={post.chosen}
      >
        {post.chosen ? "Posted ✓" : `Post to ${post.platform}`}
      </button>
    </div>
  );
}
```

### 15.4 `app/apps/[appId]/page.tsx` (fetch + sort + render)

```typescript
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import PostCard from "../../../components/PostCard";

export default function AppDashboard({ params }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("generated_posts")
        .select("*")
        .eq("app_id", params.appId)
        .order("rank_score", { ascending: false });
      setPosts(data || []);
    };
    load();

    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "generated_posts", filter: `app_id=eq.${params.appId}` },
        (payload) => setPosts((prev) => [payload.new, ...prev].sort((a, b) => b.rank_score - a.rank_score))
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [params.appId]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">AutoPromo Dashboard</h1>
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
```

---

## 16. Live Feed Page (Public, Real-Time)

### 16.1 Purpose
This is the single screen you keep on-camera longest during judging — a public, no-login page that streams events and generated posts as they happen, proving the system works live rather than being pre-recorded or faked.

### 16.2 `app/live/[appId]/page.tsx`

```typescript
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function LiveFeed({ params }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const loadInitial = async () => {
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .eq("app_id", params.appId)
        .order("created_at", { ascending: false })
        .limit(20);
      setItems(events || []);
    };
    loadInitial();

    const channel = supabase
      .channel("live-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events", filter: `app_id=eq.${params.appId}` },
        (payload) => setItems((prev) => [payload.new, ...prev])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [params.appId]);

  return (
    <div className="max-w-xl mx-auto p-6 font-mono text-sm">
      <h1 className="text-lg font-bold mb-4">Live Promotion Feed</h1>
      {items.map((item) => (
        <div key={item.id} className="border-b py-2">
          <span className="text-gray-400">{new Date(item.created_at).toLocaleTimeString()}</span>
          {" — "}
          <span className="font-semibold">{item.type}</span>
          {" — "}
          <span>{JSON.stringify(item.payload)}</span>
        </div>
      ))}
    </div>
  );
}
```

This page needs no authentication since RLS policies (Section 8) allow public read access via the anon key.

---

## 17. Demo Mobile App (Expo) Structure and Code

### 17.1 Setup

```bash
npx create-expo-app autopromo-demo
cd autopromo-demo
npm install
```

### 17.2 `App.tsx`

```typescript
import { useEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import AutoPromo from "./autopromo-sdk"; // local import during hackathon, or npm package once published

AutoPromo.init({
  appId: "REPLACE_WITH_REAL_APP_UUID",
  apiUrl: "https://autopromo.vercel.app/api",
});

export default function App() {
  useEffect(() => {
    AutoPromo.trackLaunch();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AutoPromo Demo App</Text>

      <Button
        title="Simulate 1000th download"
        onPress={() => AutoPromo.trackMilestone({ label: "1000 downloads" })}
      />

      <View style={styles.spacer} />

      <Button
        title="Simulate new version shipped"
        onPress={() => AutoPromo.trackVersion({ notes: "Added dark mode and offline support" })}
      />

      <View style={styles.spacer} />

      <Button
        title="Simulate new review"
        onPress={() => AutoPromo.trackReview({ text: "Love this app but wish it had more themes", rating: 4 })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 30 },
  spacer: { height: 15 },
});
```

Run with `npx expo start`, scan the QR code with Expo Go on your phone for a genuinely live, physical-device demo.

---

## 18. Onboarding a Real Third-Party App (Score Booster)

This is the single highest-leverage action for pushing your score up, per the earlier evaluation. Steps:

1. During Friday/Saturday, post in the hackathon Discord asking if any team wants a free, zero-effort promotion integration for their app.
2. For their app: create one `apps` row via `/api/apps` (or directly in Supabase table editor) with their real app name/description.
3. Give them the SDK snippet (Section 9.5) with their own `appId` — ask them to add just the `trackLaunch()` call, or even simpler, trigger events from Postman/curl on their behalf if they don't have time to integrate code themselves during their own build.
4. During your demo video, show their real app name and real generated content, and mention explicitly: "This is Team [X]'s app — we integrated AutoPromo into a real, separate project during this same hackathon."

If no team is willing or time doesn't allow, this is not fatal — the demo app plus a clearly stated "designed to integrate into any newly launched app, here's the SDK snippet" is still strong, just slightly less compelling than third-party proof.

---

## 19. Testing Checklist

Before recording the demo video, verify every one of these works:

- [ ] `AutoPromo.trackLaunch()` fires and a row appears in `events`
- [ ] Groq call returns valid JSON matching the expected shape (test with a raw curl/Postman call first before wiring to the UI)
- [ ] `generated_posts` rows are created correctly for all 4 platforms × 2 tones
- [ ] Discord webhook message appears within a few seconds of the event firing
- [ ] Dashboard renders posts sorted by `rank_score` descending
- [ ] Clicking "Post to Twitter" opens a real Twitter compose window with correct pre-filled text
- [ ] Clicking "Post to Reddit" opens Reddit's submit page with correct title
- [ ] Clicking "Post to WhatsApp" opens the WhatsApp share flow with correct text
- [ ] Clicking "Post to LinkedIn" opens LinkedIn's share dialog and correctly pulls the OG title/description from your share page
- [ ] Marking a post as chosen correctly increments `platform_stats.times_chosen`
- [ ] Live feed page updates within 1–2 seconds of a new event, without a manual page refresh
- [ ] Everything works on a fresh incognito browser tab (no leftover local state assumptions)
- [ ] Mobile demo app runs cleanly via Expo Go on an actual phone, not just a simulator

---

## 20. Hour-by-Hour Weekend Build Schedule

### Friday, August 14

- 12:00 PM MT — Attend kickoff call
- 1:00–2:00 PM — Create Supabase project, run schema SQL from Section 8
- 2:00–3:00 PM — Create Groq API key, test a raw prompt call via curl/Postman
- 3:00–4:00 PM — Set up Discord webhook, test with a manual curl call
- 4:00–6:00 PM — Scaffold Next.js dashboard project, scaffold Expo demo app, push initial commits to the hackathon repo (this satisfies the "push Hello world" pipeline check if not already done)

### Saturday, August 15

- 9:00–11:00 AM — Build `/api/event` endpoint end-to-end (Section 10.3), test with curl before touching UI
- 11:00 AM–1:00 PM — Build SDK package (Section 9), wire into the Expo demo app
- 1:00–2:00 PM — Break / mentor session (bring business model + technical questions)
- 2:00–4:00 PM — Build dashboard PostCard + AppDashboard page with realtime subscription (Section 15)
- 4:00–5:00 PM — Build Strategy Engine scoring (Section 12) and wire into `/api/event`
- 5:00–6:30 PM — Build share-intent functions and OG share pages (Section 13)
- 6:30–7:30 PM — Reach out in hackathon Discord to onboard one other team's app (Section 18)
- 7:30–9:00 PM — Buffer / fix bugs found during testing

### Sunday, August 16

- 9:00–10:30 AM — Build live feed page (Section 16)
- 10:30 AM–12:00 PM — Full run-through of the Testing Checklist (Section 19), fix anything broken
- 12:00–1:00 PM — Polish dashboard styling (Tailwind), make sure it looks intentional, not default
- 1:00–2:30 PM — Record demo video (see script in Section 25); do at least 2 takes
- 2:30–3:30 PM — Fill out questionnaire (Section 26 draft as starting point)
- 3:30–4:30 PM — Final push to GitHub repo, double-check it's before the 9:00 PM MT cutoff with buffer
- 4:30 PM onward — Buffer time for anything unexpected before the hard 9:00 PM MT deadline

---

## 21. Risk List and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Groq API rate limits hit during live demo | Low-Medium | Test well in advance; have a cached/fallback set of pre-generated posts ready to show if live generation is slow during recording |
| LinkedIn/Facebook OG scraping doesn't refresh instantly (platforms cache OG tags) | Medium | Use unique per-event URLs (`/share/[eventId]`) so each is scraped fresh; test at least an hour before recording, not minutes before |
| Third-party team backs out of onboarding | Medium | Not fatal — demo app alone is still a strong, complete story; don't over-promise this to teammates as a hard dependency |
| Supabase Realtime subscription flakiness | Low | Always also fetch on page load (not relying purely on realtime), so a missed realtime event doesn't leave the UI stale on refresh |
| Running out of time for polish | Medium-High | Follow the hour-by-hour schedule strictly; cut Facebook/Telegram support first if behind schedule, keep Twitter/Reddit/WhatsApp/LinkedIn as the non-negotiable core four |
| Reddit flags test posts as spam | Low | Only post to a subreddit you created yourself for testing, never a real community, until judges are watching a live human-initiated action |

---

## 22. Business Model Details

| Tier | Price | Included |
|---|---|---|
| Free | $0/month | 20 AI-generated posts/month, 1 app |
| Builder | $12/month | 200 posts/month, 3 apps, Strategy Engine insights dashboard |
| Agency | $39/month | Unlimited posts, unlimited apps, white-label dashboard for managing multiple client launches |

Market sizing talking point: a large and steadily growing number of new indie apps are submitted to app stores and to communities like Product Hunt every month — cite this as your addressable market, and note that your first realistic customers are reachable directly through indie developer and hackathon communities you already have access to (Discord, Indie Hackers, Product Hunt, r/SideProject).

Unit economics talking point: since generation costs are Groq's free tier during early growth, and share-intent posting requires zero paid API access, gross margin on the paid tiers is very high compared to tools that pay for platform posting APIs.

---

## 23. Go-To-Market Plan

1. **Immediate (hackathon week):** Publish the SDK to npm, publish the repo to GitHub with a clear README and a live dashboard link.
2. **Week 1–2 post-hackathon:** Post in Indie Hackers, r/SideProject, r/reactnative, r/androiddev, and Product Hunt with a short demo GIF/video.
3. **Direct outreach:** Message other hackathon teams and recently launched indie apps directly, offering free onboarding (this doubles as both GTM and social proof).
4. **Content loop:** Every generated post can optionally carry a subtle "via AutoPromo" tag, so the tool markets itself as it's used by more apps.
5. **Longer-term:** Explore a lightweight partner/affiliate angle with indie hackathon organizers themselves (e.g., "every HackOnVibe team gets free AutoPromo credits") as a distribution channel.

---

## 24. Judging Rubric Mapping (Self-Score Before Submission)

Use this as a final gate before submitting — if any row is weak, fix it before the deadline rather than after.

| Criterion | What judges will check | Where it lives in this build |
|---|---|---|
| Solves a real, recurring problem for clear users | Is the problem obviously real and does the product address it repeatedly, not once? | Four distinct recurring event types (launch, milestone, version, review), not a one-time action |
| Working demo, understandable flow | Can judges see input → processing → output clearly? | Live feed page + dashboard + real compose windows opening |
| Meaningful AI | Does AI do something more than "generate text"? | Strategy Engine ranking + learning from `platform_stats` (Section 12) |
| Business model | Concrete pricing, customers, and revenue path | Section 22, exact numbers |
| Go-to-market | Concrete first-customer plan, not hand-wavy | Section 23, plus literal in-hackathon onboarding as proof |
| Practical, verifiable implementation | Can judges trigger it themselves and watch it work live? | Yes — SDK buttons in demo app, live feed, real platform compose windows |

---

## 25. Demo Video Script (5 Minutes)

**0:00–0:30 — Problem statement**
"Every solo developer who ships a new app hits the same wall: they can build, but they can't market. Writing promotional content for every milestone and update takes time most builders don't have."

**0:30–1:00 — Solution intro**
"AutoPromo SDK is a 3-line code integration that any newly launched app can drop in. It listens for real product moments and turns them into ready-to-publish, platform-specific promotional content."

**1:00–2:30 — Live demo**
- Open the Expo demo app on a physical phone.
- Tap "Simulate 1000th download."
- Switch to the live feed page — show the event appear in real time.
- Switch to the dashboard — show 8 AI-generated post variants appear, ranked by the Strategy Engine.
- Click "Post to Twitter" — show the real Twitter compose window open, pre-filled.
- Click "Post to Reddit" — show the real Reddit submit page open, pre-filled.
- Click "Post to WhatsApp" — show the real WhatsApp share flow open.
- If onboarded: switch to Team X's app dashboard, show the same flow working for a genuinely separate, real app.

**2:30–3:15 — Explain the Strategy Engine**
"This isn't just AI writing text — it's ranking which platform and tone is worth showing first for this specific event, and adjusting those rankings based on what this app's team actually chooses to post over time."

**3:15–4:00 — Business model and market**
Walk through the three pricing tiers and the addressable market talking point from Section 22.

**4:00–4:45 — Go-to-market**
Explain the npm/GitHub launch plan and mention the real in-hackathon onboarding as proof this already works for a third-party team.

**4:45–5:00 — Close**
"AutoPromo turns the moment an app does something worth celebrating into a moment it actually gets promoted — automatically generated, human-approved, live on real platforms, for free."

---

## 26. Questionnaire Answer Draft

**What problem does your product solve?**
Newly launched mobile apps have no promotion infrastructure — founders can build but lack the time or skill to consistently create platform-specific promotional content for every meaningful product moment.

**Who is it for?**
Solo developers, small app teams, and indie hackathon builders shipping a new mobile app with no existing marketing setup.

**What does your product do, technically?**
A TypeScript SDK integrates into any mobile app in a few lines of code. It sends product events to a backend, which uses a free-tier LLM to generate platform-tailored promotional content, ranks the options using a Strategy Engine that learns from user choices, and opens each platform's real native compose screen pre-filled with the content for one-click human publishing.

**What AI features does it use?**
Structured LLM generation of platform- and tone-specific copy, plus a transparent ranking/learning system (the Strategy Engine) that adjusts platform/tone priority per app based on real usage history.

**What is your business model?**
Freemium SaaS: free tier (20 posts/month, 1 app), Builder tier ($12/month, 200 posts, 3 apps), Agency tier ($39/month, unlimited posts and apps, white-label dashboard).

**What is your go-to-market plan?**
Launch on GitHub/npm immediately; distribute through indie developer communities (Indie Hackers, Product Hunt, relevant subreddits); direct outreach to newly launched apps, including onboarding a real second team's app during the hackathon itself as initial proof and first customer.

---

## 27. Submission Checklist

- [ ] Repository pushed with working code, before Sunday 9:00 PM MT
- [ ] README explains what the project is, how to run it, and links to the live dashboard/live feed
- [ ] Demo video recorded, uploaded (YouTube unlisted or Google Docs link), link ready to send
- [ ] Questionnaire filled out completely
- [ ] Live feed URL tested in an incognito window right before submission to confirm it works for someone with zero context
- [ ] Team members and GitHub usernames confirmed accurate on your HackOnVibe personal page

---

## 28. Stretch Goals (If Time Remains)

- Telegram and Facebook share-intent buttons fully wired (if not already done as part of the core four)
- A small bar chart on the dashboard showing `times_chosen / times_shown` per platform, visually proving the Strategy Engine's learning signal
- A "reply draft" UI specifically for the `new_review` event type (Section 11), separate from the promotional post cards
- Publishing the SDK properly to npm under a real package name, rather than only importing it locally
- A short public landing page (separate from the dashboard) explaining the product for anyone who lands on the GitHub repo

---

## 29. Appendix: Full File Tree

```
autopromo-project/
  autopromo-sdk/
    src/
      index.ts
      types.ts
      http.ts
    package.json
    tsconfig.json
  dashboard/
    app/
      page.tsx
      apps/[appId]/page.tsx
      share/[eventId]/page.tsx
      live/[appId]/page.tsx
      api/
        event.ts
        posts.ts
        mark-chosen.ts
        apps.ts
    components/
      PostCard.tsx
      EventTimeline.tsx
      StatsChart.tsx
    lib/
      supabaseClient.ts
      shareIntents.ts
      shareActions.ts
    .env.local
    package.json
  autopromo-demo/
    App.tsx
    package.json
  README.md
```

---

## 30. Appendix: All Copy-Paste Code Blocks Index

For quick reference while building, every code block in this document by section:

- Section 8 — Full Supabase schema SQL + RLS policies
- Section 9.2–9.4 — Full SDK source (`types.ts`, `http.ts`, `index.ts`)
- Section 9.5 — SDK usage snippet for any host app
- Section 10.2 — `/api/apps` endpoint
- Section 10.3 — `/api/event` endpoint, prompt builder, Discord poster
- Section 10.4 — `/api/mark-chosen` endpoint
- Section 10.5 — Postgres helper functions for stats increments
- Section 13.1 — All share-intent functions (Twitter, Reddit, WhatsApp, Telegram, LinkedIn, Facebook)
- Section 13.2 — Dynamic OG share page
- Section 13.3 — Click handler wiring share + mark-chosen together
- Section 15.2–15.4 — Supabase client, PostCard component, AppDashboard page with realtime subscription
- Section 16.2 — Live feed page with realtime subscription
- Section 17.2 — Full Expo demo app (`App.tsx`)

Everything needed to build this project end to end, with no paid services, is contained in this document.