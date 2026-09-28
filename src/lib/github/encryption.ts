import crypto from "crypto";

export function decryptToken(encryptedToken: string) {
  const keyHex = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error("GitHub token encryption key is not configured.");
  }

  const key = Buffer.from(keyHex, "hex");

  const [ivHex, authTagHex, encryptedHex] = encryptedToken.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted GitHub token.");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}