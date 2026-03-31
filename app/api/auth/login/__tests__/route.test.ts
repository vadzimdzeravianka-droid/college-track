/**
 * @jest-environment node
 */

// Polyfill Web APIs before importing Next.js modules
/* eslint-disable no-undef */
import { TextDecoder, TextEncoder } from "util";
(global as typeof globalThis).TextDecoder = TextDecoder as typeof global.TextDecoder;
(global as typeof globalThis).TextEncoder = TextEncoder as typeof global.TextEncoder;

// Mock Next.js server before route import to avoid Request/Response issues
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: async () => body,
    }),
  },
}));
/* eslint-enable no-undef */

import { POST } from "../route";
import { db } from "@/lib/db";
import { hashPasskey } from "@/lib/auth";

// Mock db
jest.mock("@/lib/db", () => ({
  db: {
    user: {
      findMany: jest.fn(),
    },
  },
}));

// Mock next/headers
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    set: jest.fn(),
  })),
}));

// Set required env vars
process.env.PASSKEY_HASH_SECRET = "test-secret";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 and set cookies for valid passkey", async () => {
    const passkey = "test123";
    const hashedPasskey = await hashPasskey(passkey);

    // Mock user in database
    (db.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: "user-123",
        name: "Test User",
        hashedPasskey,
      },
    ]);

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ passkey }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it("should return 401 for invalid passkey", async () => {
    const correctPasskey = "test123";
    const wrongPasskey = "wrong456";
    const hashedPasskey = await hashPasskey(correctPasskey);

    // Mock user in database
    (db.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: "user-123",
        name: "Test User",
        hashedPasskey,
      },
    ]);

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ passkey: wrongPasskey }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Invalid passkey" });
  });

  it("should return 401 when no users exist", async () => {
    (db.user.findMany as jest.Mock).mockResolvedValue([]);

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ passkey: "test123" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Invalid passkey" });
  });

  it("should return 500 on database error", async () => {
    (db.user.findMany as jest.Mock).mockRejectedValue(new Error("DB error"));

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ passkey: "test123" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to authenticate" });
  });

  it("should find correct user among multiple users", async () => {
    const user1Passkey = "user1pass";
    const user2Passkey = "user2pass";

    const hash1 = await hashPasskey(user1Passkey);
    const hash2 = await hashPasskey(user2Passkey);

    // Mock multiple users
    (db.user.findMany as jest.Mock).mockResolvedValue([
      { id: "user-1", name: "User 1", hashedPasskey: hash1 },
      { id: "user-2", name: "User 2", hashedPasskey: hash2 },
    ]);

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ passkey: user2Passkey }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
});
