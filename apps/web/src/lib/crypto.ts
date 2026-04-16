import { createHash, createDecipheriv, createCipheriv, randomBytes } from "node:crypto";

import { getEnv } from "@/env";

function getEncryptionKey() {
  const raw = getEnv().APP_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error("APP_ENCRYPTION_KEY is required for provider token storage.");
  }

  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(value: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const key = getEncryptionKey();
  const payload = Buffer.from(value, "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString("utf8");
}
