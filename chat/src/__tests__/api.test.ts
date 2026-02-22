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

async function registerAndGetCookie(
  username: string,
  password: string
): Promise<string> {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  const res = await app.fetch(
    new Request("http://localhost/register", {
      method: "POST",
      body: formData,
    }),
    env
  );
  const cookies = res.headers.getAll("Set-Cookie");
  for (const cookie of cookies) {
    const match = cookie.match(/zchat_session=([^;]+)/);
    if (match?.[1]) return match[1];
  }
  throw new Error("No session cookie found");
}

async function getBearerToken(cookie: string): Promise<string> {
  const res = await app.fetch(
    new Request("http://localhost/settings", {
      headers: { Cookie: `zchat_session=${cookie}` },
    }),
    env
  );
  const text = await res.text();
  const match = text.match(/value="([a-f0-9]{64})"/);
  if (!match?.[1]) throw new Error("Bearer token not found in settings page");
  return match[1];
}

async function createConversation(
  cookie: string,
  title: string
): Promise<string> {
  const formData = new FormData();
  formData.append("title", title);
  const res = await app.fetch(
    new Request("http://localhost/conversations", {
      method: "POST",
      body: formData,
      headers: { Cookie: `zchat_session=${cookie}` },
    }),
    env
  );
  const location = res.headers.get("Location");
  if (!location) throw new Error("No redirect location");
  const id = location.split("/").pop();
  if (!id) throw new Error("No conversation ID");
  return id;
}

describe("API Routes", () => {
  let cookie: string;
  let bearerToken: string;

  beforeEach(async () => {
    await applyMigrations();
    cookie = await registerAndGetCookie("api_user", "securepassword123");
    bearerToken = await getBearerToken(cookie);
  });

  it("GET /api/conversations returns conversations", async () => {
    await createConversation(cookie, "Test Conv");

    const res = await app.fetch(
      new Request("http://localhost/api/conversations", {
        headers: { Authorization: `Bearer ${bearerToken}` },
      }),
      env
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { conversations: Array<{ title: string }> };
    expect(json.conversations).toHaveLength(1);
    expect(json.conversations[0]?.title).toBe("Test Conv");
  });

  it("GET /api/conversations returns 401 without token", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/conversations"),
      env
    );
    expect(res.status).toBe(401);
  });

  it("POST /api/conversations/:id/messages creates bot message", async () => {
    const convId = await createConversation(cookie, "Bot Test");

    const res = await app.fetch(
      new Request(`http://localhost/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "Hello from bot!",
          contentType: "text",
        }),
      }),
      env
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as { message: { role: string; content: string } };
    expect(json.message.role).toBe("bot");
    expect(json.message.content).toBe("Hello from bot!");
  });

  it("GET /api/conversations/:id/unread returns unread messages", async () => {
    const convId = await createConversation(cookie, "Unread Test");

    await app.fetch(
      new Request(`http://localhost/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: "Unread message" }),
      }),
      env
    );

    const res = await app.fetch(
      new Request(`http://localhost/api/conversations/${convId}/unread`, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      }),
      env
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { messages: Array<{ content: string }> };
    expect(json.messages).toHaveLength(1);
    expect(json.messages[0]?.content).toBe("Unread message");
  });

  it("PATCH /api/conversations/:id/read marks messages as read", async () => {
    const convId = await createConversation(cookie, "Read Test");

    await app.fetch(
      new Request(`http://localhost/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: "To be read" }),
      }),
      env
    );

    const markRes = await app.fetch(
      new Request(`http://localhost/api/conversations/${convId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${bearerToken}` },
      }),
      env
    );
    expect(markRes.status).toBe(200);

    const unreadRes = await app.fetch(
      new Request(`http://localhost/api/conversations/${convId}/unread`, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      }),
      env
    );
    const json = (await unreadRes.json()) as { messages: Array<unknown> };
    expect(json.messages).toHaveLength(0);
  });

  it("returns 404 for non-existent conversation", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/conversations/nonexistent/messages", {
        headers: { Authorization: `Bearer ${bearerToken}` },
      }),
      env
    );
    expect(res.status).toBe(404);
  });

  it("GET /api/openapi.json returns OpenAPI spec", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/openapi.json"),
      env
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { openapi: string; info: { title: string } };
    expect(json.openapi).toBe("3.0.0");
    expect(json.info.title).toBe("ZeroClaw Chat API");
  });
});

describe("Security Tests", () => {
  beforeEach(async () => {
    await applyMigrations();
  });

  it("protected routes redirect without auth", async () => {
    const res = await app.fetch(new Request("http://localhost/"), env);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/login");
  });

  it("settings page redirects without auth", async () => {
    const res = await app.fetch(
      new Request("http://localhost/settings"),
      env
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/login");
  });

  it("API rejects invalid bearer token", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/conversations", {
        headers: { Authorization: "Bearer invalid_token" },
      }),
      env
    );
    expect(res.status).toBe(401);
  });

  it("API rejects missing authorization header", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/conversations"),
      env
    );
    expect(res.status).toBe(401);
  });

  it("secure headers are present", async () => {
    const res = await app.fetch(
      new Request("http://localhost/health"),
      env
    );
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
  });
});
