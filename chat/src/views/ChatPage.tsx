import type { FC } from "hono/jsx";
import { raw } from "hono/html";
import { Layout } from "./Layout";
import type { Message, Conversation } from "../db/schema";
import { marked } from "marked";

interface ChatPageProps {
  username: string;
  conversation: Conversation;
  messages: Message[];
  currentPage: number;
  totalPages: number;
}

function renderMarkdown(content: string): string {
  return marked.parse(content, { async: false }) as string;
}

const MessageBubble: FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === "user";
  return (
    <div
      class={`flex ${isUser ? "justify-end" : "justify-start"} message-enter`}
    >
      <div
        class={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-white border border-gray-200 text-gray-900"
        }`}
      >
        <div class="text-xs opacity-70 mb-1">
          {isUser ? "You" : "Bot"} ·{" "}
          {message.createdAt.toLocaleTimeString()}
        </div>
        {message.contentType === "text" ? (
          <div class={`prose ${isUser ? "text-white" : ""} text-sm`}>
            {raw(renderMarkdown(message.content))}
          </div>
        ) : message.contentType === "image" ? (
          <div>
            {message.fileUrl ? (
              <img
                src={message.fileUrl}
                alt={message.content}
                class="max-w-full rounded"
                loading="lazy"
              />
            ) : (
              <p class="text-sm">{message.content}</p>
            )}
          </div>
        ) : (
          <div class="flex items-center gap-2">
            <span class="text-sm">📎</span>
            {message.fileUrl ? (
              <a
                href={message.fileUrl}
                class={`text-sm underline ${isUser ? "text-white" : "text-blue-600"}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {message.fileName ?? "Download file"}
              </a>
            ) : (
              <span class="text-sm">{message.fileName ?? "File"}</span>
            )}
          </div>
        )}
        <div class="flex justify-end mt-1">
          {message.isRead ? (
            <span class="text-xs opacity-60" title="Read">
              ✓✓
            </span>
          ) : (
            <span class="text-xs opacity-40" title="Sent">
              ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const ChatPage: FC<ChatPageProps> = ({
  username,
  conversation,
  messages: msgs,
  currentPage,
  totalPages,
}) => {
  return (
    <Layout title={conversation.title} username={username}>
      <div class="mb-4">
        <a
          href="/"
          class="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Back to conversations
        </a>
      </div>
      <div class="bg-white rounded-lg shadow border border-gray-200">
        <div class="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">{conversation.title}</h2>
          <form
            method="post"
            action={`/conversations/${conversation.id}/delete`}
          >
            <button
              type="submit"
              class="text-xs text-red-500 hover:text-red-700"
              onclick="return confirm('Delete this conversation?')"
            >
              Delete
            </button>
          </form>
        </div>
        <div class="p-4 min-h-[400px] max-h-[600px] overflow-y-auto space-y-3" id="messages-container">
          {totalPages > 1 ? (
            <div class="flex justify-center gap-2 mb-4">
              {currentPage > 1 ? (
                <a
                  href={`/conversations/${conversation.id}?page=${currentPage - 1}`}
                  class="text-sm text-blue-600 hover:underline"
                >
                  ← Previous
                </a>
              ) : null}
              <span class="text-xs text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages ? (
                <a
                  href={`/conversations/${conversation.id}?page=${currentPage + 1}`}
                  class="text-sm text-blue-600 hover:underline"
                >
                  Next →
                </a>
              ) : null}
            </div>
          ) : null}
          {msgs.length === 0 ? (
            <div class="text-center text-gray-400 py-16">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            msgs.map((msg) => <MessageBubble message={msg} />)
          )}
        </div>
        <div class="border-t border-gray-200 p-4">
          <form
            method="post"
            action={`/conversations/${conversation.id}/messages`}
            enctype="multipart/form-data"
            class="flex gap-2"
            x-data="{ showFileUpload: false }"
          >
            <div class="flex-1 flex gap-2">
              <input
                type="text"
                name="content"
                placeholder="Type a message..."
                required
                maxlength={4096}
                class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="file"
                name="file"
                x-show="showFileUpload"
                x-cloak
                class="text-sm"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
            </div>
            <button
              type="button"
              x-on:click="showFileUpload = !showFileUpload"
              class="text-gray-500 hover:text-gray-700 px-2"
              title="Attach file"
            >
              📎
            </button>
            <button
              type="submit"
              class="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};
