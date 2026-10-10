import crypto from "crypto";
import { githubFetch } from "./api";

export const WEBHOOK_EVENTS = ["pull_request", "pull_request_review"];

export function signPayload(secret: string, body: string) {
  return `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
}

export function verifySignature(
  secret: string,
  body: string,
  signature: string | null,
) {
  if (!signature) return false;

  const expected = Buffer.from(signPayload(secret, body));
  const received = Buffer.from(signature);

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

export function getWebhookUrl(origin: string) {
  const base = process.env.RELAY_URL || origin;
  const { hostname } = new URL(base);

  // GitHub can't deliver to a machine that isn't on the internet.
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  return new URL("/api/github/webhook", base).toString();
}

type Hook = { id: number; config: { url?: string } };

export async function ensureRepositoryWebhook(
  token: string,
  owner: string,
  name: string,
  url: string,
  secret: string,
) {
  const hooksPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/hooks`;

  const hooks = await githubFetch<Hook[]>(token, `${hooksPath}?per_page=100`);
  const existing = hooks.find((hook) => hook.config.url === url);

  const config = {
    active: true,
    events: WEBHOOK_EVENTS,
    config: { url, secret, content_type: "json", insecure_ssl: "0" },
  };

  if (existing) {
    await githubFetch(token, `${hooksPath}/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify(config),
    });

    return existing.id;
  }

  const hook = await githubFetch<Hook>(token, hooksPath, {
    method: "POST",
    body: JSON.stringify({ name: "web", ...config }),
  });

  return hook.id;
}
