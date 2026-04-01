import { hashPasskey, verifyPasskey, getCurrentUserId, requireAuth } from "../auth";
import { cookies } from "next/headers";

// Mock next/headers
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

// Mock environment variable
process.env.PASSKEY_HASH_SECRET = "test-secret-key-for-hashing";

describe("Password Hashing", () => {
  describe("hashPasskey", () => {
    it("should generate a bcrypt hash", async () => {
      const passkey = "test123";
      const hash = await hashPasskey(passkey);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/); // bcrypt hash pattern
      expect(hash).not.toBe(passkey); // Should not be plain text
    });

    it("should generate different hashes for same passkey (salt)", async () => {
      const passkey = "test123";
      const hash1 = await hashPasskey(passkey);
      const hash2 = await hashPasskey(passkey);

      // Hashes should be different due to unique salts
      expect(hash1).not.toBe(hash2);
    });

    it("should throw error if PASSKEY_HASH_SECRET not set", async () => {
      const originalSecret = process.env.PASSKEY_HASH_SECRET;
      delete process.env.PASSKEY_HASH_SECRET;

      await expect(hashPasskey("test")).rejects.toThrow("PASSKEY_HASH_SECRET");

      process.env.PASSKEY_HASH_SECRET = originalSecret;
    });
  });

  describe("verifyPasskey", () => {
    it("should return true for correct passkey", async () => {
      const passkey = "test123";
      const hash = await hashPasskey(passkey);

      const result = await verifyPasskey(passkey, hash);
      expect(result).toBe(true);
    });

    it("should return false for incorrect passkey", async () => {
      const passkey = "test123";
      const wrongPasskey = "wrong456";
      const hash = await hashPasskey(passkey);

      const result = await verifyPasskey(wrongPasskey, hash);
      expect(result).toBe(false);
    });

    it("should handle empty passkey", async () => {
      const hash = await hashPasskey("test123");
      const result = await verifyPasskey("", hash);

      expect(result).toBe(false);
    });
  });
});

describe("Cookie-based Authentication", () => {
  describe("getCurrentUserId", () => {
    it("should return userId when cookie exists", async () => {
      const mockCookies = {
        get: jest.fn((name) => {
          if (name === "user_id") {
            return { value: "user-123" };
          }
          return undefined;
        }),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);

      const userId = await getCurrentUserId();
      expect(userId).toBe("user-123");
    });

    it("should return null when cookie missing", async () => {
      const mockCookies = {
        get: jest.fn(() => undefined),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);

      const userId = await getCurrentUserId();
      expect(userId).toBeNull();
    });
  });

  describe("requireAuth", () => {
    it("should return userId when authenticated", async () => {
      const mockCookies = {
        get: jest.fn((name) => {
          if (name === "user_id") {
            return { value: "user-456" };
          }
          return undefined;
        }),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);

      const userId = await requireAuth();
      expect(userId).toBe("user-456");
    });

    it("should throw error when not authenticated", async () => {
      const mockCookies = {
        get: jest.fn(() => undefined),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookies);

      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });
  });
});
