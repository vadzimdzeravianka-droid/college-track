import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPasskey } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { passkey } = await request.json();

    // Get all users from database
    const users = await db.user.findMany();

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid passkey" }, { status: 401 });
    }

    // Find user by verifying passkey against each hashed passkey
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

    // Set user_id cookie (new multi-user approach)
    cookieStore.set("user_id", authenticatedUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Also set is_authorized for backward compatibility during transition
    cookieStore.set("is_authorized", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}
