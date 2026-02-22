import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { getSession } from "../services/auth";
import { config } from "../config";
import type { Env, SessionData } from "../types/bindings";

type Variables = {
  session: SessionData;
};

export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const sessionId = getCookie(c, config.sessionCookieName);
  if (!sessionId) {
    return c.redirect("/login");
  }
  const session = await getSession(c.env.KV, sessionId);
  if (!session) {
    return c.redirect("/login");
  }
  c.set("session", session);
  return next();
}
