import type { FC } from "hono/jsx";
import { Layout } from "./Layout";
import type { UserSettings } from "../services/settings";

interface SettingsPageProps {
  username: string;
  settings: UserSettings;
  success?: boolean;
}

export const SettingsPage: FC<SettingsPageProps> = ({
  username,
  settings,
  success,
}) => {
  return (
    <Layout title="Settings" username={username}>
      <h1 class="text-xl font-bold mb-6">Settings</h1>
      {success ? (
        <div class="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm">
          Settings updated successfully!
        </div>
      ) : null}
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">API Access</h2>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Bearer Token
            </label>
            <div class="flex gap-2" x-data="{ show: false }">
              <input
                type="text"
                readonly
                x-bind:type="show ? 'text' : 'password'"
                value={settings.bearerToken}
                class="flex-1 border border-gray-300 rounded px-3 py-2 bg-gray-50 font-mono text-sm"
              />
              <button
                type="button"
                x-on:click="show = !show"
                class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                <span x-text="show ? 'Hide' : 'Show'">Show</span>
              </button>
              <button
                type="button"
                x-on:click={`navigator.clipboard.writeText('${settings.bearerToken}')`}
                class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Copy
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Use this token to authenticate API requests from external bots.
            </p>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Message Trigger Mode</h2>
          <form method="post" action="/settings">
            <div class="space-y-4">
              <div x-data={`{ mode: '${settings.triggerMode}' }`}>
                <div class="flex gap-4 mb-4">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="triggerMode"
                      value="polling"
                      x-model="mode"
                      checked={settings.triggerMode === "polling"}
                    />
                    <span class="text-sm">API Polling</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="triggerMode"
                      value="webhook"
                      x-model="mode"
                      checked={settings.triggerMode === "webhook"}
                    />
                    <span class="text-sm">Webhook</span>
                  </label>
                </div>
                <div x-show="mode === 'webhook'" x-cloak>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    name="webhookUrl"
                    value={settings.webhookUrl}
                    placeholder="https://your-bot.example.com/webhook"
                    class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    When a message is sent, a POST request will be made to this
                    URL.
                  </p>
                </div>
              </div>

              <div class="border-t pt-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="r2Enabled"
                    value="true"
                    checked={settings.r2Enabled}
                  />
                  <span class="text-sm font-medium text-gray-700">
                    Enable R2 File Storage
                  </span>
                </label>
                <p class="text-xs text-gray-500 mt-1 ml-6">
                  Allow sending files and images via Cloudflare R2 storage.
                </p>
              </div>

              <button
                type="submit"
                class="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">API Documentation</h2>
          <p class="text-sm text-gray-600 mb-2">
            Use the following endpoints to interact with the chat system
            programmatically:
          </p>
          <div class="bg-gray-50 rounded p-4 font-mono text-sm space-y-2">
            <p>
              <span class="text-green-600 font-bold">GET</span>{" "}
              /api/conversations - List conversations
            </p>
            <p>
              <span class="text-blue-600 font-bold">POST</span>{" "}
              /api/conversations/:id/messages - Reply to a conversation
            </p>
            <p>
              <span class="text-green-600 font-bold">GET</span>{" "}
              /api/conversations/:id/unread - Get unread messages
            </p>
            <p>
              <span class="text-orange-600 font-bold">PATCH</span>{" "}
              /api/conversations/:id/read - Mark messages as read
            </p>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            Include <code class="bg-gray-100 px-1 rounded">Authorization: Bearer YOUR_TOKEN</code> header in all API
            requests. Full OpenAPI docs available at{" "}
            <a href="/api/docs" class="text-blue-600 hover:underline">
              /api/docs
            </a>
            .
          </p>
        </div>
      </div>
    </Layout>
  );
};
