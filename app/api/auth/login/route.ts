import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPasskey } from "@/lib/auth";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 30 * 24 * 60 * 60, // 30 days
};

export async function POST(request: Request) {
  try {
    const { passkey } = await request.json();

    // Get all users from database
    const users = await db.user.findMany();

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid passkey" }, { status: 401 });
    }

    // Find user by verifying passkey (bcrypt.compare is already timing-safe)
    let authenticatedUser = null;
    for (const user of users) {
      const isValid = await verifyPasskey(passkey, user.hashedPasskey);
      if (isValid) {
        authenticatedUser = user;
        break;
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Invalid passkey" }, { status: 401 });
    }

    // Set cookies
    const cookieStore = await cookies();

    cookieStore.set("user_id", authenticatedUser.id, COOKIE_OPTIONS);
    cookieStore.set("is_authorized", "true", COOKIE_OPTIONS);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}
