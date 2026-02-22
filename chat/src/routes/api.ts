import { z } from "zod";
import { Hono } from "hono";
import type { Env } from "../types/bindings";
import { createDb } from "../db";
import {
  listConversations,
  getConversation,
  listMessages,
  getUnreadMessages,
  createMessage,
  markMessagesAsRead,
} from "../services/chat";
import { getUserIdByBearer } from "../services/settings";

const apiRoutes = new Hono<{ Bindings: Env }>();

async function extractBearerUserId(
  kv: KVNamespace,
  authHeader: string | undefined
): Promise<string | null> {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts[0] !== "Bearer" || !parts[1]) return null;
  return getUserIdByBearer(kv, parts[1]);
}

const PostMessageBody = z.object({
  content: z.string().min(1).max(4096),
  contentType: z.enum(["text", "image", "file"]).default("text"),
});

function serializeMessage(msg: {
  id: string;
  conversationId: string;
  role: string;
  contentType: string;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  isRead: boolean;
  createdAt: Date;
}) {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    role: msg.role,
    contentType: msg.contentType,
    content: msg.content,
    fileUrl: msg.fileUrl,
    fileName: msg.fileName,
    isRead: msg.isRead,
    createdAt: msg.createdAt.toISOString(),
  };
}

apiRoutes.get("/api/conversations", async (c) => {
  const userId = await extractBearerUserId(
    c.env.KV,
    c.req.header("Authorization")
  );
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = createDb(c.env.DB);
  const convs = await listConversations(db, userId);
  return c.json({
    conversations: convs.map((conv) => ({
      id: conv.id,
      userId: conv.userId,
      title: conv.title,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    })),
  });
});

apiRoutes.get("/api/conversations/:id/messages", async (c) => {
  const userId = await extractBearerUserId(
    c.env.KV,
    c.req.header("Authorization")
  );
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const pageParam = c.req.query("page");
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  const db = createDb(c.env.DB);
  const conv = await getConversation(db, id, userId);
  if (!conv) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  const result = await listMessages(db, id, page);
  return c.json({
    messages: result.messages.map(serializeMessage),
    currentPage: page,
    totalPages: result.totalPages,
  });
});

apiRoutes.post("/api/conversations/:id/messages", async (c) => {
  const userId = await extractBearerUserId(
    c.env.KV,
    c.req.header("Authorization")
  );
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const rawBody: unknown = await c.req.json();
  const parsed = PostMessageBody.safeParse(rawBody);
  if (!parsed.success) {
    return c.json({ error: "Invalid request body", details: parsed.error.issues }, 400);
  }

  const db = createDb(c.env.DB);
  const conv = await getConversation(db, id, userId);
  if (!conv) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  const msg = await createMessage(
    db,
    id,
    "bot",
    parsed.data.contentType,
    parsed.data.content
  );

  return c.json({ message: serializeMessage(msg) }, 201);
});

apiRoutes.get("/api/conversations/:id/unread", async (c) => {
  const userId = await extractBearerUserId(
    c.env.KV,
    c.req.header("Authorization")
  );
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");

  const db = createDb(c.env.DB);
  const conv = await getConversation(db, id, userId);
  if (!conv) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  const msgs = await getUnreadMessages(db, id);
  return c.json({
    messages: msgs.map(serializeMessage),
  });
});

apiRoutes.patch("/api/conversations/:id/read", async (c) => {
  const userId = await extractBearerUserId(
    c.env.KV,
    c.req.header("Authorization")
  );
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");

  const db = createDb(c.env.DB);
  const conv = await getConversation(db, id, userId);
  if (!conv) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  await markMessagesAsRead(db, id);
  return c.json({ success: true });
});

apiRoutes.get("/api/openapi.json", (c) => {
  return c.json({
    openapi: "3.0.0",
    info: {
      title: "ZeroClaw Chat API",
      version: "1.0.0",
      description: "API for external bot integration with ZeroClaw Chat",
    },
    servers: [{ url: "/" }],
    security: [{ BearerAuth: [] }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
      schemas: {
        Message: {
          type: "object",
          properties: {
            id: { type: "string" },
            conversationId: { type: "string" },
            role: { type: "string", enum: ["user", "bot"] },
            contentType: { type: "string", enum: ["text", "image", "file"] },
            content: { type: "string" },
            fileUrl: { type: "string", nullable: true },
            fileName: { type: "string", nullable: true },
            isRead: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Conversation: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            title: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/api/conversations": {
        get: {
          tags: ["Conversations"],
          summary: "List conversations",
          responses: {
            "200": {
              description: "List of conversations",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      conversations: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Conversation" },
                      },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/conversations/{id}/messages": {
        get: {
          tags: ["Messages"],
          summary: "Get messages in a conversation",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          ],
          responses: {
            "200": {
              description: "Messages in conversation",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      messages: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Message" },
                      },
                      currentPage: { type: "integer" },
                      totalPages: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Messages"],
          summary: "Send a bot message to a conversation",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["content"],
                  properties: {
                    content: { type: "string", minLength: 1, maxLength: 4096 },
                    contentType: {
                      type: "string",
                      enum: ["text", "image", "file"],
                      default: "text",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Message created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { $ref: "#/components/schemas/Message" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/conversations/{id}/unread": {
        get: {
          tags: ["Messages"],
          summary: "Get unread messages",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Unread messages",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      messages: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Message" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/conversations/{id}/read": {
        patch: {
          tags: ["Messages"],
          summary: "Mark messages as read",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Messages marked as read",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
});

export { apiRoutes };
