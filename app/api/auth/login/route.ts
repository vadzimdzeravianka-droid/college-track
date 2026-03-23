import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { passkey } = await request.json();

    if (passkey === process.env.APP_PASSKEY) {
      const cookieStore = await cookies();
      cookieStore.set("is_authorized", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid passkey" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}
