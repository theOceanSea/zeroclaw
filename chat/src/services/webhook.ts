import type { Message } from "../db/schema";

export interface WebhookPayload {
  event: "new_message";
  conversationId: string;
  message: {
    id: string;
    role: string;
    contentType: string;
    content: string;
    fileUrl: string | null;
    fileName: string | null;
    createdAt: string;
  };
}

export async function triggerWebhook(
  webhookUrl: string,
  bearerToken: string,
  conversationId: string,
  message: Message
): Promise<boolean> {
  const payload: WebhookPayload = {
    event: "new_message",
    conversationId,
    message: {
      id: message.id,
      role: message.role,
      contentType: message.contentType,
      content: message.content,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      createdAt: message.createdAt.toISOString(),
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}
