import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;

    // Try to fetch colleges
    const colleges = await db.college.findMany({
      include: {
        checklist: true,
      },
      orderBy: {
        deadlineApp: "asc",
      },
    });

    return NextResponse.json({
      status: "success",
      count: colleges.length,
      colleges: colleges,
      env: {
        hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasPasskey: !!process.env.APP_PASSKEY,
      }
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasPasskey: !!process.env.APP_PASSKEY,
      }
    }, { status: 500 });
  }
}
