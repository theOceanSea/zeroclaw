import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import type { Env } from "../types/bindings";
import { createDb } from "../db";
import { users } from "../db/schema";
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  generateId,
} from "../services/auth";
import { getUserByUsername } from "../services/chat";
import { config } from "../config";
import { LoginPage, RegisterPage } from "../views/AuthPages";

const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.get("/login", (c) => {
  return c.html(<LoginPage />);
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const username = typeof body["username"] === "string" ? body["username"] : "";
  const password = typeof body["password"] === "string" ? body["password"] : "";

  if (!username || !password) {
    return c.html(<LoginPage error="Username and password are required." />);
  }

  const db = createDb(c.env.DB);
  const user = await getUserByUsername(db, username);
  if (!user) {
    return c.html(<LoginPage error="Invalid credentials." />);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return c.html(<LoginPage error="Invalid credentials." />);
  }

  const sessionId = await createSession(c.env.KV, user.id, user.username);
  setCookie(c, config.sessionCookieName, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: config.sessionTtlSeconds,
  });

  return c.redirect("/");
});

authRoutes.get("/register", (c) => {
  return c.html(<RegisterPage />);
});

authRoutes.post("/register", async (c) => {
  const body = await c.req.parseBody();
  const username = typeof body["username"] === "string" ? body["username"] : "";
  const password = typeof body["password"] === "string" ? body["password"] : "";

  if (!username || !password) {
    return c.html(
      <RegisterPage error="Username and password are required." />
    );
  }

  if (username.length < 3 || username.length > 32) {
    return c.html(
      <RegisterPage error="Username must be between 3 and 32 characters." />
    );
  }

  if (password.length < config.passwordMinLength) {
    return c.html(
      <RegisterPage
        error={`Password must be at least ${config.passwordMinLength} characters.`}
      />
    );
  }

  const db = createDb(c.env.DB);
  const existing = await getUserByUsername(db, username);
  if (existing) {
    return c.html(<RegisterPage error="Username already taken." />);
  }

  const id = generateId();
  const passwordHash = await hashPassword(password);
  await db.insert(users).values({
    id,
    username,
    passwordHash,
    createdAt: new Date(),
  });

  const sessionId = await createSession(c.env.KV, id, username);
  setCookie(c, config.sessionCookieName, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: config.sessionTtlSeconds,
  });

  return c.redirect("/");
});

authRoutes.post("/logout", async (c) => {
  const sessionId = getCookie(c, config.sessionCookieName);
  if (sessionId) {
    await deleteSession(c.env.KV, sessionId);
    deleteCookie(c, config.sessionCookieName);
  }
  return c.redirect("/login");
});

export { authRoutes };
