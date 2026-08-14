/**
 * AutoPromo API server.
 *
 * `./env` is imported first and deliberately: it validates every credential at
 * boot and throws a readable error if anything is missing, so the process never
 * starts half-configured and fails later on a request.
 */
import { env, describeEnv } from "./env";
import express from "express";
import cors from "cors";

import appsRouter from "./routes/apps";
import eventRouter from "./routes/event";
import postsRouter from "./routes/posts";
import markChosenRouter from "./routes/markChosen";
import adRouter from "./routes/ad";
import integrationsRouter from "./routes/integrations";

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────

/**
 * Allowed browser origins. The Vite dev server picks the first free port from
 * 8080 upward, so the common local ports are allowed by default in dev and any
 * extra deployed origin can be added via ALLOWED_ORIGINS.
 */
const DEV_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:3000",
  "http://localhost:5173",
];

const allowedOrigins = new Set(
  [env.frontendUrl, ...env.allowedOrigins, ...(env.isProduction ? [] : DEV_ORIGINS)].filter(
    Boolean,
  ),
);

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin requests and non-browser clients (curl, the SDK running in
      // React Native) send no Origin header — those are always allowed.
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

// ── Health check ────────────────────────────────────────────────────────────

/** Used by the dashboard to decide between live and fallback mode. */
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    ts: new Date().toISOString(),
    discord: env.discordWebhookUrl ? "configured" : "disabled",
  });
});

// ── API routes ──────────────────────────────────────────────────────────────

app.use("/api/apps", appsRouter);
app.use("/api/event", eventRouter);
app.use("/api/posts", postsRouter);
app.use("/api/mark-chosen", markChosenRouter);
app.use("/api/ad", adRouter);
app.use("/api/integrations", integrationsRouter);

// ── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[unhandled error]", err);
  // CORS rejections are a config problem, not a server fault — say so clearly.
  if (err.message?.includes("not allowed by CORS")) {
    return res.status(403).json({
      error: err.message,
      hint: "Add this origin to ALLOWED_ORIGINS or FRONTEND_URL in server/.env",
    });
  }
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ───────────────────────────────────────────────────────────────────

app.listen(env.port, () => {
  console.log(`\n🚀 AutoPromo API running on http://localhost:${env.port}\n`);
  console.log(describeEnv(env));
  console.log(`\n   Health check:  GET  /health`);
  console.log(`   Create app:    POST /api/apps`);
  console.log(`   Track event:   POST /api/event`);
  console.log(`   Get posts:     GET  /api/posts?appId=<uuid>`);
  console.log(`   Mark chosen:   POST /api/mark-chosen`);
  console.log(`   Generate ad:   POST /api/ad\n`);
});

export default app;
