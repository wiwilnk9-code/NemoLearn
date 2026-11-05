/**
 * NemoLearn Cryptographic Password Hashing & Verification
 * Menggunakan Node.js native crypto scrypt dengan random salt 16-byte
 * dan timingSafeEqual untuk mencegah timing attacks.
 */

import crypto from "crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, combinedHash?: string | null): boolean {
  if (!password || !combinedHash) return false;
  try {
    const [salt, key] = combinedHash.split(":");
    if (!salt || !key) return false;

    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);

    if (keyBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export function generateCryptoToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  if (!password || typeof password !== "string") {
    return { isValid: false, message: "Kata sandi wajib diisi." };
  }
  if (password.length < 8) {
    return { isValid: false, message: "Kata sandi minimal terdiri dari 8 karakter." };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Kata sandi wajib memuat minimal 1 angka." };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, message: "Kata sandi wajib memuat minimal 1 huruf." };
  }
  return { isValid: true };
}

export function sanitizeUserOutput<T extends { passwordHash?: string; verificationToken?: string; resetPasswordToken?: string }>(user: T): Omit<T, "passwordHash" | "verificationToken" | "resetPasswordToken"> {
  const { passwordHash, verificationToken, resetPasswordToken, ...safeUser } = user;
  return safeUser;
}
