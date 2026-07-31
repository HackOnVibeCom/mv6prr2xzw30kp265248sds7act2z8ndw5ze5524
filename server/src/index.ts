import "dotenv/config";
import express from "express";
import cors from "cors";

import appsRouter from "./routes/apps";
import eventRouter from "./routes/event";
import postsRouter from "./routes/posts";
import markChosenRouter from "./routes/markChosen";

const app = express();
const PORT = process.env.PORT ?? 3001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// ── Middleware ──────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// ── Health check ────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ── API routes ──────────────────────────────────────────────────────────────

app.use("/api/apps", appsRouter);
app.use("/api/event", eventRouter);
app.use("/api/posts", postsRouter);
app.use("/api/mark-chosen", markChosenRouter);

// ── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[unhandled error]", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 AutoPromo API running on http://localhost:${PORT}`);
  console.log(`   Health check:  GET  /health`);
  console.log(`   Create app:    POST /api/apps`);
  console.log(`   Track event:   POST /api/event`);
  console.log(`   Get posts:     GET  /api/posts?appId=<uuid>`);
  console.log(`   Mark chosen:   POST /api/mark-chosen\n`);
});

export default app;
