import type { Context, Next } from "hono";
import type { Env } from "../types/bindings";

export async function rateLimitMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  if (!c.env.RATE_LIMITER) {
    return next();
  }

  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for") ??
    "unknown";

  const { success } = await c.env.RATE_LIMITER.limit({ key: ip });
  if (!success) {
    return c.text("Too Many Requests", 429);
  }
  return next();
}
