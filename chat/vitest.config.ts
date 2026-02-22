import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          d1Databases: { DB: "test-db" },
          kvNamespaces: { KV: "test-kv" },
          r2Buckets: { R2: "test-r2" },
        },
      },
    },
    include: ["src/__tests__/**/*.test.ts"],
  },
});
