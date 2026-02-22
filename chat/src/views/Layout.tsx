import type { FC, PropsWithChildren } from "hono/jsx";

interface LayoutProps {
  title: string;
  username?: string;
}

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({
  title,
  username,
  children,
}) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} - ZeroClaw Chat</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@unocss/reset/tailwind.min.css"
        />
        <script src="https://cdn.jsdelivr.net/npm/@unocss/runtime/preset-wind4.global.js"></script>
        <script src="https://unpkg.com/htmx.org@2.0.4"></script>
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"
        ></script>
        <style>{`
          [x-cloak] { display: none !important; }
          .prose { max-width: 65ch; }
          .prose p { margin-bottom: 0.5rem; }
          .prose code { background: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.875rem; }
          .prose pre { background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 0.5rem 0; }
          .prose pre code { background: transparent; color: inherit; padding: 0; }
          .prose ul, .prose ol { padding-left: 1.5rem; margin-bottom: 0.5rem; }
          .prose ul { list-style-type: disc; }
          .prose ol { list-style-type: decimal; }
          .prose blockquote { border-left: 4px solid #d1d5db; padding-left: 1rem; color: #6b7280; margin: 0.5rem 0; }
          .prose h1, .prose h2, .prose h3 { font-weight: 700; margin: 0.75rem 0 0.25rem; }
          .prose h1 { font-size: 1.25rem; }
          .prose h2 { font-size: 1.125rem; }
          .prose h3 { font-size: 1rem; }
          .prose a { color: #2563eb; text-decoration: underline; }
          .prose img { max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; }
          .message-enter { animation: fadeIn 0.2s ease-in; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </head>
      <body class="bg-gray-50 min-h-screen">
        {username ? (
          <nav class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <a href="/" class="text-lg font-bold text-gray-900">
                ZeroClaw Chat
              </a>
              <div class="flex items-center gap-4">
                <span class="text-sm text-gray-600">{username}</span>
                <a
                  href="/settings"
                  class="text-sm text-blue-600 hover:text-blue-800"
                >
                  Settings
                </a>
                <form method="post" action="/logout" class="inline">
                  <button
                    type="submit"
                    class="text-sm text-red-600 hover:text-red-800"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </nav>
        ) : null}
        <main class="max-w-4xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
};
