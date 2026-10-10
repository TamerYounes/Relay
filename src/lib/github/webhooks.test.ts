import { afterEach, describe, expect, it } from "vitest";
import { getWebhookUrl, signPayload, verifySignature } from "./webhooks";

describe("verifySignature", () => {
  const secret = "test-secret";
  const body = JSON.stringify({ action: "opened" });

  it("accepts a valid signature", () => {
    expect(verifySignature(secret, body, signPayload(secret, body))).toBe(true);
  });

  it("rejects a missing, wrong or tampered signature", () => {
    expect(verifySignature(secret, body, null)).toBe(false);
    expect(verifySignature(secret, body, signPayload("other", body))).toBe(false);
    expect(verifySignature(secret, `${body} `, signPayload(secret, body))).toBe(false);
    expect(verifySignature(secret, body, "sha256=short")).toBe(false);
  });
});

describe("getWebhookUrl", () => {
  afterEach(() => {
    delete process.env.RELAY_URL;
  });

  it("builds the URL from the request origin", () => {
    expect(getWebhookUrl("https://relay.example.com")).toBe(
      "https://relay.example.com/api/github/webhook",
    );
  });

  it("returns null for localhost", () => {
    expect(getWebhookUrl("http://localhost:3000")).toBeNull();
  });

  it("prefers RELAY_URL when set", () => {
    process.env.RELAY_URL = "https://relay.example.com";
    expect(getWebhookUrl("http://localhost:3000")).toBe(
      "https://relay.example.com/api/github/webhook",
    );
  });
});
