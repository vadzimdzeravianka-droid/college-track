import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "connected",
      env: {
        hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasPasskey: !!process.env.APP_PASSKEY,
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
      env: {
        hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasPasskey: !!process.env.APP_PASSKEY,
      }
    }, { status: 500 });
  }
}
