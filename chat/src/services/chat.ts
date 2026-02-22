import { eq, desc, and, sql } from "drizzle-orm";
import { conversations, messages, users } from "../db/schema";
import type { Database } from "../db";
import type { Conversation, Message } from "../db/schema";
import { config } from "../config";

function generateId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listConversations(
  db: Database,
  userId: string
): Promise<Conversation[]> {
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function getConversation(
  db: Database,
  conversationId: string,
  userId: string
): Promise<Conversation | undefined> {
  const results = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    )
    .limit(1);
  return results[0];
}

export async function createConversation(
  db: Database,
  userId: string,
  title: string
): Promise<Conversation> {
  const id = generateId();
  const now = new Date();
  const conv = {
    id,
    userId,
    title,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(conversations).values(conv);
  return conv;
}

export async function deleteConversation(
  db: Database,
  conversationId: string,
  userId: string
): Promise<boolean> {
  const conv = await getConversation(db, conversationId, userId);
  if (!conv) return false;
  await db.delete(messages).where(eq(messages.conversationId, conversationId));
  await db.delete(conversations).where(eq(conversations.id, conversationId));
  return true;
}

export async function listMessages(
  db: Database,
  conversationId: string,
  page: number
): Promise<{ messages: Message[]; totalPages: number }> {
  const offset = (page - 1) * config.messagesPerPage;
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));
  const total = countResult[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / config.messagesPerPage));
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(config.messagesPerPage)
    .offset(offset);
  return { messages: msgs.reverse(), totalPages };
}

export async function getUnreadMessages(
  db: Database,
  conversationId: string
): Promise<Message[]> {
  return db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.isRead, false)
      )
    )
    .orderBy(messages.createdAt);
}

export async function createMessage(
  db: Database,
  conversationId: string,
  role: "user" | "bot",
  contentType: "text" | "image" | "file",
  content: string,
  fileUrl?: string,
  fileName?: string
): Promise<Message> {
  const id = generateId();
  const now = new Date();
  const msg = {
    id,
    conversationId,
    role,
    contentType,
    content,
    fileUrl: fileUrl ?? null,
    fileName: fileName ?? null,
    isRead: false,
    createdAt: now,
  };
  await db.insert(messages).values(msg);
  await db
    .update(conversations)
    .set({ updatedAt: now })
    .where(eq(conversations.id, conversationId));
  return msg;
}

export async function markMessagesAsRead(
  db: Database,
  conversationId: string
): Promise<void> {
  await db
    .update(messages)
    .set({ isRead: true })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.isRead, false)
      )
    );
}

export async function getUserByUsername(
  db: Database,
  username: string
) {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return results[0];
}

export async function getUserById(
  db: Database,
  userId: string
) {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return results[0];
}
