import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = process.env.PROJECT_ENCRYPTION_KEY
  ? Buffer.from(process.env.PROJECT_ENCRYPTION_KEY, "hex")
  : Buffer.from(
      "0000000000000000000000000000000000000000000000000000000000000000",
      "hex",
    );

export const encrypt = (text: string) => {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decrypt = (text: string) => {
  const [ivHex, authTagHex, encryptedHex] = text.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted format");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    SECRET_KEY,
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
