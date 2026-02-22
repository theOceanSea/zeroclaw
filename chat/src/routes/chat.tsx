import { Hono } from "hono";
import type { Env, SessionData } from "../types/bindings";
import { createDb } from "../db";
import {
  listConversations,
  getConversation,
  createConversation,
  deleteConversation,
  listMessages,
  createMessage,
  markMessagesAsRead,
} from "../services/chat";
import { getOrCreateSettings } from "../services/settings";
import { triggerWebhook } from "../services/webhook";
import { config } from "../config";
import { ConversationsPage } from "../views/ConversationsPage";
import { ChatPage } from "../views/ChatPage";

type Variables = {
  session: SessionData;
};

const chatRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

chatRoutes.get("/", async (c) => {
  const session = c.get("session");
  const db = createDb(c.env.DB);
  const convs = await listConversations(db, session.userId);
  return c.html(
    <ConversationsPage username={session.username} conversations={convs} />
  );
});

chatRoutes.post("/conversations", async (c) => {
  const session = c.get("session");
  const body = await c.req.parseBody();
  const title = typeof body["title"] === "string" ? body["title"] : "";

  if (!title || title.length > 128) {
    return c.redirect("/");
  }

  const db = createDb(c.env.DB);
  const conv = await createConversation(db, session.userId, title);
  return c.redirect(`/conversations/${conv.id}`);
});

chatRoutes.get("/conversations/:id", async (c) => {
  const session = c.get("session");
  const conversationId = c.req.param("id");
  const pageParam = c.req.query("page");
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  const db = createDb(c.env.DB);
  const conv = await getConversation(db, conversationId, session.userId);
  if (!conv) {
    return c.redirect("/");
  }

  await markMessagesAsRead(db, conversationId);
  const { messages, totalPages } = await listMessages(
    db,
    conversationId,
    page
  );

  return c.html(
    <ChatPage
      username={session.username}
      conversation={conv}
      messages={messages}
      currentPage={page}
      totalPages={totalPages}
    />
  );
});

chatRoutes.post("/conversations/:id/messages", async (c) => {
  const session = c.get("session");
  const conversationId = c.req.param("id");

  const db = createDb(c.env.DB);
  const conv = await getConversation(db, conversationId, session.userId);
  if (!conv) {
    return c.redirect("/");
  }

  const body = await c.req.parseBody();
  const content = typeof body["content"] === "string" ? body["content"] : "";
  const file = body["file"];

  if (!content && !file) {
    return c.redirect(`/conversations/${conversationId}`);
  }

  if (content.length > config.maxMessageLength) {
    return c.redirect(`/conversations/${conversationId}`);
  }

  let fileUrl: string | undefined;
  let fileName: string | undefined;
  let contentType: "text" | "image" | "file" = "text";

  if (file instanceof File && file.size > 0) {
    const settings = await getOrCreateSettings(c.env.KV, session.userId);
    if (settings.r2Enabled && c.env.R2) {
      if (file.size > config.maxFileSize) {
        return c.redirect(`/conversations/${conversationId}`);
      }

      const fileId = crypto.randomUUID();
      const ext = file.name.split(".").pop() ?? "bin";
      const key = `${session.userId}/${conversationId}/${fileId}.${ext}`;

      await c.env.R2.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      });

      fileUrl = `/files/${key}`;
      fileName = file.name;
      contentType = config.allowedImageTypes.includes(
        file.type as (typeof config.allowedImageTypes)[number]
      )
        ? "image"
        : "file";
    }
  }

  const msg = await createMessage(
    db,
    conversationId,
    "user",
    contentType,
    content || fileName || "",
    fileUrl,
    fileName
  );

  const settings = await getOrCreateSettings(c.env.KV, session.userId);
  if (settings.triggerMode === "webhook" && settings.webhookUrl) {
    await triggerWebhook(
      settings.webhookUrl,
      settings.bearerToken,
      conversationId,
      msg
    );
  }

  return c.redirect(`/conversations/${conversationId}`);
});

chatRoutes.post("/conversations/:id/delete", async (c) => {
  const session = c.get("session");
  const conversationId = c.req.param("id");
  const db = createDb(c.env.DB);
  await deleteConversation(db, conversationId, session.userId);
  return c.redirect("/");
});

export { chatRoutes };
