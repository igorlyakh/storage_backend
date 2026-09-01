import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return scryptSync(secret, 'hm-orders-encryption', 32);
}

export function encrypt(plainText: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decrypt(cipherText: string): string {
  const key = getKey();
  const raw = Buffer.from(cipherText, 'base64');
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = raw.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function encryptNullable(value?: string | null): string | null {
  return value ? encrypt(value) : null;
}

export function decryptNullable(value?: string | null): string | null {
  return value ? decrypt(value) : null;
}
