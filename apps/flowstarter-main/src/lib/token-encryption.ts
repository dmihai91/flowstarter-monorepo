import 'server-only';
/**
 * Token Encryption Utility
 *
 * Encrypts sensitive tokens before storing in database.
 * Uses AES-256-GCM for authenticated encryption.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes = 128 bits

/**
 * Get encryption key from environment.
 * Generate with: openssl rand -base64 32
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required');
  }
  return Buffer.from(key, 'base64');
}

/**
 * Encrypt a string value
 * @returns Base64 encoded string: iv:authTag:ciphertext
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt an encrypted token
 * @param encrypted Base64 encoded string from encryptToken
 */
export function decryptToken(encrypted: string): string {
  const key = getEncryptionKey();

  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const [ivB64, authTagB64, ciphertext] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt an object's sensitive fields
 * Useful for encrypting config objects before DB storage
 */
export function encryptConfigTokens(
  config: Record<string, unknown>,
  sensitiveFields: string[] = ['access_token', 'refresh_token']
): Record<string, unknown> {
  const encrypted = { ...config };

  for (const field of sensitiveFields) {
    if (typeof encrypted[field] === 'string') {
      encrypted[field] = encryptToken(encrypted[field] as string);
      encrypted[`${field}_encrypted`] = true;
    }
  }

  return encrypted;
}

/**
 * Decrypt an object's encrypted fields
 */
export function decryptConfigTokens(
  config: Record<string, unknown>,
  sensitiveFields: string[] = ['access_token', 'refresh_token']
): Record<string, unknown> {
  const decrypted = { ...config };

  for (const field of sensitiveFields) {
    if (
      typeof decrypted[field] === 'string' &&
      decrypted[`${field}_encrypted`]
    ) {
      decrypted[field] = decryptToken(decrypted[field] as string);
      delete decrypted[`${field}_encrypted`];
    }
  }

  return decrypted;
}

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  return Boolean(process.env.TOKEN_ENCRYPTION_KEY);
}
