export const config = {
  appName: "ZeroClaw Chat",
  sessionCookieName: "zchat_session",
  sessionTtlSeconds: 86400,
  kvSessionPrefix: "session:",
  kvSettingsPrefix: "settings:",
  kvBearerPrefix: "bearer:",
  messagesPerPage: 20,
  maxMessageLength: 4096,
  maxFileSize: 10 * 1024 * 1024,
  rateLimitPerMinute: 60,
  allowedImageTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
  passwordMinLength: 8,
} as const;

export type Config = typeof config;
