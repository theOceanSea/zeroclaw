import { config } from "../config";

export interface UserSettings {
  bearerToken: string;
  triggerMode: "webhook" | "polling";
  webhookUrl: string;
  r2Enabled: boolean;
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getOrCreateSettings(
  kv: KVNamespace,
  userId: string
): Promise<UserSettings> {
  const key = `${config.kvSettingsPrefix}${userId}`;
  const data = await kv.get(key);
  if (data) {
    return JSON.parse(data) as UserSettings;
  }
  const bearerToken = generateToken();
  const settings: UserSettings = {
    bearerToken,
    triggerMode: "polling",
    webhookUrl: "",
    r2Enabled: false,
  };
  await kv.put(key, JSON.stringify(settings));
  await kv.put(`${config.kvBearerPrefix}${bearerToken}`, userId);
  return settings;
}

export async function updateSettings(
  kv: KVNamespace,
  userId: string,
  updates: Partial<Pick<UserSettings, "triggerMode" | "webhookUrl" | "r2Enabled">>
): Promise<UserSettings> {
  const current = await getOrCreateSettings(kv, userId);
  const updated: UserSettings = {
    ...current,
    ...updates,
  };
  await kv.put(`${config.kvSettingsPrefix}${userId}`, JSON.stringify(updated));
  return updated;
}

export async function getUserIdByBearer(
  kv: KVNamespace,
  token: string
): Promise<string | null> {
  return kv.get(`${config.kvBearerPrefix}${token}`);
}
