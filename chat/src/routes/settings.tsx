import { Hono } from "hono";
import type { Env, SessionData } from "../types/bindings";
import { getOrCreateSettings, updateSettings } from "../services/settings";
import { SettingsPage } from "../views/SettingsPage";

type Variables = {
  session: SessionData;
};

const settingsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

settingsRoutes.get("/settings", async (c) => {
  const session = c.get("session");
  const settings = await getOrCreateSettings(c.env.KV, session.userId);
  return c.html(
    <SettingsPage username={session.username} settings={settings} />
  );
});

settingsRoutes.post("/settings", async (c) => {
  const session = c.get("session");
  const body = await c.req.parseBody();

  const triggerMode =
    body["triggerMode"] === "webhook" ? "webhook" : "polling";
  const webhookUrl =
    typeof body["webhookUrl"] === "string" ? body["webhookUrl"] : "";
  const r2Enabled = body["r2Enabled"] === "true";

  if (triggerMode === "webhook" && webhookUrl) {
    try {
      new URL(webhookUrl);
    } catch {
      const settings = await getOrCreateSettings(c.env.KV, session.userId);
      return c.html(
        <SettingsPage username={session.username} settings={settings} />
      );
    }
  }

  const settings = await updateSettings(c.env.KV, session.userId, {
    triggerMode: triggerMode as "webhook" | "polling",
    webhookUrl,
    r2Enabled,
  });

  return c.html(
    <SettingsPage
      username={session.username}
      settings={settings}
      success={true}
    />
  );
});

export { settingsRoutes };
