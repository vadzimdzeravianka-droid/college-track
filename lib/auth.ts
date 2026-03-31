import { cookies } from "next/headers";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hash a passkey using bcrypt with salt and pepper
 * @param passkey - Plain text passkey to hash
 * @returns Bcrypt hash string
 * @throws Error if PASSKEY_HASH_SECRET is not set
 */
export async function hashPasskey(passkey: string): Promise<string> {
  if (!process.env.PASSKEY_HASH_SECRET) {
    throw new Error("PASSKEY_HASH_SECRET environment variable is required");
  }

  // Add pepper (secret) to passkey before hashing
  const pepperedPasskey = passkey + process.env.PASSKEY_HASH_SECRET;

  // Bcrypt automatically generates unique salt for each hash
  const hash = await bcrypt.hash(pepperedPasskey, SALT_ROUNDS);

  return hash;
}

/**
 * Verify a passkey against a bcrypt hash
 * @param passkey - Plain text passkey to verify
 * @param hashedPasskey - Bcrypt hash to compare against
 * @returns True if passkey matches, false otherwise
 */
export async function verifyPasskey(
  passkey: string,
  hashedPasskey: string
): Promise<boolean> {
  if (!process.env.PASSKEY_HASH_SECRET) {
    throw new Error("PASSKEY_HASH_SECRET environment variable is required");
  }

  // Add same pepper before comparing
  const pepperedPasskey = passkey + process.env.PASSKEY_HASH_SECRET;

  // Bcrypt.compare is timing-safe
  const isValid = await bcrypt.compare(pepperedPasskey, hashedPasskey);

  return isValid;
}

/**
 * Get the current user ID from cookies
 * @returns User ID string if authenticated, null otherwise
 */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  return userId || null;
}

/**
 * Require authentication and return user ID
 * @returns User ID string
 * @throws Error if user is not authenticated
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Unauthorized: No user ID in session");
  }

  return userId;
}
