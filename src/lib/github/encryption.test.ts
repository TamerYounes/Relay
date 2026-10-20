import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptToken, encryptToken } from "./encryption";

const KEY = "a".repeat(64);

describe("token encryption", () => {
  beforeEach(() => {
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = KEY;
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  });

  it("round-trips a token", () => {
    const encrypted = encryptToken("gho_example_token");

    expect(encrypted).not.toContain("gho_example_token");
    expect(decryptToken(encrypted)).toBe("gho_example_token");
  });

  it("uses a new IV each time", () => {
    expect(encryptToken("same")).not.toBe(encryptToken("same"));
  });

  it("rejects a token that was tampered with", () => {
    const [iv, tag, data] = encryptToken("gho_example_token").split(":");
    const flipped = (data[0] === "0" ? "1" : "0") + data.slice(1);

    expect(() => decryptToken([iv, tag, flipped].join(":"))).toThrow();
  });

  it("rejects a token encrypted with a different key", () => {
    const encrypted = encryptToken("gho_example_token");
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = "b".repeat(64);

    expect(() => decryptToken(encrypted)).toThrow();
  });

  it("rejects malformed input", () => {
    expect(() => decryptToken("not-encrypted")).toThrow(
      "Invalid encrypted GitHub token.",
    );
  });

  it("requires a 32-byte key", () => {
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = "abcd";
    expect(() => encryptToken("x")).toThrow("64 hex characters");

    delete process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
    expect(() => encryptToken("x")).toThrow("not configured");
  });
});
