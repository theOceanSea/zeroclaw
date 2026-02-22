export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  RATE_LIMITER: RateLimit;
}

export interface SessionData {
  userId: string;
  username: string;
  expiresAt: number;
}
