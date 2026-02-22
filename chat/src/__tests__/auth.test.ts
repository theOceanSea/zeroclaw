import {
  describe,
  it,
  expect,
  beforeEach,
} from "vitest";
import { env } from "cloudflare:test";
import app from "../index";
import { migrationStatements } from "../db";

async function applyMigrations() {
  for (const statement of migrationStatements) {
    await env.DB.exec(statement);
  }
}

async function registerUser(username: string, password: string) {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);

  const req = new Request("http://localhost/register", {
    method: "POST",
    body: formData,
  });
  return app.fetch(req, env);
}

async function loginUser(username: string, password: string) {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);

  const req = new Request("http://localhost/login", {
    method: "POST",
    body: formData,
  });
  return app.fetch(req, env);
}

function extractSessionCookie(response: Response): string | undefined {
  const cookies = response.headers.getAll("Set-Cookie");
  for (const cookie of cookies) {
    const match = cookie.match(/zchat_session=([^;]+)/);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

describe("Auth Routes", () => {
  beforeEach(async () => {
    await applyMigrations();
  });

  it("GET /login returns login page", async () => {
    const req = new Request("http://localhost/login");
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Login");
  });

  it("GET /register returns register page", async () => {
    const req = new Request("http://localhost/register");
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Register");
  });

  it("POST /register creates user and redirects", async () => {
    const res = await registerUser("testuser_a", "securepassword123");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/");
    const cookie = extractSessionCookie(res);
    expect(cookie).toBeDefined();
  });

  it("POST /register rejects short password", async () => {
    const res = await registerUser("testuser_b", "short");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("at least");
  });

  it("POST /register rejects duplicate username", async () => {
    await registerUser("testuser_c", "securepassword123");
    const res = await registerUser("testuser_c", "securepassword123");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("already taken");
  });

  it("POST /login with valid credentials redirects", async () => {
    await registerUser("testuser_d", "securepassword123");
    const res = await loginUser("testuser_d", "securepassword123");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/");
  });

  it("POST /login with invalid credentials shows error", async () => {
    await registerUser("testuser_e", "securepassword123");
    const res = await loginUser("testuser_e", "wrongpassword");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Invalid credentials");
  });

  it("POST /logout clears session and redirects", async () => {
    const registerRes = await registerUser("testuser_f", "securepassword123");
    const cookie = extractSessionCookie(registerRes);

    const req = new Request("http://localhost/logout", {
      method: "POST",
      headers: { Cookie: `zchat_session=${cookie}` },
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/login");
  });
});

describe("Health Check", () => {
  it("GET /health returns ok", async () => {
    const req = new Request("http://localhost/health");
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ status: "ok" });
  });
});
