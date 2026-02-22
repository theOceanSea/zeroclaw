import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import type { Env } from "./types/bindings";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import { authMiddleware } from "./middleware/auth";
import { authRoutes } from "./routes/auth";
import { chatRoutes } from "./routes/chat";
import { settingsRoutes } from "./routes/settings";
import { apiRoutes } from "./routes/api";
import { migrationStatements } from "./db";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", rateLimitMiddleware);

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.get("/migrate", async (c) => {
  for (const statement of migrationStatements) {
    await c.env.DB.exec(statement);
  }

  return c.json({ status: "migrations applied" });
});

app.get("/files/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.R2.get(key);
  if (!object) {
    return c.notFound();
  }
  const headers = new Headers();
  headers.set(
    "Content-Type",
    object.httpMetadata?.contentType ?? "application/octet-stream"
  );
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
});

app.route("/", authRoutes);
app.route("/", apiRoutes);

app.use("/", authMiddleware);
app.use("/settings", authMiddleware);
app.use("/conversations/*", authMiddleware);
app.route("/", settingsRoutes);
app.route("/", chatRoutes);

export default app;
