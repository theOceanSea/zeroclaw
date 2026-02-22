import type { FC } from "hono/jsx";
import { Layout } from "./Layout";
import type { Conversation } from "../db/schema";

interface ConversationsPageProps {
  username: string;
  conversations: Conversation[];
}

export const ConversationsPage: FC<ConversationsPageProps> = ({
  username,
  conversations,
}) => {
  return (
    <Layout title="Conversations" username={username}>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold">Your Conversations</h1>
        <div x-data="{ open: false }">
          <button
            x-on:click="open = !open"
            class="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition"
          >
            + New Conversation
          </button>
          <div x-show="open" x-cloak class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md" {...{"x-on:click.away": "open = false"}}>
              <h2 class="text-lg font-semibold mb-4">New Conversation</h2>
              <form method="post" action="/conversations">
                <input
                  type="text"
                  name="title"
                  placeholder="Conversation title..."
                  required
                  maxlength={128}
                  class="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div class="flex gap-2 justify-end">
                  <button
                    type="button"
                    x-on:click="open = false"
                    class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {conversations.length === 0 ? (
        <div class="text-center text-gray-500 py-16">
          <p class="text-lg">No conversations yet</p>
          <p class="text-sm mt-2">Create a new conversation to get started.</p>
        </div>
      ) : (
        <div class="space-y-2">
          {conversations.map((conv) => (
            <a
              href={`/conversations/${conv.id}`}
              class="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-blue-300 transition"
            >
              <div class="flex items-center justify-between">
                <h3 class="font-medium text-gray-900">{conv.title}</h3>
                <span class="text-xs text-gray-400">
                  {conv.updatedAt.toLocaleDateString()}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </Layout>
  );
};
