# AutoPromo SDK — Express + Node.js Backend

Express/Node.js API server for the AutoPromo SDK dashboard.

---

## Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/health` | Health check |
| `POST` | `/api/apps` | Register a new app |
| `GET`  | `/api/apps` | List all apps |
| `GET`  | `/api/apps/:appId` | Get one app |
| `POST` | `/api/event` | Receive SDK event → generate posts → rank → Discord |
| `GET`  | `/api/posts?appId=` | Get ranked posts for an app |
| `GET`  | `/api/posts/:postId` | Get one post |
| `POST` | `/api/mark-chosen` | Mark a post as chosen, update strategy engine stats |

---

## Setup

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Where to get it |
|---|---|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (keep secret!) |
| `DISCORD_WEBHOOK_URL` | Discord → channel settings → Integrations → Webhooks |

### 3. Set up the Supabase database

Open the Supabase SQL editor and run `supabase-schema.sql` in its entirety. This creates all tables, enables Realtime, sets up RLS policies, and creates the two helper functions.

### 4. Run in development

```bash
npm run dev
```

Server starts on `http://localhost:3001`.

### 5. Build for production

```bash
npm run build
npm start
```

---

## Architecture

```
POST /api/event
  ├─ Validate body
  ├─ Fetch app from Supabase
  ├─ Insert raw event row
  ├─ Build structured Groq prompt (prompts.ts)
  ├─ Call Groq → get 12 variants (6 platforms × 2 tones) as JSON
  ├─ Fetch current platform_stats
  ├─ Compute rank_score per variant (strategy.ts)
  ├─ Insert all variants into generated_posts
  ├─ Upsert platform_stats (increment times_shown)
  ├─ [new_review only] attach reply_draft to event payload
  └─ Fire-and-forget Discord webhook (discord.ts)
```

### Strategy Engine scoring (plan §12)

```
score = base_weight(event_type, platform)
      + 0.5 × (times_chosen / max(times_shown, 1))
```

Base weights are in `src/strategy.ts`. They're the starting priors before any human choices are recorded. The ratio term updates over time based on what your team actually publishes.

---

## Request examples

### Register an app
```bash
curl -X POST http://localhost:3001/api/apps \
  -H "Content-Type: application/json" \
  -d '{"name": "PocketRecipe", "description": "Scan your fridge, get dinner in 20 seconds."}'
```

### Send a launch event
```bash
curl -X POST http://localhost:3001/api/event \
  -H "Content-Type: application/json" \
  -d '{"appId": "<uuid>", "type": "launch", "payload": {}}'
```

### Send a milestone event
```bash
curl -X POST http://localhost:3001/api/event \
  -H "Content-Type: application/json" \
  -d '{"appId": "<uuid>", "type": "milestone", "payload": {"label": "1000 downloads"}}'
```

### Send a review event
```bash
curl -X POST http://localhost:3001/api/event \
  -H "Content-Type: application/json" \
  -d '{"appId": "<uuid>", "type": "new_review", "payload": {"text": "Love this app!", "rating": 5}}'
```

### Get ranked posts
```bash
curl "http://localhost:3001/api/posts?appId=<uuid>"
```

### Mark a post as chosen (after user shares it)
```bash
curl -X POST http://localhost:3001/api/mark-chosen \
  -H "Content-Type: application/json" \
  -d '{"postId": "<uuid>", "appId": "<uuid>", "platform": "twitter", "tone": "casual"}'
```

### Test Discord webhook manually
```bash
curl -X POST $DISCORD_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"content": "Test message from AutoPromo"}'
```

---

## File structure

```
server/
  src/
    index.ts          # Express app, middleware, route wiring
    db.ts             # Supabase client (service-role key)
    types.ts          # Shared TypeScript types
    strategy.ts       # Strategy Engine — rank score computation
    prompts.ts        # Groq prompt builder
    discord.ts        # Discord webhook helper
    routes/
      apps.ts         # POST/GET /api/apps
      event.ts        # POST /api/event (core pipeline)
      posts.ts        # GET  /api/posts
      markChosen.ts   # POST /api/mark-chosen
  supabase-schema.sql # Run once in Supabase SQL editor
  .env.example        # Copy to .env and fill in
  package.json
  tsconfig.json
  README.md
```
