import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey() {
  const keyHex = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error("GitHub token encryption key is not configured.");
  }

  const key = Buffer.from(keyHex, "hex");

  if (key.length !== 32) {
    throw new Error(
      "GITHUB_TOKEN_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters).",
    );
  }

  return key;
}

/** Encrypts a token as `iv:authTag:ciphertext`, all hex. */
export function encryptToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);

  return [
    iv.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptToken(encryptedToken: string) {
  const [ivHex, authTagHex, encryptedHex] = encryptedToken.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted GitHub token.");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
