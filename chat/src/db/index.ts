import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export const migrationStatements = [
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id), role TEXT NOT NULL CHECK(role IN ('user', 'bot')), content_type TEXT NOT NULL CHECK(content_type IN ('text', 'image', 'file')), content TEXT NOT NULL, file_url TEXT, file_name TEXT, is_read INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);`,
  `CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);`,
  `CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);`,
];
