import type { Env } from "./types/bindings";

declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {}
}
