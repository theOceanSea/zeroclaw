import { config } from "../config";
import type { SessionData } from "../types/bindings";

function generateId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = generateId();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${salt}:${hashHex}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split(":");
  const salt = parts[0];
  const storedHash = parts[1];
  if (!salt || !storedHash) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === storedHash;
}

export async function createSession(
  kv: KVNamespace,
  userId: string,
  username: string
): Promise<string> {
  const sessionId = generateId();
  const sessionData: SessionData = {
    userId,
    username,
    expiresAt: Date.now() + config.sessionTtlSeconds * 1000,
  };
  await kv.put(
    `${config.kvSessionPrefix}${sessionId}`,
    JSON.stringify(sessionData),
    { expirationTtl: config.sessionTtlSeconds }
  );
  return sessionId;
}

export async function getSession(
  kv: KVNamespace,
  sessionId: string
): Promise<SessionData | null> {
  const data = await kv.get(`${config.kvSessionPrefix}${sessionId}`);
  if (!data) return null;
  const session = JSON.parse(data) as SessionData;
  if (session.expiresAt < Date.now()) {
    await kv.delete(`${config.kvSessionPrefix}${sessionId}`);
    return null;
  }
  return session;
}

export async function deleteSession(
  kv: KVNamespace,
  sessionId: string
): Promise<void> {
  await kv.delete(`${config.kvSessionPrefix}${sessionId}`);
}

export { generateId };
